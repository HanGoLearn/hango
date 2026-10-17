import "server-only";
import { db } from "@/lib/db";
import { hasJourneyReportProvenance } from "@/lib/journey-lesson-report";

/** Existing tables only: safe before v2 migrations. Even invalid provenance
 * routes to the guarded reader, never to paid legacy/global-chat regeneration. */
export async function usesJourneyLessonReport(
  userId: string,
  lessonId: string,
) {
  const [selected, projection] = await Promise.all([
    hasJourneySpeakingSelection(userId, lessonId),
    db.lessonReflectionReport.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
      select: { speakingDimensions: true },
    }),
  ]);
  return selected || hasJourneyReportProvenance(projection?.speakingDimensions);
}

/** A selected v2 attempt must never fall back to global-chat legacy grading,
 * including a malformed payload or a report not yet persisted. */
export async function hasJourneySpeakingSelection(
  userId: string,
  lessonId: string,
) {
  const progress = await db.learnerLessonProgress.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
    select: {
      responses: true,
      completedStepIds: true,
      lesson: {
        select: {
          steps: { where: { type: "SPEAKING" }, select: { id: true } },
        },
      },
    },
  });
  if (!progress) return false;
  const responses = progress.responses as Record<string, unknown>;
  return progress.lesson.steps.some((step) => {
    const response = responses[step.id];
    return (
      progress.completedStepIds.includes(step.id) &&
      response !== null &&
      typeof response === "object" &&
      "journeySpeakingAttemptId" in response
    );
  });
}
