import { afterEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";

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
  lookupVocabularyWord,
  VocabularyLookupInputError,
  VocabularyLookupRateLimitError,
} = await import("@/lib/vocabulary-lookup-data");
const { lookupVocabularyWordAction } = await import(
  "@/lib/actions/vocabulary-lookup"
);

const testEmails: string[] = [];

afterEach(async () => {
  vi.clearAllMocks();
  completeMock.mockReset();
  if (testEmails.length > 0) {
    await db.user.deleteMany({ where: { email: { in: testEmails } } });
    testEmails.length = 0;
  }
});

async function createTestUser(email: string, generalLevelPoints = 0) {
  testEmails.push(email);
  const user = await db.user.create({ data: { email } });
  await db.learnerProfile.create({ data: { userId: user.id, generalLevelPoints } });
  authMock.mockResolvedValue({ user: { id: user.id } });
  return user;
}

function mockCompletion(content: string) {
  return {
    content,
    provider: "test-mock",
    model: "test-model",
    inputTokens: 10,
    outputTokens: 10,
  };
}

function vocabularyJson(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    hero: { emoji: "🈶", title: "要", subtitle: "yào — to want / need" },
    frequencyTier: "very common",
    explanation: "Used to say you want or need something.",
    examples: [
      {
        emoji: "☕",
        chinese: "我要一杯咖啡。",
        pinyin: "Wǒ yào yì bēi kāfēi.",
        translation: "I want a cup of coffee.",
      },
    ],
    related: [],
    mistakes: null,
    chineseGloss: null,
    curiosity: null,
    ...overrides,
  });
}

describe("Han Vocabulary lookup (2026-09-01, integration, real database)", () => {
  it("resolves the learner's real level automatically for a beginner and omits mistakes/gloss", async () => {
    const user = await createTestUser(
      `vocab-lookup-low-${Date.now()}@hango.dev`,
      0,
    );
    completeMock.mockResolvedValueOnce(mockCompletion(vocabularyJson()));

    const result = await lookupVocabularyWord(user.id, "你好");

    expect(result?.mistakes).toBeNull();
    expect(result?.chineseGloss).toBeNull();
    expect(completeMock).toHaveBeenCalledTimes(1);
    const [{ systemPrompt }] = completeMock.mock.calls[0]!;
    expect(systemPrompt).toContain("HSK 0");
  });

  it("resolves the learner's real level automatically for an advanced learner and surfaces mistakes/gloss when the AI returns them", async () => {
    const user = await createTestUser(
      `vocab-lookup-high-${Date.now()}@hango.dev`,
      1800,
    );
    completeMock.mockResolvedValueOnce(
      mockCompletion(
        vocabularyJson({
          mistakes: "Learners often confuse 要 with 想.",
          chineseGloss: "表示需要或希望得到某物。",
        }),
      ),
    );

    const result = await lookupVocabularyWord(user.id, "要");

    expect(result?.mistakes).toBe("Learners often confuse 要 with 想.");
    expect(result?.chineseGloss).toBe("表示需要或希望得到某物。");
    const [{ systemPrompt }] = completeMock.mock.calls[0]!;
    expect(systemPrompt).toContain("HSK 8");
  });

  it("uses the visible Spanish interface for every generated field, independently of Han's explanation preference", async () => {
    const user = await createTestUser(
      `vocab-lookup-spanish-${Date.now()}@hango.dev`,
      0,
    );
    await db.learnerProfile.update({
      where: { userId: user.id },
      data: { explanationLanguage: "EN", interfaceLanguage: "ES" },
    });
    completeMock.mockResolvedValueOnce(mockCompletion(vocabularyJson()));

    await lookupVocabularyWord(user.id, "要-spanish-interface", "es");

    const [{ systemPrompt }] = completeMock.mock.calls[0]!;
    expect(systemPrompt).toContain(
      "ALL learner-facing prose is ALWAYS written in Spanish",
    );
    expect(systemPrompt).toContain("every examples[].translation");
    expect(systemPrompt).toContain("every related[].meaning");
    expect(systemPrompt).toContain(
      "Never use English learner-facing prose when the requested language is Spanish",
    );
  });

  it("caches a lookup - the same word, level, and language never calls the AI provider twice", async () => {
    const user = await createTestUser(
      `vocab-lookup-cache-${Date.now()}@hango.dev`,
      0,
    );
    completeMock.mockResolvedValueOnce(mockCompletion(vocabularyJson()));

    const first = await lookupVocabularyWord(user.id, "要-cache-test");
    const second = await lookupVocabularyWord(user.id, "要-cache-test");

    expect(completeMock).toHaveBeenCalledTimes(1);
    expect(second).toEqual(first);
  });

  it("rejects an empty input without calling the AI provider", async () => {
    const user = await createTestUser(
      `vocab-lookup-empty-${Date.now()}@hango.dev`,
      0,
    );
    await expect(lookupVocabularyWord(user.id, "   ")).rejects.toThrow(
      VocabularyLookupInputError,
    );
    expect(completeMock).not.toHaveBeenCalled();
  });

  it("rejects input over the max length without calling the AI provider", async () => {
    const user = await createTestUser(
      `vocab-lookup-toolong-${Date.now()}@hango.dev`,
      0,
    );
    await expect(
      lookupVocabularyWord(user.id, "a".repeat(51)),
    ).rejects.toThrow(VocabularyLookupInputError);
    expect(completeMock).not.toHaveBeenCalled();
  });

  it("rate-limits lookups after 20 requests", async () => {
    const user = await createTestUser(
      `vocab-lookup-ratelimit-${Date.now()}@hango.dev`,
      0,
    );
    completeMock.mockResolvedValue(mockCompletion(vocabularyJson()));

    for (let i = 0; i < 20; i++) {
      await lookupVocabularyWord(user.id, `word-${i}`);
    }

    await expect(
      lookupVocabularyWord(user.id, "one-too-many"),
    ).rejects.toBeInstanceOf(VocabularyLookupRateLimitError);
  });

  it("never touches points, achievements, or coins - a lookup is pure reference, no scoring (user decision, 2026-08-31)", async () => {
    const user = await createTestUser(
      `vocab-lookup-noscoring-${Date.now()}@hango.dev`,
      0,
    );
    completeMock.mockResolvedValueOnce(mockCompletion(vocabularyJson()));

    const result = await lookupVocabularyWord(user.id, "要");
    expect(result).not.toBeNull();

    expect(
      await db.speakingSession.count({ where: { userId: user.id } }),
    ).toBe(0);
    expect(await db.achievement.count({ where: { userId: user.id } })).toBe(
      0,
    );
    expect(
      await db.coinLedgerEntry.count({ where: { userId: user.id } }),
    ).toBe(0);
  });

  it("the server action looks up a word for an authenticated user", async () => {
    const user = await createTestUser(
      `vocab-lookup-action-${Date.now()}@hango.dev`,
      0,
    );
    void user;
    completeMock.mockResolvedValueOnce(mockCompletion(vocabularyJson()));

    const response = await lookupVocabularyWordAction("要", "en");
    expect(response.ok).toBe(true);
    if (response.ok) {
      expect(response.result.hero.title).toBe("要");
    }
  });

  it("the server action returns a friendly error when the AI response doesn't parse", async () => {
    await createTestUser(`vocab-lookup-garbled-${Date.now()}@hango.dev`, 0);
    completeMock.mockResolvedValueOnce(mockCompletion("not json at all"));

    const response = await lookupVocabularyWordAction(
      "要-garbled-test",
      "en",
    );
    expect(response.ok).toBe(false);
    if (!response.ok) {
      expect(response.error).toContain("couldn't find that word");
    }
  });

  it("the server action requires authentication", async () => {
    authMock.mockResolvedValue(null);
    await expect(lookupVocabularyWordAction("要", "en")).rejects.toThrow(
      "Not authenticated",
    );
  });

  it("rejects an unsupported interface locale", async () => {
    await createTestUser(`vocab-lookup-locale-${Date.now()}@hango.dev`, 0);

    await expect(lookupVocabularyWordAction("要", "fr")).rejects.toThrow(
      "Invalid locale",
    );
    expect(completeMock).not.toHaveBeenCalled();
  });
});
