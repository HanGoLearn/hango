import { describe, expect, it, vi, beforeEach } from "vitest";

const { getVocabularyItemsForLevel } = vi.hoisted(() => ({
  getVocabularyItemsForLevel: vi.fn(),
}));
vi.mock("@/lib/content/vocabulary", () => ({ getVocabularyItemsForLevel }));

import { getWordsOfTheDay } from "@/lib/words-of-the-day";

function itemsFor(level: number, count: number) {
  return Array.from({ length: count }, (_, i) => ({
    chineseForm: `word-${level}-${i}`,
    pinyin: `pinyin-${i}`,
    meaning: `meaning-${i}`,
  }));
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getWordsOfTheDay", () => {
  it("returns 3 words for a level with a real pool", async () => {
    getVocabularyItemsForLevel.mockResolvedValue(itemsFor(3, 30));
    const words = await getWordsOfTheDay(3, new Date("2026-09-01T00:00:00Z"));
    expect(words).toHaveLength(3);
    expect(getVocabularyItemsForLevel).toHaveBeenCalledWith(3);
  });

  it("returns the same 3 words for the same calendar day, any time of day", async () => {
    getVocabularyItemsForLevel.mockResolvedValue(itemsFor(5, 50));
    const first = await getWordsOfTheDay(
      5,
      new Date("2026-09-01T08:00:00Z"),
    );
    const second = await getWordsOfTheDay(
      5,
      new Date("2026-09-01T20:00:00Z"),
    );
    expect(second).toEqual(first);
  });

  it("returns a different selection on a different day", async () => {
    getVocabularyItemsForLevel.mockResolvedValue(itemsFor(5, 50));
    const day1 = await getWordsOfTheDay(5, new Date("2026-09-02T00:00:00Z"));
    const day2 = await getWordsOfTheDay(5, new Date("2026-09-03T00:00:00Z"));
    expect(day2).not.toEqual(day1);
  });

  it("never repeats a word within the same day's trio", async () => {
    getVocabularyItemsForLevel.mockResolvedValue(itemsFor(7, 80));
    const words = await getWordsOfTheDay(7, new Date("2026-09-04T00:00:00Z"));
    const forms = words.map((w) => w.chineseForm);
    expect(new Set(forms).size).toBe(forms.length);
  });

  it("falls back to level 1's pool for a total beginner (level 0) - VocabularyItem has no level-0 pool", async () => {
    getVocabularyItemsForLevel.mockResolvedValue(itemsFor(1, 60));
    await getWordsOfTheDay(0, new Date("2026-09-05T00:00:00Z"));
    expect(getVocabularyItemsForLevel).toHaveBeenCalledWith(1);
    expect(getVocabularyItemsForLevel).not.toHaveBeenCalledWith(0);
  });

  it("returns an empty array, not throwing, when a level has no words at all", async () => {
    getVocabularyItemsForLevel.mockResolvedValue([]);
    const words = await getWordsOfTheDay(9, new Date("2026-09-06T00:00:00Z"));
    expect(words).toEqual([]);
  });
});
