import { db } from "@/lib/db";

export async function getGrammarForLesson(lessonId: string) {
  return db.lessonGrammarPoint.findMany({
    where: { lessonId, grammarPoint: { status: "PUBLISHED" } },
    orderBy: { order: "asc" },
    include: {
      grammarPoint: {
        include: {
          examples: { orderBy: { order: "asc" } },
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
            include: {
              options: { orderBy: { order: "asc" } },
              hints: { orderBy: { level: "asc" } },
            },
          },
        },
      },
    },
  });
}
