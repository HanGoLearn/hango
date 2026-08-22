"use server";

import { auth } from "@/lib/auth";
import {
  recordExerciseAttempt,
  recordExerciseAttempts,
  type GradedExerciseResult,
} from "@/lib/exercise-progress-data";
import type {
  ExerciseAnswer,
  ExerciseSubmitResult,
} from "@/lib/exercise-progress";

export async function submitExerciseAttemptAction(
  exerciseId: string,
  answer: ExerciseAnswer,
): Promise<ExerciseSubmitResult> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const { isCorrect, explanation, correctOptionId } =
    await recordExerciseAttempt(session.user.id, exerciseId, answer);
  return { isCorrect, explanation: explanation ?? null, correctOptionId };
}

/**
 * Grades and submits several exercises at once (2026-08-19, Grammar
 * batching - project/learning-journey-optimization.md). Returns results
 * keyed by exerciseId so the caller can match each back to its own card
 * regardless of submission order.
 */
export async function submitExerciseAttemptsAction(
  answers: { exerciseId: string; answer: ExerciseAnswer }[],
): Promise<Record<string, ExerciseSubmitResult>> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const results = await recordExerciseAttempts(session.user.id, answers);
  return Object.fromEntries(
    results.map((result: GradedExerciseResult) => [
      result.exerciseId,
      {
        isCorrect: result.isCorrect,
        explanation: result.explanation,
        correctOptionId: result.correctOptionId,
      } satisfies ExerciseSubmitResult,
    ]),
  );
}
