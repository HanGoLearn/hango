export type LessonStepStatus = "LOCKED" | "AVAILABLE" | "COMPLETED";

export interface StepForProgress {
  id: string;
  order: number;
}

/**
 * Step-navigation rules (6.1/6.2): the first step is always available; each
 * subsequent step unlocks once the previous one is completed, so a learner
 * can't skip ahead. Completed steps stay accessible so they can go back.
 * Mirrors resolveLessonAvailability's shape in learning-journey.ts.
 */
export function resolveStepAvailability(
  steps: StepForProgress[],
  completedStepIds: ReadonlySet<string>,
): Map<string, LessonStepStatus> {
  const sorted = [...steps].sort((a, b) => a.order - b.order);
  const result = new Map<string, LessonStepStatus>();
  let previousCompleted = true;

  for (const step of sorted) {
    const isCompleted = completedStepIds.has(step.id);
    if (isCompleted) {
      result.set(step.id, "COMPLETED");
    } else if (previousCompleted) {
      result.set(step.id, "AVAILABLE");
    } else {
      result.set(step.id, "LOCKED");
    }
    previousCompleted = isCompleted;
  }

  return result;
}

export function resolveNextStepId(
  steps: StepForProgress[],
  currentStepId: string,
): string | null {
  const sorted = [...steps].sort((a, b) => a.order - b.order);
  const index = sorted.findIndex((step) => step.id === currentStepId);
  if (index === -1 || index === sorted.length - 1) return null;
  return sorted[index + 1]!.id;
}

export function resolvePreviousStepId(
  steps: StepForProgress[],
  currentStepId: string,
): string | null {
  const sorted = [...steps].sort((a, b) => a.order - b.order);
  const index = sorted.findIndex((step) => step.id === currentStepId);
  if (index <= 0) return null;
  return sorted[index - 1]!.id;
}

export function isLessonComplete(
  steps: StepForProgress[],
  completedStepIds: ReadonlySet<string>,
): boolean {
  return steps.every((step) => completedStepIds.has(step.id));
}
