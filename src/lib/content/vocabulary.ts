import { db } from "@/lib/db";
import type { AppLocale } from "@/i18n/config";
import { localizeContentRecord } from "@/lib/content/localization";

export async function getVocabularyForLesson(
  lessonId: string,
  locale: AppLocale = "en",
) {
  const vocabulary = await db.lessonVocabulary.findMany({
    where: { lessonId, vocabularyItem: { status: "PUBLISHED" } },
    orderBy: { order: "asc" },
    include: {
      vocabularyItem: {
        include: {
          translations: true,
          examples: {
            orderBy: { order: "asc" },
            include: { translations: true },
          },
        },
      },
    },
  });

  return vocabulary.map((lessonVocabulary) => {
    const item = localizeContentRecord(
      lessonVocabulary.vocabularyItem,
      locale,
      ["meaning", "partOfSpeech"],
    );
    return {
      ...lessonVocabulary,
      vocabularyItem: {
        ...item,
        examples: item.examples.map((example) =>
          localizeContentRecord(example, locale, ["translation"]),
        ),
      },
    };
  });
}

/**
 * All published words tagged at a given level, across every lesson - the
 * source pool for the Dashboard's "Words of the Day" widget
 * (words-of-the-day.ts). `orderBy: { id: "asc" }` only needs to be stable,
 * not chronological - the caller picks a deterministic slice out of it.
 */
export async function getVocabularyItemsForLevel(
  hskLevel: number,
  locale: AppLocale = "en",
) {
  const items = await db.vocabularyItem.findMany({
    where: { hskLevel, status: "PUBLISHED" },
    select: {
      chineseForm: true,
      pinyin: true,
      meaning: true,
      translations: true,
    },
    orderBy: { id: "asc" },
  });
  return items.map((item) => localizeContentRecord(item, locale, ["meaning"]));
}
