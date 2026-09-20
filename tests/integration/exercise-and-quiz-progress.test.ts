import { afterEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { getLessonBySlug } from "@/lib/content/lesson";
import { getExercisesForLesson } from "@/lib/content/exercise";
import { getQuizzesForLesson } from "@/lib/content/quiz";
import {
  recordExerciseAttempt,
  recordExerciseAttempts,
} from "@/lib/exercise-progress-data";
import {
  startQuizAttempt,
  submitQuizAnswer,
  completeQuizAttempt,
} from "@/lib/quiz-progress-data";

// Only auth() is mocked — everything else runs against the real seeded
// database, same as the other integration tests.
const { authMock } = vi.hoisted(() => ({ authMock: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: authMock }));

const { submitExerciseAttemptAction } =
  await import("@/lib/actions/exercise-progress");
const { startQuizAttemptAction } = await import("@/lib/actions/quiz-progress");

const testEmails: string[] = [];

afterEach(async () => {
  vi.clearAllMocks();
  if (testEmails.length > 0) {
    await db.user.deleteMany({ where: { email: { in: testEmails } } });
    testEmails.length = 0;
  }
});

async function createTestUser(email: string) {
  testEmails.push(email);
  const user = await db.user.create({ data: { email } });
  authMock.mockResolvedValue({ user: { id: user.id } });
  return user;
}

describe("exercise attempts (integration, real seeded database)", () => {
  it("grades server-side and stores an attempt for the real seeded exercise", async () => {
    const user = await createTestUser(
      `exercise-attempt-${Date.now()}@hango.dev`,
    );
    const lesson = await getLessonBySlug("restaurant-entering-and-ordering");
    const [exercise] = await getExercisesForLesson(lesson!.id);
    const correctOption = exercise!.options.find((o) => o.isCorrect)!;

    const result = await recordExerciseAttempt(user.id, exercise!.id, {
      type: "MULTIPLE_CHOICE",
      optionId: correctOption.id,
    });

    expect(result.isCorrect).toBe(true);
    expect(result.correctOptionId).toBe(correctOption.id);

    const stored = await db.exerciseAttempt.findFirst({
      where: { userId: user.id, exerciseId: exercise!.id },
    });
    expect(stored).not.toBeNull();
    expect(stored!.attemptNumber).toBe(1);
  });

  it("increments attemptNumber on retry instead of overwriting the previous attempt", async () => {
    const user = await createTestUser(`exercise-retry-${Date.now()}@hango.dev`);
    const lesson = await getLessonBySlug("restaurant-entering-and-ordering");
    const [exercise] = await getExercisesForLesson(lesson!.id);
    const wrongOption = exercise!.options.find((o) => !o.isCorrect)!;

    await recordExerciseAttempt(user.id, exercise!.id, {
      type: "MULTIPLE_CHOICE",
      optionId: wrongOption.id,
    });
    const second = await recordExerciseAttempt(user.id, exercise!.id, {
      type: "MULTIPLE_CHOICE",
      optionId: wrongOption.id,
    });

    expect(second.attempt.attemptNumber).toBe(2);
    const count = await db.exerciseAttempt.count({
      where: { userId: user.id, exerciseId: exercise!.id },
    });
    expect(count).toBe(2);
  });

  it("never trusts a client-supplied answer - grading always re-checks against the real exercise", async () => {
    const user = await createTestUser(
      `exercise-server-grade-${Date.now()}@hango.dev`,
    );
    const lesson = await getLessonBySlug("restaurant-entering-and-ordering");
    const [exercise] = await getExercisesForLesson(lesson!.id);

    const result = await submitExerciseAttemptAction(exercise!.id, {
      type: "MULTIPLE_CHOICE",
      optionId: "not-a-real-option-id",
    });

    expect(result.isCorrect).toBe(false);
  });
});

describe("batched exercise attempts (2026-08-19, Grammar batching - integration, real seeded database)", () => {
  it("grades and records several exercises in one batch, keyed by exerciseId", async () => {
    const user = await createTestUser(`exercise-batch-${Date.now()}@hango.dev`);
    const lesson = await getLessonBySlug("restaurant-entering-and-ordering");
    const exercises = await getExercisesForLesson(lesson!.id);
    const multipleChoiceExercises = exercises.filter(
      (exercise) =>
        exercise.type === "MULTIPLE_CHOICE" &&
        exercise.options.some((option) => option.isCorrect) &&
        exercise.options.some((option) => !option.isCorrect),
    );
    expect(multipleChoiceExercises.length).toBeGreaterThanOrEqual(2);
    const [first, second] = multipleChoiceExercises;
    const correctFirst = first!.options.find((o) => o.isCorrect)!;
    const wrongSecond = second!.options.find((o) => !o.isCorrect)!;

    const results = await recordExerciseAttempts(user.id, [
      { exerciseId: first!.id, answer: { type: "MULTIPLE_CHOICE", optionId: correctFirst.id } },
      { exerciseId: second!.id, answer: { type: "MULTIPLE_CHOICE", optionId: wrongSecond.id } },
    ]);

    const byId = new Map(results.map((r) => [r.exerciseId, r]));
    expect(byId.get(first!.id)?.isCorrect).toBe(true);
    expect(byId.get(second!.id)?.isCorrect).toBe(false);

    const stored = await db.exerciseAttempt.findMany({
      where: { userId: user.id, exerciseId: { in: [first!.id, second!.id] } },
    });
    expect(stored).toHaveLength(2);
    expect(stored.every((a) => a.attemptNumber === 1)).toBe(true);
  });

  it("increments attemptNumber correctly per exercise, matching the single-attempt behavior", async () => {
    const user = await createTestUser(`exercise-batch-retry-${Date.now()}@hango.dev`);
    const lesson = await getLessonBySlug("restaurant-entering-and-ordering");
    const [exercise] = await getExercisesForLesson(lesson!.id);
    const wrongOption = exercise!.options.find((o) => !o.isCorrect)!;

    await recordExerciseAttempt(user.id, exercise!.id, {
      type: "MULTIPLE_CHOICE",
      optionId: wrongOption.id,
    });
    const [batched] = await recordExerciseAttempts(user.id, [
      { exerciseId: exercise!.id, answer: { type: "MULTIPLE_CHOICE", optionId: wrongOption.id } },
    ]);
    void batched;

    const stored = await db.exerciseAttempt.findMany({
      where: { userId: user.id, exerciseId: exercise!.id },
      orderBy: { attemptNumber: "asc" },
    });
    expect(stored.map((a) => a.attemptNumber)).toEqual([1, 2]);
  });

  it("never trusts client-supplied answers in a batch either - grading always re-checks server-side", async () => {
    const user = await createTestUser(`exercise-batch-server-grade-${Date.now()}@hango.dev`);
    const lesson = await getLessonBySlug("restaurant-entering-and-ordering");
    const [exercise] = await getExercisesForLesson(lesson!.id);

    const [result] = await recordExerciseAttempts(user.id, [
      { exerciseId: exercise!.id, answer: { type: "MULTIPLE_CHOICE", optionId: "not-a-real-option-id" } },
    ]);

    expect(result!.isCorrect).toBe(false);
  });

  it("returns an empty array for an empty batch without touching the database", async () => {
    const user = await createTestUser(`exercise-batch-empty-${Date.now()}@hango.dev`);
    const results = await recordExerciseAttempts(user.id, []);
    expect(results).toEqual([]);
  });
});

describe("quiz attempts (integration, real seeded database)", () => {
  it("runs a full attempt: start, answer every question, complete, and score it", async () => {
    const user = await createTestUser(`quiz-full-run-${Date.now()}@hango.dev`);
    const lesson = await getLessonBySlug("restaurant-entering-and-ordering");
    const [quiz] = await getQuizzesForLesson(lesson!.id);

    const attempt = await startQuizAttempt(user.id, quiz!.id);

    for (const question of quiz!.questions) {
      const correctOption = question.options.find((o) => o.isCorrect)!;
      const result = await submitQuizAnswer(user.id, attempt.id, question.id, {
        type: "MULTIPLE_CHOICE",
        optionId: correctOption.id,
      });
      expect(result.isCorrect).toBe(true);
    }

    const {
      attempt: completed,
      totalQuestions,
      correctCount,
    } = await completeQuizAttempt(user.id, attempt.id);

    expect(totalQuestions).toBe(quiz!.questions.length);
    expect(correctCount).toBe(quiz!.questions.length);
    expect(completed.score).toBe(100);
    expect(completed.completedAt).not.toBeNull();
  });

  it("resubmitting the same question within an attempt updates it instead of duplicating", async () => {
    const user = await createTestUser(`quiz-resubmit-${Date.now()}@hango.dev`);
    const lesson = await getLessonBySlug("restaurant-entering-and-ordering");
    const [quiz] = await getQuizzesForLesson(lesson!.id);
    const [question] = quiz!.questions;
    const wrongOption = question!.options.find((o) => !o.isCorrect)!;
    const correctOption = question!.options.find((o) => o.isCorrect)!;

    const attempt = await startQuizAttempt(user.id, quiz!.id);
    await submitQuizAnswer(user.id, attempt.id, question!.id, {
      type: "MULTIPLE_CHOICE",
      optionId: wrongOption.id,
    });
    await submitQuizAnswer(user.id, attempt.id, question!.id, {
      type: "MULTIPLE_CHOICE",
      optionId: correctOption.id,
    });

    const answers = await db.quizAnswer.findMany({
      where: { quizAttemptId: attempt.id },
    });
    expect(answers).toHaveLength(1);
    expect(answers[0]!.isCorrect).toBe(true);
  });

  it("rejects acting on another user's quiz attempt", async () => {
    const owner = await createTestUser(`quiz-owner-${Date.now()}@hango.dev`);
    const lesson = await getLessonBySlug("restaurant-entering-and-ordering");
    const [quiz] = await getQuizzesForLesson(lesson!.id);
    const attempt = await startQuizAttempt(owner.id, quiz!.id);

    const intruder = await createTestUser(
      `quiz-intruder-${Date.now()}@hango.dev`,
    );

    await expect(
      submitQuizAnswer(intruder.id, attempt.id, quiz!.questions[0]!.id, {
        type: "MULTIPLE_CHOICE",
        optionId: quiz!.questions[0]!.options[0]!.id,
      }),
    ).rejects.toThrow("Not authorized");
  });

  it("rejects a question that does not belong to the attempt's quiz", async () => {
    const user = await createTestUser(`quiz-question-scope-${Date.now()}@hango.dev`);
    const lesson = await getLessonBySlug("restaurant-entering-and-ordering");
    const otherLesson = await getLessonBySlug(
      "restaurant-ingredients-and-preferences",
    );
    const [quiz] = await getQuizzesForLesson(lesson!.id);
    const [otherQuiz] = await getQuizzesForLesson(otherLesson!.id);
    const attempt = await startQuizAttempt(user.id, quiz!.id);
    const foreignQuestion = otherQuiz!.questions[0]!;

    await expect(
      submitQuizAnswer(user.id, attempt.id, foreignQuestion.id, {
        type: "MULTIPLE_CHOICE",
        optionId: foreignQuestion.options[0]!.id,
      }),
    ).rejects.toThrow();
    expect(
      await db.quizAnswer.count({ where: { quizAttemptId: attempt.id } }),
    ).toBe(0);
  });

  it("cannot complete an incomplete quiz or mutate it after completion", async () => {
    const user = await createTestUser(`quiz-state-${Date.now()}@hango.dev`);
    const lesson = await getLessonBySlug("restaurant-entering-and-ordering");
    const [quiz] = await getQuizzesForLesson(lesson!.id);
    const attempt = await startQuizAttempt(user.id, quiz!.id);

    await expect(completeQuizAttempt(user.id, attempt.id)).rejects.toThrow(
      "Answer every quiz question",
    );

    for (const question of quiz!.questions) {
      const correctOption = question.options.find((option) => option.isCorrect)!;
      await submitQuizAnswer(user.id, attempt.id, question.id, {
        type: "MULTIPLE_CHOICE",
        optionId: correctOption.id,
      });
    }
    await completeQuizAttempt(user.id, attempt.id);

    const firstQuestion = quiz!.questions[0]!;
    await expect(
      submitQuizAnswer(user.id, attempt.id, firstQuestion.id, {
        type: "MULTIPLE_CHOICE",
        optionId: firstQuestion.options[0]!.id,
      }),
    ).rejects.toThrow("complete");
  });

  it("server actions require an authenticated session", async () => {
    authMock.mockResolvedValue(null);
    await expect(startQuizAttemptAction("quiz-id")).rejects.toThrow(
      "Not authenticated",
    );
  });
});
