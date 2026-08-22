import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { getLessonsForScenarioLevel } from "@/lib/content/lesson";
import { resolveLessonAvailability } from "@/lib/content/learning-journey";
import { resolveNextStepId, isLessonComplete } from "@/lib/lesson-progress";
import type { StepForProgress } from "@/lib/lesson-progress";

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
  steps: StepForProgress[],
  response: unknown,
) {
  const progress = await db.learnerLessonProgress.findUniqueOrThrow({
    where: { userId_lessonId: { userId, lessonId } },
  });

  const responses =
    response === undefined
      ? (progress.responses as Record<string, unknown>)
      : {
          ...(progress.responses as Record<string, unknown>),
          [stepId]: response,
        };
  const completedStepIds = new Set([...progress.completedStepIds, stepId]);
  const complete = isLessonComplete(steps, completedStepIds);
  const nextStepId = resolveNextStepId(steps, stepId) ?? stepId;

  const updated = await db.learnerLessonProgress.update({
    where: { userId_lessonId: { userId, lessonId } },
    data: {
      responses: responses as Prisma.InputJsonValue,
      completedStepIds: [...completedStepIds],
      currentStepId: nextStepId,
      completedAt: complete ? new Date() : null,
    },
  });

  if (complete) {
    await db.learnerLessonCompletion.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      update: {},
      create: { userId, lessonId },
    });
  }

  return updated;
}

/** Jumps back to a previously completed step without touching progress data. */
export async function setCurrentLessonStep(
  userId: string,
  lessonId: string,
  stepId: string,
) {
  return db.learnerLessonProgress.update({
    where: { userId_lessonId: { userId, lessonId } },
    data: { currentStepId: stepId },
  });
}
