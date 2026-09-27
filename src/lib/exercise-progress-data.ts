import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import {
  evaluateAnswer,
  findCorrectOptionId,
  type ExerciseAnswer,
} from "@/lib/exercise-progress";
import {
  recordProgressEvidence,
  getLessonCompetencyIds,
} from "@/lib/progress-evidence";
import { normalizeDifficulty } from "@/lib/competency-progress";

/**
 * Grades server-side (never trusts a client-supplied "isCorrect") and
 * stores the attempt (7.1 "Store attempts", "Support retry" - each call
 * adds a new row rather than overwriting the last one).
 */
export async function recordExerciseAttempt(
  userId: string,
  exerciseId: string,
  answer: ExerciseAnswer,
) {
  const exercise = await db.exercise.findUniqueOrThrow({
    where: { id: exerciseId },
    include: { options: true },
  });

  const isCorrect = evaluateAnswer(
    exercise.correctAnswer,
    exercise.options,
    answer,
  );

  const previousAttempts = await db.exerciseAttempt.count({
    where: { userId, exerciseId },
  });

  const attempt = await db.exerciseAttempt.create({
    data: {
      userId,
      exerciseId,
      answer: answer as unknown as Prisma.InputJsonValue,
      isCorrect,
      attemptNumber: previousAttempts + 1,
    },
  });

  // Reflection must always be generated from the attempts that actually
  // happened in the current lesson run, never from a stale cached report.
  if (exercise.lessonId) {
    await db.lessonReflectionReport.deleteMany({
      where: { userId, lessonId: exercise.lessonId },
    });
  }

  if (isCorrect !== null) {
    const competencyIds = await getLessonCompetencyIds(
      exercise.lessonId,
      "EXERCISE",
    );
    await recordProgressEvidence(
      userId,
      competencyIds,
      "EXERCISE",
      isCorrect ? 1 : 0,
      exercise.difficulty,
      attempt.id,
    );
  }

  return {
    attempt,
    isCorrect,
    explanation: exercise.explanation,
    correctOptionId: findCorrectOptionId(exercise.options),
  };
}

export interface GradedExerciseResult {
  exerciseId: string;
  isCorrect: boolean | null;
  explanation: string | null;
  correctOptionId: string | null;
}

/**
 * Grades and records several exercise attempts in one batch (2026-08-19,
 * Grammar batching - project/learning-journey-optimization.md, "el grande
 * con el cambio de experiencia"). Same server-side grading as
 * `recordExerciseAttempt` above (never trusts a client-supplied
 * "isCorrect") - the per-exercise fixed overhead that function pays on
 * every call (fetching the exercise, counting previous attempts,
 * invalidating any cached reflection report) is paid once for the whole
 * batch here instead of once per exercise. Attempt creation still runs one
 * `create` per exercise (inside one `$transaction`, for atomicity and a
 * single round trip) rather than a single `createMany`, since
 * `createMany` doesn't return the created rows' ids and
 * `ProgressEvidence.relatedActivityId` needs a real one per attempt.
 */
export async function recordExerciseAttempts(
  userId: string,
  answers: { exerciseId: string; answer: ExerciseAnswer }[],
): Promise<GradedExerciseResult[]> {
  if (answers.length === 0) return [];

  const exerciseIds = [...new Set(answers.map((a) => a.exerciseId))];

  // Grading and the resend-count both only need the exercise ids the
  // learner just answered, so neither depends on the other's result - this
  // was two sequential round trips to the database before (2026-09-26
  // performance fix, "tarda mucho al comprobar respuestas"), which on the
  // real remote database is two full network round trips of pure waiting
  // for nothing. Run together instead.
  const [exercises, previousAttemptRows] = await Promise.all([
    db.exercise.findMany({
      where: { id: { in: exerciseIds } },
      include: { options: true },
    }),
    db.exerciseAttempt.findMany({
      where: { userId, exerciseId: { in: exerciseIds } },
      select: { exerciseId: true },
    }),
  ]);
  const exerciseById = new Map(
    exercises.map((exercise) => [exercise.id, exercise]),
  );

  const attemptNumberByExercise = new Map<string, number>();
  for (const row of previousAttemptRows) {
    attemptNumberByExercise.set(
      row.exerciseId,
      (attemptNumberByExercise.get(row.exerciseId) ?? 0) + 1,
    );
  }

  const graded = answers.map(({ exerciseId, answer }) => {
    const exercise = exerciseById.get(exerciseId);
    if (!exercise) throw new Error(`Exercise not found: ${exerciseId}`);
    const isCorrect = evaluateAnswer(
      exercise.correctAnswer,
      exercise.options,
      answer,
    );
    return { exercise, answer, isCorrect };
  });

  // One reflection-invalidation covering every distinct lesson in the
  // batch (in practice always one - a single Grammar step) instead of
  // once per exercise. Computed before the transaction below so it can
  // join the same one.
  const lessonIds = [
    ...new Set(
      graded
        .map(({ exercise }) => exercise.lessonId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  // The N attempt creates plus the reflection-invalidation used to be two
  // separate round trips - the array form of $transaction already sends
  // every operation inside it as one batched round trip (same as before
  // this fix, for the N creates alone); this just folds the previously
  // separate reflection deleteMany into that same array instead of
  // awaiting it afterward. Neither depends on the other's result, so
  // combining them costs nothing and saves a full round trip on every
  // check - and it makes the invalidation atomic with the attempts it
  // describes, which the previous two-step version wasn't quite.
  type ExerciseAttemptRow = Awaited<
    ReturnType<typeof db.exerciseAttempt.create>
  >;
  const createOps: Prisma.PrismaPromise<ExerciseAttemptRow>[] = graded.map(
    ({ exercise, answer, isCorrect }) => {
      const attemptNumber = (attemptNumberByExercise.get(exercise.id) ?? 0) + 1;
      attemptNumberByExercise.set(exercise.id, attemptNumber);
      return db.exerciseAttempt.create({
        data: {
          userId,
          exerciseId: exercise.id,
          answer: answer as unknown as Prisma.InputJsonValue,
          isCorrect,
          attemptNumber,
        },
      });
    },
  );

  const transactionOps: Prisma.PrismaPromise<unknown>[] =
    lessonIds.length > 0
      ? [
          ...createOps,
          db.lessonReflectionReport.deleteMany({
            where: { userId, lessonId: { in: lessonIds } },
          }),
        ]
      : createOps;

  const results = await db.$transaction(transactionOps);
  const attempts = results.slice(0, createOps.length) as ExerciseAttemptRow[];

  // One combined evidence write for the whole batch instead of N separate
  // recordProgressEvidence calls. The distinct lessonId lookups run
  // together rather than once per exercise (2026-09-26): getLessonCompetencyIds
  // is TTL-cached, so in practice this only ever issues one real query
  // regardless, but resolving them concurrently instead of inside a
  // sequential loop removes even that first-call latency from the critical
  // path when several grammar points share one lesson.
  const competencyIdsByLesson = new Map(
    await Promise.all(
      lessonIds.map(
        async (lessonId) =>
          [
            lessonId,
            await getLessonCompetencyIds(lessonId, "EXERCISE"),
          ] as const,
      ),
    ),
  );

  const evidenceRows: Prisma.ProgressEvidenceCreateManyInput[] = [];
  for (let i = 0; i < graded.length; i++) {
    const { exercise, isCorrect } = graded[i]!;
    if (isCorrect === null || !exercise.lessonId) continue;
    const competencyIds = competencyIdsByLesson.get(exercise.lessonId) ?? [];
    const difficulty = normalizeDifficulty("EXERCISE", exercise.difficulty);
    for (const competencyId of competencyIds) {
      evidenceRows.push({
        userId,
        competencyId,
        source: "EXERCISE",
        result: isCorrect ? 1 : 0,
        difficulty,
        relatedActivityId: attempts[i]!.id,
      });
    }
  }
  if (evidenceRows.length > 0) {
    await db.progressEvidence.createMany({ data: evidenceRows });
  }

  return graded.map(({ exercise, isCorrect }) => ({
    exerciseId: exercise.id,
    isCorrect,
    explanation: exercise.explanation,
    correctOptionId: findCorrectOptionId(exercise.options),
  }));
}
