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
    const competencyIds = await getLessonCompetencyIds(exercise.lessonId, "EXERCISE");
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
  const exercises = await db.exercise.findMany({
    where: { id: { in: exerciseIds } },
    include: { options: true },
  });
  const exerciseById = new Map(exercises.map((exercise) => [exercise.id, exercise]));

  const previousAttemptRows = await db.exerciseAttempt.findMany({
    where: { userId, exerciseId: { in: exerciseIds } },
    select: { exerciseId: true },
  });
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
    const isCorrect = evaluateAnswer(exercise.correctAnswer, exercise.options, answer);
    return { exercise, answer, isCorrect };
  });

  const attempts = await db.$transaction(
    graded.map(({ exercise, answer, isCorrect }) => {
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
    }),
  );

  // One reflection-invalidation covering every distinct lesson in the
  // batch (in practice always one - a single Grammar step) instead of
  // once per exercise.
  const lessonIds = [
    ...new Set(
      graded
        .map(({ exercise }) => exercise.lessonId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  if (lessonIds.length > 0) {
    await db.lessonReflectionReport.deleteMany({
      where: { userId, lessonId: { in: lessonIds } },
    });
  }

  // One combined evidence write for the whole batch instead of N separate
  // recordProgressEvidence calls - getLessonCompetencyIds is already
  // TTL-cached (Tier 3), so repeated lookups for the same lessonId across
  // exercises cost nothing extra either way.
  const evidenceRows: Prisma.ProgressEvidenceCreateManyInput[] = [];
  for (let i = 0; i < graded.length; i++) {
    const { exercise, isCorrect } = graded[i]!;
    if (isCorrect === null) continue;
    const competencyIds = await getLessonCompetencyIds(exercise.lessonId, "EXERCISE");
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
