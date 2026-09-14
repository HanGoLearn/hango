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

const { getWordsOfTheDay } = await import("@/lib/words-of-the-day");
const { getDashboardData } = await import("@/lib/dashboard-data");
const { lookupVocabularyWordAction } = await import(
  "@/lib/actions/vocabulary-lookup"
);

const testEmails: string[] = [];
const testCacheInputs: string[] = [];

afterEach(async () => {
  vi.clearAllMocks();
  completeMock.mockReset();
  if (testCacheInputs.length > 0) {
    await db.vocabularyLookupCache.deleteMany({
      where: { normalizedInput: { in: testCacheInputs } },
    });
    testCacheInputs.length = 0;
  }
  if (testEmails.length > 0) {
    await db.user.deleteMany({ where: { email: { in: testEmails } } });
    testEmails.length = 0;
  }
});

async function createTestUser(email: string, generalLevelPoints = 0) {
  testEmails.push(email);
  const user = await db.user.create({ data: { email } });
  await db.learnerProfile.create({
    data: { userId: user.id, generalLevelPoints },
  });
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

describe("Words of the Day (2026-09-01, integration, real database)", () => {
  it("picks 3 real, published words for a mid level without calling the AI provider", async () => {
    const words = await getWordsOfTheDay(4, new Date("2026-09-10T00:00:00Z"));
    expect(words).toHaveLength(3);
    for (const word of words) {
      expect(word.chineseForm.length).toBeGreaterThan(0);
      expect(word.pinyin.length).toBeGreaterThan(0);
    }
    expect(completeMock).not.toHaveBeenCalled();
  });

  it("falls back to level 1's real pool for a total beginner (level 0) - no level-0 pool exists", async () => {
    const level0 = await getWordsOfTheDay(0, new Date("2026-09-11T00:00:00Z"));
    const level1 = await getWordsOfTheDay(1, new Date("2026-09-11T00:00:00Z"));
    expect(level0).toEqual(level1);
    expect(completeMock).not.toHaveBeenCalled();
  });

  it("getDashboardData includes wordsOfTheDay for a real user, still without calling the AI provider", async () => {
    const user = await createTestUser(
      `words-of-the-day-dashboard-${Date.now()}@hango.dev`,
      900,
    );
    const data = await getDashboardData(user.id);
    expect(data.wordsOfTheDay).toHaveLength(3);
    expect(completeMock).not.toHaveBeenCalled();
  });

  it("tapping one of today's words generates the full card through the existing Vocabulary pipeline", async () => {
    await createTestUser(`words-of-the-day-tap-${Date.now()}@hango.dev`, 0);
    const words = await getWordsOfTheDay(2, new Date("2026-09-12T00:00:00Z"));
    const target = words[0]!;
    completeMock.mockResolvedValueOnce(
      mockCompletion(
        JSON.stringify({
          hero: {
            emoji: "🈶",
            title: target.chineseForm,
            subtitle: `${target.pinyin} — ${target.meaning}`,
          },
          frequencyTier: "common",
          explanation: "A word from today's picks.",
          examples: [
            {
              emoji: "✅",
              chinese: "示例句子。",
              pinyin: "shili juzi.",
              translation: "Example sentence.",
            },
          ],
          related: [],
          mistakes: null,
          chineseGloss: null,
          curiosity: null,
        }),
      ),
    );

    const lookupInput = `wotd-test-${Date.now()}`;
    testCacheInputs.push(lookupInput);
    const response = await lookupVocabularyWordAction(lookupInput, "en");
    expect(response.ok).toBe(true);
    if (response.ok) {
      expect(response.result.hero.title).toBe(target.chineseForm);
    }
  });
});
