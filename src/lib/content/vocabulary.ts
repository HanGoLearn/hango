import { db } from "@/lib/db";

export async function getVocabularyForLesson(lessonId: string) {
  return db.lessonVocabulary.findMany({
    where: { lessonId, vocabularyItem: { status: "PUBLISHED" } },
    orderBy: { order: "asc" },
    include: {
      vocabularyItem: {
        include: { examples: { orderBy: { order: "asc" } } },
      },
    },
  });
}
