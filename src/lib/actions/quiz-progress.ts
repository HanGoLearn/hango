"use server";

import { auth } from "@/lib/auth";
import {
  startQuizAttempt,
  submitQuizAnswer,
  completeQuizAttempt,
} from "@/lib/quiz-progress-data";
import type {
  ExerciseAnswer,
  ExerciseSubmitResult,
} from "@/lib/exercise-progress";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export async function startQuizAttemptAction(quizId: string) {
  const userId = await requireUserId();
  const attempt = await startQuizAttempt(userId, quizId);
  return { attemptId: attempt.id };
}

export async function submitQuizAnswerAction(
  attemptId: string,
  quizQuestionId: string,
  answer: ExerciseAnswer,
): Promise<ExerciseSubmitResult> {
  const userId = await requireUserId();
  return submitQuizAnswer(userId, attemptId, quizQuestionId, answer);
}

export async function completeQuizAttemptAction(attemptId: string) {
  const userId = await requireUserId();
  const { attempt, totalQuestions, correctCount } = await completeQuizAttempt(
    userId,
    attemptId,
  );
  return { score: attempt.score, totalQuestions, correctCount };
}
