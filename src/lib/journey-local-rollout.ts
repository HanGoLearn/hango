import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { serverEnv } from "@/lib/env/server";

export function isLocalJourneyRolloutRequested(
  environment = serverEnv.NODE_ENV,
  mode = serverEnv.HANGO_JOURNEY_EVALUATION_V2,
) {
  return environment === "development" && mode === "local";
}

/** No paid calls or writes. An incomplete setup cannot silently run legacy. */
export const getLocalJourneyRollout = cache(async () => {
  if (!isLocalJourneyRolloutRequested()) return "OFF" as const;
  try {
    await Promise.all([
      db.journeySpeakingAttempt.findFirst({
        select: { id: true, captureQuality: true },
      }),
      db.journeySpeakingTurn.findFirst({
        select: { id: true, recognition: true },
      }),
      db.journeySpeakingEvaluation.findFirst({ select: { id: true } }),
    ]);
    return "READY" as const;
  } catch {
    return "UNAVAILABLE" as const;
  }
});

/** Old results/finished Speaking cannot be relabelled as evidence v2. */
export async function needsJourneyLessonRestart(
  userId: string,
  lessonId: string,
) {
  const [report, progress] = await Promise.all([
    db.lessonReflectionReport.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
      select: { id: true },
    }),
    db.learnerLessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
      select: {
        completedStepIds: true,
        lesson: {
          select: {
            steps: { where: { type: "SPEAKING" }, select: { id: true } },
          },
        },
      },
    }),
  ]);
  return (
    Boolean(report) ||
    Boolean(
      progress?.lesson.steps.some((step) =>
        progress.completedStepIds.includes(step.id),
      ),
    )
  );
}
