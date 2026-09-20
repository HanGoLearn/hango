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
  const quiz = await db.quiz.findFirst({
    where: { id: quizId, status: "PUBLISHED" },
    select: { id: true },
  });
  if (!quiz) throw new Error("Quiz not found.");
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
  const attempt = await assertOwnedAttempt(userId, attemptId);
  if (attempt.completedAt) throw new Error("This quiz attempt is complete.");

  const question = await db.quizQuestion.findFirstOrThrow({
    where: { id: quizQuestionId, quizId: attempt.quizId },
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
  const ownedAttempt = await assertOwnedAttempt(userId, attemptId);
  const [answers, questionCount] = await Promise.all([
    db.quizAnswer.findMany({ where: { quizAttemptId: attemptId } }),
    db.quizQuestion.count({ where: { quizId: ownedAttempt.quizId } }),
  ]);
  if (answers.length !== questionCount || questionCount === 0) {
    throw new Error("Answer every quiz question before completing the quiz.");
  }
  if (ownedAttempt.completedAt) {
    return {
      attempt: ownedAttempt,
      totalQuestions: questionCount,
      correctCount: answers.filter((answer) => answer.isCorrect).length,
    };
  }

  const score = calculateScore(answers);
  const completed = await db.quizAttempt.updateMany({
    where: { id: attemptId, userId, completedAt: null },
    data: { score, completedAt: new Date() },
  });
  const attempt = await db.quizAttempt.findUniqueOrThrow({
    where: { id: attemptId },
  });
  if (completed.count === 0) {
    return {
      attempt,
      totalQuestions: questionCount,
      correctCount: answers.filter((answer) => answer.isCorrect).length,
    };
  }

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
