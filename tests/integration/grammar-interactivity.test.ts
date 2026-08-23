import { afterEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";

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
  getGrammarExampleAudioAction,
  getGrammarExamplesAction,
  getGrammarExercisesAction,
} = await import("@/lib/actions/grammar-interactivity");
const {
  getOrGenerateGrammarExampleAudioUrl,
  getGrammarExamples,
  getGrammarExercises,
} = await import("@/lib/grammar-interactivity");

const testEmails: string[] = [];
const testGrammarPointIds: string[] = [];

afterEach(async () => {
  vi.clearAllMocks();
  synthesizeMock.mockReset();
  completeMock.mockReset();
  if (testGrammarPointIds.length > 0) {
    await db.grammarPoint.deleteMany({
      where: { id: { in: testGrammarPointIds } },
    });
    testGrammarPointIds.length = 0;
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

/**
 * Unique per call (not a fixed real-looking sentence) since audio is now
 * cached by content hash, not row id (audio-content-key.ts) - a fixed
 * string could collide with audio a real dev-server run already generated
 * for that same sentence, making the "was TTS called" assertion below
 * unreliable.
 */
function uniqueTestText(): string {
  return `你好${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
}

/** One grammar point, linked to a real lesson, with exactly 1 seeded example - mirrors real seed data. */
async function createTestGrammarPoint(
  exampleChineseText = "我要一杯咖啡。",
) {
  const lesson = await db.lesson.findFirstOrThrow();
  const point = await db.grammarPoint.create({
    data: {
      name: "我要...",
      structure: "我要 + [item]",
      explanation: "Used to state what you want.",
      communicationPurpose: "Ordering food or requesting an item",
      status: "PUBLISHED",
      examples: {
        create: [
          {
            chineseText: exampleChineseText,
            pinyin: "Wǒ yào yì bēi kāfēi.",
            translation: "I want a coffee.",
            order: 0,
          },
        ],
      },
      lessons: { create: [{ lessonId: lesson.id, order: 0 }] },
    },
  });
  testGrammarPointIds.push(point.id);
  return point;
}

describe("Grammar example audio (integration, real database, mocked TTS provider)", () => {
  it("generates audio once and reuses it on replay", async () => {
    const user = await createTestUser(`grammar-audio-${Date.now()}@hango.dev`);
    const point = await createTestGrammarPoint(uniqueTestText());
    const [example] = await db.grammarExample.findMany({
      where: { grammarPointId: point.id },
    });
    if (!example) throw new Error("Expected the seeded example");

    synthesizeMock.mockResolvedValue({
      audio: Buffer.from("fake wav bytes"),
      contentType: "audio/wav",
      provider: "test-mock",
      model: "test-model",
    });

    const firstUrl = await getOrGenerateGrammarExampleAudioUrl(
      user.id,
      example.id,
    );
    expect(firstUrl).toBeTruthy();
    expect(synthesizeMock).toHaveBeenCalledTimes(1);

    await getOrGenerateGrammarExampleAudioUrl(user.id, example.id);
    expect(synthesizeMock).toHaveBeenCalledTimes(1);
  });

  it("the server action rejects unauthenticated requests", async () => {
    authMock.mockResolvedValue(null);
    const result = await getGrammarExampleAudioAction("nonexistent-id");
    expect(result.ok).toBe(false);
    expect(synthesizeMock).not.toHaveBeenCalled();
  });
});

describe("Grammar examples (integration, real database)", () => {
  it("returns a point's hand-authored examples without calling AI", async () => {
    const point = await createTestGrammarPoint();
    await db.grammarExample.create({
      data: {
        grammarPointId: point.id,
        order: 1,
        chineseText: "我要两个人的位子。",
        pinyin: "Wǒ yào liǎng ge rén de wèizi.",
        translation: "I'd like a table for two.",
      },
    });

    const examples = await getGrammarExamples(point.id);
    expect(examples).toHaveLength(2);
    expect(examples[0]?.chineseText).toBe("我要一杯咖啡。");
    expect(completeMock).not.toHaveBeenCalled();
  });

  it("the server action rejects unauthenticated requests", async () => {
    authMock.mockResolvedValue(null);
    const result = await getGrammarExamplesAction("nonexistent-id");
    expect(result.ok).toBe(false);
    expect(completeMock).not.toHaveBeenCalled();
  });
});

describe("Grammar exercises (integration, real database)", () => {
  it("returns a point's hand-authored published exercises without calling AI", async () => {
    const point = await createTestGrammarPoint();
    const lesson = await db.lesson.findFirstOrThrow();
    await db.exercise.create({
      data: {
        lessonId: lesson.id,
        grammarPointId: point.id,
        type: "MULTIPLE_CHOICE",
        difficulty: "INTERMEDIATE",
        prompt: "我___一杯咖啡。",
        correctAnswer: { optionIndex: 0 },
        explanation: "要 states what you want directly.",
        status: "PUBLISHED",
        order: 0,
        options: {
          create: [
            { content: "要", isCorrect: true, order: 0 },
            { content: "是", isCorrect: false, order: 1 },
          ],
        },
      },
    });

    const exercises = await getGrammarExercises(point.id);
    expect(exercises).toHaveLength(1);
    expect(exercises[0]?.type).toBe("MULTIPLE_CHOICE");
    expect(completeMock).not.toHaveBeenCalled();
  });

  it("the server action rejects unauthenticated requests", async () => {
    authMock.mockResolvedValue(null);
    const result = await getGrammarExercisesAction("nonexistent-id");
    expect(result.ok).toBe(false);
    expect(completeMock).not.toHaveBeenCalled();
  });
});
