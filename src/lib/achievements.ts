import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { hskNumberForPoints, starsForScore } from "@/lib/points-system";
import {
  ACHIEVEMENTS,
  ACHIEVEMENTS_BY_KEY,
  type AchievementDefinition,
} from "@/lib/achievements-catalog";
import {
  resolveJourneyChapter,
  type JourneyChapter,
} from "@/lib/content/learning-journey";
import { createTtlCache } from "@/lib/ttl-cache";

/**
 * Achievement unlock detection (2026-08-29). One `checkXAchievements`
 * function per data domain, each called from the single existing place that
 * domain's data already changes (see the hook-in comments at each call
 * site) - this file only ever adds recognition, it never recomputes
 * anything the app didn't already compute for another reason.
 *
 * Legacy calls swallow their own errors: an achievement-unlock
 * failure must never break the real action it's attached to (lesson
 * completion, Reflection scoring, General Level recompute, etc.) - those
 * are real-data paths, and a missed badge is a far smaller problem than a
 * broken one. Journey v2 may supply a transaction to the grade/level checks:
 * errors then propagate so the entire settlement rolls back, without a false
 * rewards-confirmed marker.
 */
async function safely(label: string, run: () => Promise<void>): Promise<void> {
  try {
    await run();
  } catch (error) {
    console.error(`[achievements] ${label} failed`, error);
  }
}

/**
 * Writes the Achievement row AND its matching CoinLedgerEntry together
 * (2026-08-30, HanCoins) so a logro never exists without its coin payment.
 * Both writes use `skipDuplicates`, so it's safe to pass the FULL list of
 * currently-qualifying keys every time, not just newly-crossed ones -
 * already-unlocked keys (including one whose achievement row exists but
 * whose coin grant failed on a previous call) are retried for free and
 * simply no-op via each table's own unique constraint.
 */
async function unlock(
  userId: string,
  keys: string[],
  tx?: Prisma.TransactionClient,
): Promise<void> {
  if (keys.length === 0) return;
  const achievementData = keys.map((key) => ({ userId, key }));
  const coinData = keys.map((key) => ({
    userId,
    amount: ACHIEVEMENTS_BY_KEY.get(key)?.coins ?? 0,
    reason: "achievement_unlocked",
    sourceKey: `achievement:${key}`,
  }));
  if (tx) {
    await tx.achievement.createMany({
      data: achievementData,
      skipDuplicates: true,
    });
    await tx.coinLedgerEntry.createMany({
      data: coinData,
      skipDuplicates: true,
    });
    return;
  }
  await db.$transaction([
    db.achievement.createMany({
      data: achievementData,
      skipDuplicates: true,
    }),
    db.coinLedgerEntry.createMany({
      data: coinData,
      skipDuplicates: true,
    }),
  ]);
}

const STREAK_THRESHOLDS: [threshold: number, key: string][] = [
  [3, "streak_3"],
  [7, "streak_7"],
  [30, "streak_30"],
  [60, "streak_60"],
  [100, "streak_100"],
];

export async function checkStreakAchievements(
  userId: string,
  currentStreak: number,
): Promise<void> {
  await safely("checkStreakAchievements", async () => {
    const keys = STREAK_THRESHOLDS.filter(
      ([threshold]) => currentStreak >= threshold,
    ).map(([, key]) => key);
    await unlock(userId, keys);
  });
}

/**
 * Unlocks every tier up to and including the current one, not just the one
 * just crossed - a single large point jump (e.g. placement credit) can
 * cross several tiers at once, and `skipDuplicates` makes re-unlocking
 * already-owned tiers on every call free and safe.
 */
export async function checkLevelAchievements(
  userId: string,
  generalLevelPoints: number,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  const run = async () => {
    const level = hskNumberForPoints(generalLevelPoints);
    const keys = Array.from({ length: level }, (_, i) => `level_tier_${i + 1}`);
    await unlock(userId, keys, tx);
  };
  if (tx) await run();
  else await safely("checkLevelAchievements", run);
}

export async function checkReflectionAchievements(
  userId: string,
  totalScore: number,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  const run = async () => {
    const keys: string[] = [];
    if (totalScore === 100) keys.push("reflection_perfect");
    if (starsForScore(totalScore) === 3) {
      const threeStarCount = await (tx ?? db).lessonReflectionReport.count({
        where: { userId, totalScore: { gte: 90 } },
      });
      if (threeStarCount >= 5) keys.push("reflection_three_star_5");
      if (threeStarCount >= 25) keys.push("reflection_three_star_25");
    }
    await unlock(userId, keys, tx);
  };
  if (tx) await run();
  else await safely("checkReflectionAchievements", run);
}

export async function checkLessonCompletionAchievements(
  userId: string,
): Promise<void> {
  await safely("checkLessonCompletionAchievements", async () => {
    const count = await db.learnerLessonCompletion.count({ where: { userId } });
    const keys: string[] = [];
    if (count >= 10) keys.push("lessons_10");
    if (count >= 50) keys.push("lessons_50");
    await unlock(userId, keys);
  });
}

export async function checkScenarioCompletionAchievements(
  userId: string,
): Promise<void> {
  await safely("checkScenarioCompletionAchievements", async () => {
    const count = await db.scenarioCompletion.count({ where: { userId } });
    if (count >= 1) await unlock(userId, ["scenario_first"]);
  });
}

/**
 * Which scenarios/lessons belong to each Chapter (2026-08-30, for the
 * chapter-completion achievements) - a whole-catalog scan, so it's
 * TTL-cached the same way scenario-completion.ts's getChapterHskSums is
 * ("no live publish/unpublish action exists, a multi-minute staleness
 * window costs nothing"). A separate cache from getChapterHskSums's,
 * deliberately - that one only keeps summed HSK weights, this one needs
 * the real scenario/lesson id lists.
 */
const CHAPTER_CONTENT_TTL_MS = 5 * 60 * 1000;

interface ChapterContent {
  scenarioIds: string[];
  lessonIds: string[];
}

const getChapterContent = createTtlCache(
  async (): Promise<Record<JourneyChapter, ChapterContent>> => {
    const scenarios = await db.scenario.findMany({
      select: {
        id: true,
        levels: {
          select: {
            difficulty: true,
            lessons: { where: { status: "PUBLISHED" }, select: { id: true } },
          },
        },
      },
    });

    const content: Record<JourneyChapter, ChapterContent> = {
      BEGINNER: { scenarioIds: [], lessonIds: [] },
      INTERMEDIATE: { scenarioIds: [], lessonIds: [] },
      ADVANCED: { scenarioIds: [], lessonIds: [] },
    };
    for (const scenario of scenarios) {
      const chapter = resolveJourneyChapter(
        scenario.levels.map((level) => level.difficulty),
      );
      content[chapter].scenarioIds.push(scenario.id);
      for (const level of scenario.levels) {
        for (const lesson of level.lessons) {
          content[chapter].lessonIds.push(lesson.id);
        }
      }
    }
    return content;
  },
  CHAPTER_CONTENT_TTL_MS,
);

const CHAPTER_ACHIEVEMENT_KEY: Record<JourneyChapter, string> = {
  BEGINNER: "chapter_completed_beginner",
  INTERMEDIATE: "chapter_completed_intermediate",
  ADVANCED: "chapter_completed_advanced",
};

/**
 * Every scenario in the chapter completed AND a plain average of every
 * lesson's Reflection totalScore in it above 70 (2026-08-30, user's exact
 * spec) - deliberately a plain average, not scenario-completion.ts's
 * HSK-weighted one, which measures something different (contribution to
 * General Level, not "did you actually do well here").
 */
export async function checkChapterCompletionAchievements(
  userId: string,
  chapter: JourneyChapter,
): Promise<void> {
  await safely("checkChapterCompletionAchievements", async () => {
    const content = (await getChapterContent())[chapter];
    if (content.scenarioIds.length === 0) return;

    const completedScenarios = await db.scenarioCompletion.count({
      where: { userId, scenarioId: { in: content.scenarioIds } },
    });
    if (completedScenarios < content.scenarioIds.length) return;

    const reports = await db.lessonReflectionReport.findMany({
      where: { userId, lessonId: { in: content.lessonIds } },
      select: { totalScore: true },
    });
    if (reports.length < content.lessonIds.length) return;

    const scores = reports.map((report) => report.totalScore ?? 0);
    const average =
      scores.reduce((sum, score) => sum + score, 0) / scores.length;
    if (average <= 70) return;

    await unlock(userId, [CHAPTER_ACHIEVEMENT_KEY[chapter]]);
  });
}

const ALL_CHAPTER_ACHIEVEMENT_KEYS = Object.values(CHAPTER_ACHIEVEMENT_KEY);

/**
 * The capstone (2026-08-30, "el graduado") - deliberately just checks that
 * all 3 CHAPTER_ACHIEVEMENT_KEY rows already exist for this user, rather
 * than recomputing a curriculum-wide average itself: each chapter achievement
 * already required its own >70 average to unlock, so "all 3 unlocked" is
 * already proof the whole curriculum was finished with a real score. Called
 * right after checkChapterCompletionAchievements, since finishing the last
 * chapter is the only moment this can newly cross.
 */
export async function checkGraduateAchievement(userId: string): Promise<void> {
  await safely("checkGraduateAchievement", async () => {
    const unlockedCount = await db.achievement.count({
      where: { userId, key: { in: ALL_CHAPTER_ACHIEVEMENT_KEYS } },
    });
    if (unlockedCount < ALL_CHAPTER_ACHIEVEMENT_KEYS.length) return;
    await unlock(userId, ["curriculum_graduate"]);
  });
}

/**
 * First Speaking Lab session / first Writing Lab submission (2026-08-30,
 * "los primeros pasos en labs"). Both count-based and re-checked on every
 * real event (same pattern as checkScenarioCompletionAchievements) rather
 * than tracked with a separate "is this the first one" flag - naturally
 * idempotent, and correct even if an earlier call's unlock() failed.
 *
 * Speaking has one real completion choke point (completeSpeakingSession,
 * speaking-data.ts) covering all 4 activity types. Writing has 3 - a task
 * submission and Custom Writing (writing-data.ts), plus the handwritten-photo
 * path (handwritten-writing-data.ts) - so this is called from all 3 instead
 * of trying to force them through one shared function.
 */
export async function checkSpeakingLabAchievements(
  userId: string,
): Promise<void> {
  await safely("checkSpeakingLabAchievements", async () => {
    const count = await db.speakingSession.count({
      where: { userId, completionState: "COMPLETED" },
    });
    if (count >= 1) await unlock(userId, ["speaking_lab_first"]);
  });
}

export async function checkWritingLabAchievements(
  userId: string,
): Promise<void> {
  await safely("checkWritingLabAchievements", async () => {
    const count = await db.writingAttempt.count({
      where: { userId, submittedAt: { not: null } },
    });
    if (count >= 1) await unlock(userId, ["writing_lab_first"]);
  });
}

export async function checkLeaderboardAchievements(
  userId: string,
  rank: number | null,
): Promise<void> {
  if (rank === null) return;
  await safely("checkLeaderboardAchievements", async () => {
    const keys: string[] = [];
    if (rank <= 10) keys.push("leaderboard_top10");
    if (rank === 1) keys.push("leaderboard_rank1");
    await unlock(userId, keys);
  });
}

export interface AchievementSummary {
  unlockedCount: number;
  totalCount: number;
  /** Up to 3 most recently unlocked, newest first - for the Dashboard teaser. */
  recent: AchievementDefinition[];
}

/** Dashboard teaser data (2026-08-29) - mirrors leaderboard-data.ts's getLeaderboardTop(3) shape: a small taste, not the full catalog (see app/(app)/achievements/page.tsx for that). */
export async function getAchievementSummary(
  userId: string,
): Promise<AchievementSummary> {
  const [unlockedCount, recentRows] = await Promise.all([
    db.achievement.count({ where: { userId } }),
    db.achievement.findMany({
      where: { userId },
      orderBy: { unlockedAt: "desc" },
      take: 3,
      select: { key: true },
    }),
  ]);

  const recent = recentRows.flatMap((row) => {
    const definition = ACHIEVEMENTS_BY_KEY.get(row.key);
    return definition ? [definition] : [];
  });

  return { unlockedCount, totalCount: ACHIEVEMENTS.length, recent };
}
