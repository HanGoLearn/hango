import { db } from "@/lib/db";

/** Excludes grammarPointId-linked exercises - those belong to the Grammar step's own practice section, not the general Comprehension/Guided Practice pool (see getExercisesForGrammarPoint). */
export async function getExercisesForLesson(lessonId: string) {
  return db.exercise.findMany({
    where: { lessonId, status: "PUBLISHED", grammarPointId: null },
    orderBy: { order: "asc" },
    include: {
      options: { orderBy: { order: "asc" } },
      hints: { orderBy: { level: "asc" } },
    },
  });
}

export async function getExercisesForGrammarPoint(grammarPointId: string) {
  return db.exercise.findMany({
    where: { grammarPointId, status: "PUBLISHED" },
    orderBy: { order: "asc" },
    include: {
      options: { orderBy: { order: "asc" } },
      hints: { orderBy: { level: "asc" } },
    },
  });
}
