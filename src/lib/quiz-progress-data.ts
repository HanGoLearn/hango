import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import {
  evaluateAnswer,
  findCorrectOptionId,
  type ExerciseAnswer,
} from "@/lib/exercise-progress";
import { calculateScore } from "@/lib/quiz-progress";
import {
  recordProgressEvidence,
  getLessonCompetencyIds,
} from "@/lib/progress-evidence";

export async function startQuizAttempt(userId: string, quizId: string) {
  return db.quizAttempt.create({ data: { userId, quizId } });
}

async function assertOwnedAttempt(userId: string, attemptId: string) {
  const attempt = await db.quizAttempt.findUniqueOrThrow({
    where: { id: attemptId },
  });
  if (attempt.userId !== userId) throw new Error("Not authorized");
  return attempt;
}

/** Grades server-side and upserts so resubmitting a question within the same attempt just updates it. */
export async function submitQuizAnswer(
  userId: string,
  attemptId: string,
  quizQuestionId: string,
  answer: ExerciseAnswer,
) {
  await assertOwnedAttempt(userId, attemptId);

  const question = await db.quizQuestion.findUniqueOrThrow({
    where: { id: quizQuestionId },
    include: { options: true },
  });

  const isCorrect =
    evaluateAnswer(question.correctAnswer, question.options, answer) ?? false;

  await db.quizAnswer.upsert({
    where: {
      quizAttemptId_quizQuestionId: {
        quizAttemptId: attemptId,
        quizQuestionId,
      },
    },
    create: {
      quizAttemptId: attemptId,
      quizQuestionId,
      answer: answer as unknown as Prisma.InputJsonValue,
      isCorrect,
    },
    update: {
      answer: answer as unknown as Prisma.InputJsonValue,
      isCorrect,
    },
  });

  return {
    isCorrect,
    explanation: question.explanation,
    correctOptionId: findCorrectOptionId(question.options),
  };
}

export async function completeQuizAttempt(userId: string, attemptId: string) {
  await assertOwnedAttempt(userId, attemptId);

  const answers = await db.quizAnswer.findMany({
    where: { quizAttemptId: attemptId },
  });
  const score = calculateScore(answers);

  const attempt = await db.quizAttempt.update({
    where: { id: attemptId },
    data: { score, completedAt: new Date() },
  });

  const quiz = await db.quiz.findUniqueOrThrow({
    where: { id: attempt.quizId },
  });
  const competencyIds = await getLessonCompetencyIds(quiz.lessonId, "QUIZ");
  await recordProgressEvidence(
    userId,
    competencyIds,
    "QUIZ",
    score / 100,
    quiz.difficulty,
    attempt.id,
  );

  return {
    attempt,
    totalQuestions: answers.length,
    correctCount: answers.filter((answer) => answer.isCorrect).length,
  };
}
