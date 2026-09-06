import { createTtlCache } from "@/lib/ttl-cache";
import { getVocabularyItemsForLevel } from "@/lib/content/vocabulary";

export interface WordOfTheDay {
  chineseForm: string;
  pinyin: string;
  meaning: string;
}

const WORDS_PER_DAY = 3;

/** Same deterministic day index as han-tips.ts's getDailyHanTip - same day, same words, no matter how many times the page reloads. */
function daysSinceEpoch(date: Date): number {
  return Math.floor(date.getTime() / 86_400_000);
}

/** hskLevel 0 has no VocabularyItem pool of its own (verified: 3,014 published items span only levels 1-9) - a total beginner sees level 1's pool, the closest real content that exists. */
function resolvePoolLevel(hskLevel: number): number {
  return hskLevel === 0 ? 1 : hskLevel;
}

/**
 * Shared, not personalized (2026-09-01, explicit cost decision) - every
 * learner at the same level sees the same 3 words on the same day, so this
 * cache serves any number of learners from a single query per level per
 * day, and the daily key rollover needs no manual invalidation.
 */
const getWordsForLevelAndDay = createTtlCache(
  async (poolLevel: number, dayIndex: number): Promise<WordOfTheDay[]> => {
    const items = await getVocabularyItemsForLevel(poolLevel);
    if (items.length === 0) return [];
    return Array.from(
      { length: Math.min(WORDS_PER_DAY, items.length) },
      (_, i) => items[(dayIndex * WORDS_PER_DAY + i) % items.length]!,
    );
  },
  24 * 60 * 60 * 1000,
  (poolLevel, dayIndex) => `${poolLevel}:${dayIndex}`,
);

/**
 * Takes the learner's already-resolved hskLevel rather than a userId +
 * its own profile fetch - dashboard-data.ts already reads the profile for
 * displayName/dailyStudyTargetMinutes, so this avoids a second, redundant
 * `learnerProfile` query on every Dashboard load.
 */
export async function getWordsOfTheDay(
  hskLevel: number,
  date: Date = new Date(),
): Promise<WordOfTheDay[]> {
  const poolLevel = resolvePoolLevel(hskLevel);
  return getWordsForLevelAndDay(poolLevel, daysSinceEpoch(date));
}
