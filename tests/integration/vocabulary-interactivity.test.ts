import { afterEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";

// Mock both @/lib/tts and @/lib/ai directly, same reasoning as
// dialogue-audio.test.ts: with a real OPENAI_API_KEY configured locally,
// relying on env absence for "no real network calls" no longer holds.
const { synthesizeMock } = vi.hoisted(() => ({ synthesizeMock: vi.fn() }));
vi.mock("@/lib/tts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/tts")>();
  return {
    ...actual,
    getTtsProvider: () => ({ name: "test-mock", synthesize: synthesizeMock }),
  };
});

const { completeMock } = vi.hoisted(() => ({ completeMock: vi.fn() }));
vi.mock("@/lib/ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai")>();
  return {
    ...actual,
    getAiProvider: () => ({ name: "test-mock", complete: completeMock }),
  };
});

const { authMock } = vi.hoisted(() => ({ authMock: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: authMock }));

const {
  getVocabularyItemAudioAction,
  getVocabularyExampleAudioAction,
  getVocabularyExamplesAction,
} = await import("@/lib/actions/vocabulary-interactivity");
const { getOrGenerateVocabularyItemAudioUrl, getVocabularyExamples } =
  await import("@/lib/vocabulary-interactivity");

const testEmails: string[] = [];
const testVocabularyIds: string[] = [];

afterEach(async () => {
  vi.clearAllMocks();
  synthesizeMock.mockReset();
  completeMock.mockReset();
  if (testVocabularyIds.length > 0) {
    await db.vocabularyItem.deleteMany({
      where: { id: { in: testVocabularyIds } },
    });
    testVocabularyIds.length = 0;
  }
  if (testEmails.length > 0) {
    await db.user.deleteMany({ where: { email: { in: testEmails } } });
    testEmails.length = 0;
  }
});

/**
 * Unique per call (not fixed real-looking words) since audio is now cached
 * by content hash, not row id (audio-content-key.ts) - a fixed string could
 * collide with audio a real dev-server run already generated for that same
 * word/sentence, making the "was TTS called" assertions below unreliable.
 */
function uniqueTestText(): string {
  return `你好${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
}

async function createTestUser(email: string) {
  testEmails.push(email);
  const user = await db.user.create({ data: { email } });
  authMock.mockResolvedValue({ user: { id: user.id } });
  return user;
}

async function createTestVocabularyItem() {
  const item = await db.vocabularyItem.create({
    data: {
      chineseForm: uniqueTestText(),
      pinyin: "diǎn cài",
      meaning: "to order food",
      partOfSpeech: "verb",
      status: "PUBLISHED",
    },
  });
  testVocabularyIds.push(item.id);
  return item;
}

const FIXTURE_EXAMPLES = [
  {
    chineseText: "我们可以点菜了吗？",
    pinyin: "Wǒmen kěyǐ diǎn cài le ma?",
    translation: "Can we order now?",
  },
  {
    chineseText: "你点菜了吗？",
    pinyin: "Nǐ diǎn cài le ma?",
    translation: "Have you ordered yet?",
  },
];

describe("Vocabulary word audio (integration, real database, mocked TTS provider)", () => {
  it("generates audio once and reuses it on replay", async () => {
    const user = await createTestUser(`vocab-audio-${Date.now()}@hango.dev`);
    const item = await createTestVocabularyItem();

    synthesizeMock.mockResolvedValue({
      audio: Buffer.from("fake wav bytes"),
      contentType: "audio/wav",
      provider: "test-mock",
      model: "test-model",
    });

    const firstUrl = await getOrGenerateVocabularyItemAudioUrl(
      user.id,
      item.id,
    );
    expect(firstUrl).toBeTruthy();
    expect(synthesizeMock).toHaveBeenCalledTimes(1);
    expect(synthesizeMock).toHaveBeenCalledWith(
      item.chineseForm,
      expect.any(String),
    );

    const stored = await db.vocabularyItem.findUniqueOrThrow({
      where: { id: item.id },
    });
    expect(stored.audioFilePath).toBeTruthy();

    await getOrGenerateVocabularyItemAudioUrl(user.id, item.id);
    expect(synthesizeMock).toHaveBeenCalledTimes(1);
  });

  it("the server action rejects unauthenticated requests", async () => {
    authMock.mockResolvedValue(null);
    const result = await getVocabularyItemAudioAction("nonexistent-id");
    expect(result.ok).toBe(false);
    expect(synthesizeMock).not.toHaveBeenCalled();
  });
});

describe("Vocabulary examples (integration, real database, mocked TTS provider)", () => {
  it("returns a word's hand-authored examples without calling AI", async () => {
    const user = await createTestUser(`vocab-examples-${Date.now()}@hango.dev`);
    const item = await createTestVocabularyItem();
    await db.vocabularyExample.createMany({
      data: FIXTURE_EXAMPLES.map((example, order) => ({
        ...example,
        vocabularyItemId: item.id,
        order,
      })),
    });

    const examples = await getVocabularyExamples(user.id, item.id);
    expect(examples).toHaveLength(2);
    expect(examples[0]?.chineseText).toBe("我们可以点菜了吗？");
    expect(completeMock).not.toHaveBeenCalled();
  });

  it("returns an empty list when the word has no examples authored yet", async () => {
    const user = await createTestUser(`vocab-no-examples-${Date.now()}@hango.dev`);
    const item = await createTestVocabularyItem();

    const examples = await getVocabularyExamples(user.id, item.id);
    expect(examples).toEqual([]);
    expect(completeMock).not.toHaveBeenCalled();
  });

  it("generates example audio once and reuses it on replay", async () => {
    const item = await createTestVocabularyItem();
    const example = await db.vocabularyExample.create({
      data: {
        chineseText: uniqueTestText(),
        pinyin: "nǐ hǎo",
        translation: "Hello",
        vocabularyItemId: item.id,
        order: 0,
      },
    });
    await createTestUser(`vocab-example-audio-${Date.now()}@hango.dev`);

    synthesizeMock.mockResolvedValue({
      audio: Buffer.from("fake wav bytes"),
      contentType: "audio/wav",
      provider: "test-mock",
      model: "test-model",
    });

    const result = await getVocabularyExampleAudioAction(example.id);
    expect(result.ok).toBe(true);
    expect(synthesizeMock).toHaveBeenCalledTimes(1);

    await getVocabularyExampleAudioAction(example.id);
    expect(synthesizeMock).toHaveBeenCalledTimes(1);
  });

  it("the server action rejects unauthenticated requests", async () => {
    authMock.mockResolvedValue(null);
    const result = await getVocabularyExamplesAction("nonexistent-id");
    expect(result.ok).toBe(false);
    expect(completeMock).not.toHaveBeenCalled();
  });
});
