"use server";

import { auth } from "@/lib/auth";
import {
  advanceLessonStep,
  setCurrentLessonStep,
} from "@/lib/lesson-progress-data";
import type { StepForProgress } from "@/lib/lesson-progress";

export async function advanceLessonStepAction(
  lessonId: string,
  stepId: string,
  steps: StepForProgress[],
  response: unknown,
): Promise<{ completedAt: string | null }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const updated = await advanceLessonStep(
    session.user.id,
    lessonId,
    stepId,
    steps,
    response,
  );
  return { completedAt: updated.completedAt?.toISOString() ?? null };
}

export async function goToLessonStepAction(
  lessonId: string,
  stepId: string,
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  await setCurrentLessonStep(session.user.id, lessonId, stepId);
}
