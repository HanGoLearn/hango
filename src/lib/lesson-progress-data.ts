import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { getLessonsForScenarioLevel } from "@/lib/content/lesson";
import { resolveLessonAvailability } from "@/lib/content/learning-journey";
import { resolveNextStepId, isLessonComplete } from "@/lib/lesson-progress";
import { checkLessonCompletionAchievements } from "@/lib/achievements";
import {
  JourneySpeakingStepResponseSchema,
  JourneyAssessmentSnapshotSchema,
  hasJourneyReportProvenance,
} from "@/lib/journey-lesson-report";
import { getJourneyLessonReport } from "@/lib/journey-lesson-report-service";
import { JOURNEY_RUBRIC_VERSION } from "@/lib/journey-speaking-attempt-contract";

async function loadSiblingCompletionIds(
  userId: string,
  scenarioLevelId: string,
): Promise<{
  siblingLessons: Awaited<ReturnType<typeof getLessonsForScenarioLevel>>;
  completedIds: Set<string>;
}> {
  const siblingLessons = await getLessonsForScenarioLevel(scenarioLevelId);
  const completions = await db.learnerLessonCompletion.findMany({
    where: { userId, lessonId: { in: siblingLessons.map((l) => l.id) } },
    select: { lessonId: true },
  });
  return {
    siblingLessons,
    completedIds: new Set(completions.map((c) => c.lessonId)),
  };
}

/**
 * Enforces 5.4's lesson-unlocking rules at the point of entry to a lesson
 * (6.1 "Validate learner access") - the Scenario Detail page already hides
 * the link for locked lessons, but a learner can still type the URL
 * directly, so this is the real (server-side) gate.
 */
export async function canAccessLesson(
  userId: string,
  lesson: { id: string; scenarioLevelId: string },
): Promise<boolean> {
  const { siblingLessons, completedIds } = await loadSiblingCompletionIds(
    userId,
    lesson.scenarioLevelId,
  );
  const availability = resolveLessonAvailability(siblingLessons, completedIds);
  return availability.get(lesson.id) !== "LOCKED";
}

/**
 * Whether the learner has already finished this lesson (LearnerLessonCompletion
 * exists) - the lesson route uses this to decide between the normal step-by-
 * step LessonEngine and the read-only LessonResultsView (2026-08-15 request:
 * re-entering a finished lesson should show results, not let steps be redone
 * silently while the score is frozen by first-attempt-wins scoring).
 */
export async function isLessonCompleted(
  userId: string,
  lessonId: string,
): Promise<boolean> {
  const completion = await db.learnerLessonCompletion.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
    select: { lessonId: true },
  });
  return completion !== null;
}

/**
 * Combines canAccessLesson + isLessonCompleted for the lesson page's single
 * entry check - both need the same sibling-lesson completion data, fetched
 * once here instead of twice (project/db-operations-optimization.md,
 * Tier 2). canAccessLesson/isLessonCompleted stay exactly as they are for
 * their other callers (tests, scripts/measure-lesson-operations.test.ts)
 * that only need one or the other.
 */
export async function getLessonAccess(
  userId: string,
  lesson: { id: string; scenarioLevelId: string },
): Promise<{ allowed: boolean; completed: boolean }> {
  const { siblingLessons, completedIds } = await loadSiblingCompletionIds(
    userId,
    lesson.scenarioLevelId,
  );
  const availability = resolveLessonAvailability(siblingLessons, completedIds);
  return {
    allowed: availability.get(lesson.id) !== "LOCKED",
    completed: completedIds.has(lesson.id),
  };
}

export async function getOrCreateLessonProgress(
  userId: string,
  lessonId: string,
  firstStepId: string,
) {
  const existing = await db.learnerLessonProgress.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
  });
  if (existing) return existing;

  return db.learnerLessonProgress.create({
    data: { userId, lessonId, currentStepId: firstStepId },
  });
}

/**
 * Marks `stepId` completed, optionally stores whatever the learner entered
 * for it (exercise answers, etc.), and advances `currentStepId` to the next
 * step - the write behind every step's "Continue" action (autosave, 6.1).
 * On the last step this also sets `completedAt` and upserts the FASE 5.4
 * `LearnerLessonCompletion` signal, per that model's ownership note.
 */
export async function advanceLessonStep(
  userId: string,
  lessonId: string,
  stepId: string,
  response: unknown,
) {
  const { updated, complete, isDuplicate } = await db.$transaction(
    async (tx) => {
      const progress = await tx.learnerLessonProgress.findUniqueOrThrow({
        where: { userId_lessonId: { userId, lessonId } },
      });
      const steps = await tx.lessonStep.findMany({
        where: { lessonId },
        orderBy: { order: "asc" },
        select: { id: true, order: true, type: true },
      });
      const validStepIds = new Set(steps.map((step) => step.id));
      if (!validStepIds.has(stepId)) {
        throw new Error("This step does not belong to this lesson.");
      }

      if (progress.currentStepId !== stepId) {
        // A step already advanced past, submitted again: the client-side
        // guard in LessonEngine should prevent this, but a genuinely resent
        // request (a dropped response, a retried fetch) can still reach here
        // after the first call already recorded it. Treat it as the no-op it
        // actually is instead of throwing "not the current step" - that error
        // was reaching the learner as an unhandled "couldn't load this
        // lesson" screen, for progress that had in fact already saved fine.
        // A step never reached at all - out of order, not a duplicate -
        // still fails loudly below.
        if (progress.completedStepIds.includes(stepId)) {
          return {
            updated: progress,
            complete: progress.completedAt !== null,
            isDuplicate: true,
          };
        }
        throw new Error("This is not the current step for this lesson.");
      }

      // Optional v2 payload only; legacy steps are unchanged while rollout is
      // off. Never store a foreign, active, cancelled, or previous-run attempt.
      const previousResponse = (progress.responses as Record<string, unknown>)[
        stepId
      ];
      if (
        previousResponse &&
        typeof previousResponse === "object" &&
        "journeySpeakingAttemptId" in previousResponse &&
        response !== undefined &&
        !JourneySpeakingStepResponseSchema.safeParse(response).success
      )
        throw new Error(
          "A Journey selection cannot fall back to legacy grading.",
        );
      if (
        response &&
        typeof response === "object" &&
        "journeySpeakingAttemptId" in response
      ) {
        const selected = JourneySpeakingStepResponseSchema.parse(response);
        if (steps.find((step) => step.id === stepId)?.type !== "SPEAKING")
          throw new Error(
            "A Journey attempt belongs only to the Speaking step.",
          );
        const attempt = await tx.journeySpeakingAttempt.findFirst({
          where: {
            id: selected.journeySpeakingAttemptId,
            userId,
            lessonId,
            status: { in: ["SEALED", "TECHNICAL_FAILURE"] },
            rubricVersion: JOURNEY_RUBRIC_VERSION,
            finishedAt: { not: null },
            startedAt: { gte: progress.startedAt },
          },
          select: { snapshot: true },
        });
        const snapshot = attempt?.snapshot as
          { assessment?: unknown } | undefined;
        const assessment = JourneyAssessmentSnapshotSchema.safeParse(
          snapshot?.assessment,
        );
        if (
          !assessment.success ||
          assessment.data.progressId !== progress.id ||
          assessment.data.progressStartedAt !== progress.startedAt.toISOString()
        )
          throw new Error("A sealed attempt for this lesson run is required.");
      }

      const responses =
        response === undefined
          ? (progress.responses as Record<string, unknown>)
          : {
              ...(progress.responses as Record<string, unknown>),
              [stepId]: response,
            };
      const completedStepIds = new Set(
        progress.completedStepIds.filter((id) => validStepIds.has(id)),
      );
      completedStepIds.add(stepId);
      const complete = isLessonComplete(steps, completedStepIds);
      const nextStepId = resolveNextStepId(steps, stepId) ?? stepId;

      if (complete) {
        const projection = await tx.lessonReflectionReport.findUnique({
          where: { userId_lessonId: { userId, lessonId } },
          select: { speakingDimensions: true },
        });
        const selectedV2 = steps.some((step) => {
          const saved = responses[step.id];
          return (
            step.type === "SPEAKING" &&
            saved &&
            typeof saved === "object" &&
            "journeySpeakingAttemptId" in saved
          );
        });
        if (
          selectedV2 ||
          hasJourneyReportProvenance(projection?.speakingDimensions)
        ) {
          const report = await getJourneyLessonReport(userId, lessonId, tx);
          if (
            !report.rewards.eligible ||
            report.rewards.settlement !== "SETTLED"
          )
            throw new Error(
              "A complete saved Journey report is required to finish this lesson.",
            );
        }
      }

      const updated = await tx.learnerLessonProgress.update({
        where: {
          userId_lessonId: { userId, lessonId },
          id: progress.id,
          startedAt: progress.startedAt,
        },
        data: {
          responses: responses as Prisma.InputJsonValue,
          completedStepIds: [...completedStepIds],
          currentStepId: nextStepId,
          completedAt: complete ? new Date() : null,
        },
      });

      if (complete) {
        await tx.learnerLessonCompletion.upsert({
          where: { userId_lessonId: { userId, lessonId } },
          update: {},
          create: { userId, lessonId },
        });
      }
      return { updated, complete, isDuplicate: false };
    },
  );

  // Skipped on the duplicate path on purpose: the first, real call already
  // ran this when `complete` first became true, so a resend re-running it
  // would be the exact wasted extra Prisma work the duplicate check exists
  // to avoid, not just a wasted check.
  if (complete && !isDuplicate) {
    await checkLessonCompletionAchievements(userId);
  }

  return updated;
}

/** Jumps back to a previously completed step without touching progress data. */
export async function setCurrentLessonStep(
  userId: string,
  lessonId: string,
  stepId: string,
) {
  const progress = await db.learnerLessonProgress.findUniqueOrThrow({
    where: { userId_lessonId: { userId, lessonId } },
  });
  const belongsToLesson = await db.lessonStep.findFirst({
    where: { id: stepId, lessonId },
    select: { id: true },
  });
  if (
    !belongsToLesson ||
    (stepId !== progress.currentStepId &&
      !progress.completedStepIds.includes(stepId))
  ) {
    throw new Error("This lesson step is not available.");
  }
  return db.learnerLessonProgress.update({
    where: { userId_lessonId: { userId, lessonId } },
    data: { currentStepId: stepId },
  });
}
