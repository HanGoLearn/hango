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

/**
 * All published words tagged at a given level, across every lesson - the
 * source pool for the Dashboard's "Words of the Day" widget
 * (words-of-the-day.ts). `orderBy: { id: "asc" }` only needs to be stable,
 * not chronological - the caller picks a deterministic slice out of it.
 */
export async function getVocabularyItemsForLevel(hskLevel: number) {
  return db.vocabularyItem.findMany({
    where: { hskLevel, status: "PUBLISHED" },
    select: { chineseForm: true, pinyin: true, meaning: true },
    orderBy: { id: "asc" },
  });
}
