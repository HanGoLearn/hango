import { cache } from "react";
import { db } from "@/lib/db";
import {
  computeLast7DaysActivity,
  computeStreak,
  toUtcDateString,
  type StreakResult,
} from "@/lib/study-streak";
import {
  getContinueLearningTarget,
  getCompetencyProgress,
} from "@/lib/progress-data";
import { getScenariosWithProgress } from "@/lib/content/learning-journey-data";
import { getReviewQueue } from "@/lib/review-data";
import { getOrCreateLearnerProfile } from "@/lib/learner-profile";
import { hskLevelForPoints } from "@/lib/points-system";

const STREAK_LOOKBACK_DAYS = 60;

/**
 * Distinct activity dates across every graded activity type, bounded to a
 * lookback window to keep the query cheap. Cached per-request (React.cache,
 * 2026-08-21) - originally only `getStudyStreak` called this, but
 * `getDashboardData`'s new weekly-activity strip needs the same raw dates
 * too. Without the cache, one Dashboard load would run these 5 queries
 * twice; with it, both callers share a single execution (same pattern as
 * getCompletedLessonIds in learning-journey-data.ts).
 */
const getRecentActivityDates = cache(
  async (userId: string): Promise<string[]> => {
    const since = new Date();
    since.setDate(since.getDate() - STREAK_LOOKBACK_DAYS);

    const [completions, exercises, speaking, writing, missions] =
      await Promise.all([
        db.learnerLessonCompletion.findMany({
          where: { userId, completedAt: { gte: since } },
          select: { completedAt: true },
        }),
        db.exerciseAttempt.findMany({
          where: { userId, createdAt: { gte: since } },
          select: { createdAt: true },
        }),
        db.speakingAttempt.findMany({
          where: { session: { userId }, createdAt: { gte: since } },
          select: { createdAt: true },
        }),
        db.writingAttempt.findMany({
          where: { userId, submittedAt: { gte: since } },
          select: { submittedAt: true },
        }),
        db.missionAttempt.findMany({
          where: { userId, completedAt: { gte: since } },
          select: { completedAt: true },
        }),
      ]);

    const dates = [
      ...completions.map((c) => c.completedAt),
      ...exercises.map((e) => e.createdAt),
      ...speaking.map((s) => s.createdAt),
      ...writing.map((w) => w.submittedAt),
      ...missions.map((m) => m.completedAt),
    ].filter((d): d is Date => d !== null);

    return dates.map(toUtcDateString);
  },
);

/**
 * Cached per-request (React.cache) - AppShell (every page) and
 * getDashboardData (Dashboard specifically) both need this, and without
 * the cache Dashboard alone paid for it twice (10 queries instead of 5).
 */
export const getStudyStreak = cache(
  async (userId: string): Promise<StreakResult> => {
    const dates = await getRecentActivityDates(userId);
    return computeStreak(dates);
  },
);

export async function getDashboardData(userId: string) {
  const [
    continueTarget,
    streak,
    scenarios,
    competencies,
    reviewQueue,
    profile,
    activityDates,
  ] = await Promise.all([
    getContinueLearningTarget(userId),
    getStudyStreak(userId),
    getScenariosWithProgress(userId),
    getCompetencyProgress(userId),
    getReviewQueue(userId),
    getOrCreateLearnerProfile(userId),
    // Same cached call getStudyStreak makes internally (see above) - zero
    // additional queries, just reused for the weekly strip's per-day detail
    // that computeStreak's own {currentStreak, activeToday} doesn't expose.
    getRecentActivityDates(userId),
  ]);

  return {
    continueTarget,
    streak,
    scenarios,
    competencies,
    reviewQueue: reviewQueue.slice(0, 3),
    dailyStudyTargetMinutes: profile.dailyStudyTargetMinutes,
    // Rule-based, not AI-generated (consistent with FASE 3's recommendation
    // engine) - the top review-queue item's own reason, reused here so the
    // Dashboard doesn't need a second recommendation source.
    recommendation: reviewQueue[0] ?? null,
    // Zero extra queries (2026-08-21) - generalLevelPoints is a cached
    // derived field already sitting on the `profile` row this function
    // fetches anyway (see progress-data.ts's getGeneralLevelSummary, which
    // reads the identical field for the Progress page's fuller card). Only
    // the headline number/tier label, not the scenario-completion average -
    // that needs its own query and belongs on Progress, not this glanceable
    // summary.
    generalLevel: {
      points: profile.generalLevelPoints,
      levelLabel: hskLevelForPoints(profile.generalLevelPoints),
    },
    weeklyActivity: computeLast7DaysActivity(activityDates),
  };
}
