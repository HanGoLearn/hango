import { afterEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";

// The real OpenAI/mock choice for TTS is exercised by the provider's own
// unit-level shape (src/lib/tts/providers/*) — this integration test mocks
// @/lib/tts directly so it never makes a real network call or depends on
// whether OPENAI_API_KEY happens to be set in this environment (unlike
// AI/STT, this one isn't network-free-by-default via env absence, since a
// real key is now configured locally — see project/TASKS.md).
const { synthesizeMock } = vi.hoisted(() => ({
  synthesizeMock: vi.fn(),
}));
vi.mock("@/lib/tts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/tts")>();
  return {
    ...actual,
    getTtsProvider: () => ({ name: "test-mock", synthesize: synthesizeMock }),
  };
});

const { authMock } = vi.hoisted(() => ({ authMock: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: authMock }));

const { getDialogueLineAudioAction, getDialogueAudioAction } =
  await import("@/lib/actions/dialogue-audio");
const { getOrGenerateDialogueLineAudioUrl, getOrGenerateDialogueAudioUrl } =
  await import("@/lib/dialogue-audio");

/** Minimal but valid 16-bit PCM mono WAV - mergeWavAudio needs real headers. */
function buildTestWav(): Buffer {
  const dataLength = 100;
  const buffer = Buffer.alloc(44 + dataLength);
  buffer.write("RIFF", 0, "ascii");
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write("WAVE", 8, "ascii");
  buffer.write("fmt ", 12, "ascii");
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(8000, 24);
  buffer.writeUInt32LE(16000, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36, "ascii");
  buffer.writeUInt32LE(dataLength, 40);
  buffer.fill(50, 44); // non-silent so trimWavSilence keeps it
  return buffer;
}

const testEmails: string[] = [];
const testDialogueIds: string[] = [];

afterEach(async () => {
  vi.clearAllMocks();
  synthesizeMock.mockReset();
  if (testDialogueIds.length > 0) {
    await db.dialogue.deleteMany({ where: { id: { in: testDialogueIds } } });
    testDialogueIds.length = 0;
  }
  if (testEmails.length > 0) {
    await db.user.deleteMany({ where: { email: { in: testEmails } } });
    testEmails.length = 0;
  }
});

async function createTestUser(email: string) {
  testEmails.push(email);
  const user = await db.user.create({ data: { email } });
  authMock.mockResolvedValue({ user: { id: user.id } });
  return user;
}

async function createTestDialogueLine() {
  const lesson = await db.lesson.findFirstOrThrow();
  const dialogue = await db.dialogue.create({
    data: {
      lessonId: lesson.id,
      title: "Test dialogue (dialogue-audio integration test)",
      speakers: {
        create: [{ name: "Waiter", order: 0 }],
      },
    },
    include: { speakers: true },
  });
  testDialogueIds.push(dialogue.id);

  const speaker = dialogue.speakers[0];
  if (!speaker) throw new Error("Speaker fixture was not created");

  const line = await db.dialogueLine.create({
    data: {
      dialogueId: dialogue.id,
      speakerId: speaker.id,
      order: 0,
      chineseText: "你好",
      pinyin: "nǐ hǎo",
      translation: "Hello",
    },
  });

  return line;
}

async function createTestDialogueWithTwoLines() {
  const lesson = await db.lesson.findFirstOrThrow();
  const dialogue = await db.dialogue.create({
    data: {
      lessonId: lesson.id,
      title:
        "Test dialogue (dialogue-audio integration test, full conversation)",
      speakers: {
        create: [
          { name: "Waiter", order: 0 },
          { name: "Customer", order: 1 },
        ],
      },
    },
    include: { speakers: { orderBy: { order: "asc" } } },
  });
  testDialogueIds.push(dialogue.id);

  const [waiter, customer] = dialogue.speakers;
  if (!waiter || !customer)
    throw new Error("Speaker fixtures were not created");

  await db.dialogueLine.create({
    data: {
      dialogueId: dialogue.id,
      speakerId: waiter.id,
      order: 0,
      chineseText: "你好",
      pinyin: "nǐ hǎo",
      translation: "Hello",
    },
  });
  await db.dialogueLine.create({
    data: {
      dialogueId: dialogue.id,
      speakerId: customer.id,
      order: 1,
      chineseText: "你好吗",
      pinyin: "nǐ hǎo ma",
      translation: "How are you",
    },
  });

  return dialogue;
}

describe("Dialogue line audio (integration, real database, mocked TTS provider)", () => {
  it("generates audio once, persists the storage key, and reuses it on replay", async () => {
    const user = await createTestUser(`dialogue-audio-${Date.now()}@hango.dev`);
    const line = await createTestDialogueLine();

    synthesizeMock.mockResolvedValue({
      audio: Buffer.from("fake mp3 bytes"),
      contentType: "audio/mpeg",
      provider: "test-mock",
      model: "test-model",
    });

    const firstUrl = await getOrGenerateDialogueLineAudioUrl(user.id, line.id);
    expect(firstUrl).toBeTruthy();
    expect(synthesizeMock).toHaveBeenCalledTimes(1);
    expect(synthesizeMock).toHaveBeenCalledWith("你好", expect.any(String));

    const stored = await db.dialogueLine.findUniqueOrThrow({
      where: { id: line.id },
    });
    expect(stored.audioFilePath).toBeTruthy();

    const secondUrl = await getOrGenerateDialogueLineAudioUrl(user.id, line.id);
    expect(secondUrl).toBeTruthy();
    // Second call reuses the cached key — no second TTS call.
    expect(synthesizeMock).toHaveBeenCalledTimes(1);
  });

  it("the server action rejects unauthenticated requests", async () => {
    authMock.mockResolvedValue(null);
    const result = await getDialogueLineAudioAction("nonexistent-line-id");
    expect(result.ok).toBe(false);
    expect(synthesizeMock).not.toHaveBeenCalled();
  });

  it("the server action returns an error for a line that doesn't exist", async () => {
    const user = await createTestUser(
      `dialogue-audio-missing-${Date.now()}@hango.dev`,
    );
    void user;
    const result = await getDialogueLineAudioAction("nonexistent-line-id");
    expect(result.ok).toBe(false);
  });
});

describe("Full-conversation audio (integration, real database, mocked TTS provider)", () => {
  it("merges every line into one cached, seekable clip and reuses it on replay", async () => {
    const user = await createTestUser(
      `dialogue-audio-full-${Date.now()}@hango.dev`,
    );
    const dialogue = await createTestDialogueWithTwoLines();

    synthesizeMock.mockResolvedValue({
      audio: buildTestWav(),
      contentType: "audio/wav",
      provider: "test-mock",
      model: "test-model",
    });

    const firstUrl = await getOrGenerateDialogueAudioUrl(user.id, dialogue.id);
    expect(firstUrl).toBeTruthy();
    // One TTS call per line - both lines started with no cached audio.
    expect(synthesizeMock).toHaveBeenCalledTimes(2);

    const stored = await db.dialogue.findUniqueOrThrow({
      where: { id: dialogue.id },
    });
    expect(stored.audioFilePath).toBeTruthy();

    const secondUrl = await getOrGenerateDialogueAudioUrl(user.id, dialogue.id);
    expect(secondUrl).toBeTruthy();
    // Second call reuses the cached merged file - no further TTS calls.
    expect(synthesizeMock).toHaveBeenCalledTimes(2);
  });

  it("reuses already-generated line audio instead of regenerating it", async () => {
    const user = await createTestUser(
      `dialogue-audio-partial-${Date.now()}@hango.dev`,
    );
    const dialogue = await createTestDialogueWithTwoLines();

    synthesizeMock.mockResolvedValue({
      audio: buildTestWav(),
      contentType: "audio/wav",
      provider: "test-mock",
      model: "test-model",
    });

    const [firstLine] = await db.dialogueLine.findMany({
      where: { dialogueId: dialogue.id },
      orderBy: { order: "asc" },
    });
    if (!firstLine) throw new Error("Expected a seeded line");
    await getOrGenerateDialogueLineAudioUrl(user.id, firstLine.id);
    synthesizeMock.mockClear();

    await getOrGenerateDialogueAudioUrl(user.id, dialogue.id);
    // Only the second line still needed generation.
    expect(synthesizeMock).toHaveBeenCalledTimes(1);
  });

  it("the server action rejects unauthenticated requests", async () => {
    authMock.mockResolvedValue(null);
    const result = await getDialogueAudioAction("nonexistent-dialogue-id");
    expect(result.ok).toBe(false);
    expect(synthesizeMock).not.toHaveBeenCalled();
  });
});
