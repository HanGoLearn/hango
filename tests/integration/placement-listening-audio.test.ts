import { afterEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";

// Same reasoning as dialogue-audio.test.ts (the pattern this file's
// generate-once-cache-forever design mirrors): mock @/lib/tts directly so
// this never makes a real network call regardless of local env, storage
// stays real (LocalStorageProvider, gitignored .storage/ folder).
const { synthesizeMock } = vi.hoisted(() => ({ synthesizeMock: vi.fn() }));
vi.mock("@/lib/tts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/tts")>();
  return {
    ...actual,
    getTtsProvider: () => ({ name: "test-mock", synthesize: synthesizeMock }),
  };
});

const { authMock } = vi.hoisted(() => ({ authMock: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: authMock }));

const { getOrGeneratePlacementListeningAudioUrl, PlacementAudioNotFoundError } =
  await import("@/lib/placement-listening-audio");
const { getPlacementListeningAudioAction } =
  await import("@/lib/actions/placement-exam");

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
const testQuestionIds: string[] = [];

afterEach(async () => {
  vi.clearAllMocks();
  synthesizeMock.mockReset();
  if (testQuestionIds.length > 0) {
    // Cascades to PlacementListeningScript and PlacementListeningLine.
    await db.placementQuestion.deleteMany({
      where: { id: { in: testQuestionIds } },
    });
    testQuestionIds.length = 0;
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

function uniqueTestText(): string {
  return `你好${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
}

async function createTestListeningQuestion(lineCount = 1) {
  const question = await db.placementQuestion.create({
    data: {
      skill: "LISTENING",
      hskLevel: 1,
      category: "comprehension",
      prompt:
        "Test listening question (placement-listening-audio integration test)",
    },
  });
  testQuestionIds.push(question.id);
  const script = await db.placementListeningScript.create({
    data: { questionId: question.id },
  });
  await db.placementListeningLine.createMany({
    data: Array.from({ length: lineCount }, (_, order) => ({
      scriptId: script.id,
      speaker: "A",
      order,
      chineseText: uniqueTestText(),
    })),
  });
  return { question, script };
}

describe("Placement listening audio (integration, real database, mocked TTS provider)", () => {
  it("generates the merged clip once, persists the storage key, and reuses it on replay", async () => {
    const user = await createTestUser(
      `placement-audio-${Date.now()}@hango.dev`,
    );
    const { question, script } = await createTestListeningQuestion(1);
    synthesizeMock.mockResolvedValue({
      audio: buildTestWav(),
      contentType: "audio/wav",
      provider: "test-mock",
      model: "test-model",
    });

    const firstUrl = await getOrGeneratePlacementListeningAudioUrl(
      user.id,
      question.id,
    );
    expect(firstUrl).toBeTruthy();
    expect(synthesizeMock).toHaveBeenCalledTimes(1);

    const stored = await db.placementListeningScript.findUniqueOrThrow({
      where: { id: script.id },
    });
    expect(stored.audioFilePath).toBeTruthy();

    const secondUrl = await getOrGeneratePlacementListeningAudioUrl(
      user.id,
      question.id,
    );
    expect(secondUrl).toBe(firstUrl);
    // Second call reuses the merged file - no further TTS calls.
    expect(synthesizeMock).toHaveBeenCalledTimes(1);
  });

  it("throws for a question with no listening script", async () => {
    const user = await createTestUser(
      `placement-audio-noscript-${Date.now()}@hango.dev`,
    );

    await expect(
      getOrGeneratePlacementListeningAudioUrl(
        user.id,
        "nonexistent-question-id",
      ),
    ).rejects.toBeInstanceOf(PlacementAudioNotFoundError);
    expect(synthesizeMock).not.toHaveBeenCalled();
  });

  it("rate-limits line generation after 30 requests in the window", async () => {
    const user = await createTestUser(
      `placement-audio-ratelimit-${Date.now()}@hango.dev`,
    );
    const { question } = await createTestListeningQuestion(31);
    synthesizeMock.mockResolvedValue({
      audio: buildTestWav(),
      contentType: "audio/wav",
      provider: "test-mock",
      model: "test-model",
    });

    await expect(
      getOrGeneratePlacementListeningAudioUrl(user.id, question.id),
    ).rejects.toThrow(
      "You've generated a lot of new audio in a short time. Please wait a bit before continuing.",
    );
    // The 31st line's rate-limit check fails before it ever calls the TTS
    // provider - the first 30 lines still generated normally.
    expect(synthesizeMock).toHaveBeenCalledTimes(30);
  }, 30_000);

  it("the server action rejects unauthenticated requests", async () => {
    authMock.mockResolvedValue(null);

    const result = await getPlacementListeningAudioAction(
      "nonexistent-question-id",
    );
    expect(result.ok).toBe(false);
    expect(synthesizeMock).not.toHaveBeenCalled();
  });

  it("the server action returns a friendly error for a question that doesn't exist", async () => {
    const user = await createTestUser(
      `placement-audio-action-missing-${Date.now()}@hango.dev`,
    );
    void user;

    const result = await getPlacementListeningAudioAction(
      "nonexistent-question-id",
    );
    expect(result).toEqual({ ok: false, error: "That couldn't be found." });
  });

  it("the server action plays a real listening question for an authenticated user", async () => {
    const user = await createTestUser(
      `placement-audio-action-${Date.now()}@hango.dev`,
    );
    void user;
    const { question } = await createTestListeningQuestion(1);
    synthesizeMock.mockResolvedValue({
      audio: buildTestWav(),
      contentType: "audio/wav",
      provider: "test-mock",
      model: "test-model",
    });

    const result = await getPlacementListeningAudioAction(question.id);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.url).toBeTruthy();
    }
  });
});
