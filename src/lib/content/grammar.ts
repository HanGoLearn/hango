import { db } from "@/lib/db";
import type { AppLocale } from "@/i18n/config";
import { localizeContentRecord } from "@/lib/content/localization";
import {
  localizeExercise,
  localizedExerciseInclude,
} from "@/lib/content/exercise";

export async function getGrammarForLesson(
  lessonId: string,
  locale: AppLocale = "en",
) {
  const grammar = await db.lessonGrammarPoint.findMany({
    where: { lessonId, grammarPoint: { status: "PUBLISHED" } },
    orderBy: { order: "asc" },
    include: {
      grammarPoint: {
        include: {
          translations: true,
          examples: {
            orderBy: { order: "asc" },
            include: { translations: true },
          },
          // Eager, server-side (2026-08-19, project/learning-journey-
          // optimization.md Facet B) - hand-authored, same as examples
          // above, so there's no AI-generation reason to keep this behind
          // a separate per-grammar-point client fetch (getGrammarExercisesAction
          // used to fire once per grammar point on every Grammar step
          // mount; GrammarPointCard now reads grammarPoint.exercises
          // directly).
          exercises: {
            where: { status: "PUBLISHED" },
            orderBy: { order: "asc" },
            include: localizedExerciseInclude,
          },
        },
      },
    },
  });

  return grammar.map((lessonGrammarPoint) => {
    const grammarPoint = localizeContentRecord(
      lessonGrammarPoint.grammarPoint,
      locale,
      ["name", "communicationPurpose", "explanation", "commonMistake"],
    );
    return {
      ...lessonGrammarPoint,
      grammarPoint: {
        ...grammarPoint,
        examples: grammarPoint.examples.map((example) =>
          localizeContentRecord(example, locale, ["translation"]),
        ),
        exercises: grammarPoint.exercises.map((exercise) =>
          localizeExercise(exercise, locale),
        ),
      },
    };
  });
}
