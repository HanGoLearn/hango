import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { AppLocale } from "@/i18n/config";
import { localizeContentRecord } from "@/lib/content/localization";

export const localizedExerciseInclude = {
  translations: true,
  options: {
    orderBy: { order: "asc" as const },
    include: { translations: true },
  },
  hints: {
    orderBy: { level: "asc" as const },
    include: { translations: true },
  },
} satisfies Prisma.ExerciseInclude;

export type ExerciseWithTranslations = Prisma.ExerciseGetPayload<{
  include: typeof localizedExerciseInclude;
}>;

export function localizeExercise(
  exercise: ExerciseWithTranslations,
  locale: AppLocale,
) {
  const localized = localizeContentRecord(exercise, locale, [
    "prompt",
    "explanation",
  ]);
  return {
    ...localized,
    options: localized.options.map((option) =>
      localizeContentRecord(option, locale, ["content"]),
    ),
    hints: localized.hints.map((hint) =>
      localizeContentRecord(hint, locale, ["text"]),
    ),
  };
}

/** Excludes grammarPointId-linked exercises - those belong to the Grammar step's own practice section, not the general Comprehension/Guided Practice pool (see getExercisesForGrammarPoint). */
export async function getExercisesForLesson(
  lessonId: string,
  locale: AppLocale = "en",
) {
  const exercises = await db.exercise.findMany({
    where: { lessonId, status: "PUBLISHED", grammarPointId: null },
    orderBy: { order: "asc" },
    include: localizedExerciseInclude,
  });
  return exercises.map((exercise) => localizeExercise(exercise, locale));
}

export async function getExercisesForGrammarPoint(
  grammarPointId: string,
  locale: AppLocale = "en",
) {
  const exercises = await db.exercise.findMany({
    where: { grammarPointId, status: "PUBLISHED" },
    orderBy: { order: "asc" },
    include: localizedExerciseInclude,
  });
  return exercises.map((exercise) => localizeExercise(exercise, locale));
}
