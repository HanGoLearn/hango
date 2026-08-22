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
