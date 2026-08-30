"use server";

import { auth } from "@/lib/auth";
import {
  getOrGenerateLessonReflectionReport,
  getLessonScoreBreakdown,
  ReflectionNotFoundError,
  type LessonReflectionReportView,
  type LessonScoreBreakdown,
} from "@/lib/reflection";
import { AiProviderError } from "@/lib/ai";
import { getStudyStreak } from "@/lib/dashboard-data";
import type { StreakResult } from "@/lib/study-streak";
import { checkStreakAchievements } from "@/lib/achievements";

export type LessonReflectionReportActionResult =
  | { ok: true; report: LessonReflectionReportView }
  | { ok: false; error: string };

export async function getLessonReflectionReportAction(
  lessonId: string,
): Promise<LessonReflectionReportActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "You need to be signed in for this." };
  }

  try {
    const report = await getOrGenerateLessonReflectionReport(
      session.user.id,
      lessonId,
    );
    return { ok: true, report };
  } catch (error) {
    if (error instanceof ReflectionNotFoundError) {
      return { ok: false, error: "That lesson couldn't be found." };
    }
    if (error instanceof AiProviderError) {
      return { ok: false, error: error.message };
    }
    return {
      ok: false,
      error: "Couldn't put together your report right now. Please try again.",
    };
  }
}

export type LessonScoreBreakdownActionResult =
  | { ok: true; breakdown: LessonScoreBreakdown }
  | { ok: false; error: string };

export async function getLessonScoreBreakdownAction(
  lessonId: string,
): Promise<LessonScoreBreakdownActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "You need to be signed in for this." };
  }

  try {
    const breakdown = await getLessonScoreBreakdown(session.user.id, lessonId);
    return { ok: true, breakdown };
  } catch (error) {
    if (error instanceof ReflectionNotFoundError) {
      return { ok: false, error: "That lesson couldn't be found." };
    }
    return { ok: false, error: "Couldn't load the breakdown right now." };
  }
}

/**
 * Milestone 6 (2026-08-29) - the completion screen's streak callout needs
 * the same real streak Dashboard/TopBar already show, not a second source
 * of truth. `getStudyStreak` is already React-`cache()`'d per request, so
 * this costs nothing extra on pages (Dashboard) that already call it in
 * the same request; on the standalone lesson page it's one cheap query
 * (same 5-query shape getStudyStreak always runs, see dashboard-data.ts).
 */
export async function getReflectionStreakAction(): Promise<StreakResult | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const streak = await getStudyStreak(session.user.id);
  await checkStreakAchievements(session.user.id, streak.currentStreak);
  return streak;
}
