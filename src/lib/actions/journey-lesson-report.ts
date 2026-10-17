"use server";

import { z } from "zod";
import { refresh } from "next/cache";
import { auth } from "@/lib/auth";
import {
  getJourneyLessonReport,
  evaluateJourneyLessonReport,
  persistJourneyLessonReport,
} from "@/lib/journey-lesson-report-service";
import type { JourneyLessonReportView } from "@/lib/journey-lesson-report";

const Input = z.object({ lessonId: z.string().min(1).max(100) }).strict();
type Result =
  | { ok: true; report: JourneyLessonReportView }
  | { ok: false; code: "UNAUTHENTICATED" | "INVALID_INPUT" | "UNAVAILABLE" };

async function execute(
  input: unknown,
  operation: (
    userId: string,
    lessonId: string,
  ) => Promise<JourneyLessonReportView>,
): Promise<Result> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, code: "UNAUTHENTICATED" };
  const parsed = Input.safeParse(input);
  if (!parsed.success) return { ok: false, code: "INVALID_INPUT" };
  try {
    return {
      ok: true,
      report: await operation(session.user.id, parsed.data.lessonId),
    };
  } catch {
    return { ok: false, code: "UNAVAILABLE" };
  }
}

/** Polling/visiting does not evaluate, settle rewards or translate feedback. */
export async function getJourneyLessonReportAction(
  input: unknown,
): Promise<Result> {
  return execute(input, getJourneyLessonReport);
}

/** Explicit UI request. One-dispatch evaluator followed by an atomic save.
 * Saving a pending/partial result never fabricates grades or grants coins. */
export async function evaluateJourneyLessonReportAction(
  input: unknown,
): Promise<Result> {
  return execute(input, async (userId, lessonId) => {
    await evaluateJourneyLessonReport(userId, lessonId);
    const report = await persistJourneyLessonReport(userId, lessonId);
    refresh();
    return report;
  });
}

/** Retry ONLY saving a returned result; cannot spend on another AI request. */
export async function saveJourneyLessonReportAction(
  input: unknown,
): Promise<Result> {
  return execute(input, async (userId, lessonId) => {
    const report = await persistJourneyLessonReport(userId, lessonId);
    refresh();
    return report;
  });
}
