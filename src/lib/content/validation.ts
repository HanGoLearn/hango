import type { PrismaClient } from "@/generated/prisma/client";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const OPTION_BASED_TYPES = new Set([
  "MULTIPLE_CHOICE",
  "TRUE_FALSE",
  "MATCHING",
]);

function validateExerciseAnswer(exercise: {
  id: string;
  type: string;
  correctAnswer: unknown;
  options: { isCorrect: boolean }[];
}): string[] {
  const errors: string[] = [];
  if (OPTION_BASED_TYPES.has(exercise.type)) {
    if (!exercise.options.some((option) => option.isCorrect)) {
      errors.push(
        `Exercise ${exercise.id}: ${exercise.type} requires at least one correct option`,
      );
    }
  } else if (
    exercise.correctAnswer === null ||
    exercise.correctAnswer === undefined
  ) {
    errors.push(`Exercise ${exercise.id}: missing correctAnswer`);
  }
  return errors;
}

/**
 * Required-content gate before a Lesson may move DRAFT -> PUBLISHED (4.7).
 * Required relations are the union of 04_content_validation.md's
 * "Structural Validation" list and 06_quality_standards.md's lesson
 * checklist, limited to what this phase's schema actually models —
 * speaking/writing activities aren't their own tables yet (FASE 10/11), so
 * they aren't checked here.
 */
export async function validateLessonForPublish(
  db: PrismaClient,
  lessonId: string,
): Promise<ValidationResult> {
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: {
      dialogues: true,
      vocabulary: true,
      grammarPoints: true,
      exercises: { include: { options: true } },
      quizzes: true,
      missions: true,
    },
  });

  if (!lesson) {
    return { valid: false, errors: [`Lesson ${lessonId} does not exist`] };
  }

  const errors: string[] = [];

  if (!lesson.communicationObjective.trim()) {
    errors.push("Lesson is missing a communication objective");
  }
  if (lesson.dialogues.length === 0) {
    errors.push("Lesson has no dialogue");
  }
  if (lesson.vocabulary.length === 0) {
    errors.push("Lesson has no vocabulary");
  }
  if (lesson.grammarPoints.length === 0) {
    errors.push("Lesson has no grammar points");
  }
  if (lesson.exercises.length === 0) {
    errors.push("Lesson has no exercises");
  }
  if (lesson.quizzes.length === 0) {
    errors.push("Lesson has no quiz");
  }
  if (lesson.missions.length === 0) {
    errors.push("Lesson has no mission");
  }

  for (const exercise of lesson.exercises) {
    errors.push(...validateExerciseAnswer(exercise));
  }

  return { valid: errors.length === 0, errors };
}
