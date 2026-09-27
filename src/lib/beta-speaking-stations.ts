import "server-only";

import { db } from "@/lib/db";
import {
  BETA_SPEAKING_STATIONS,
  type BetaSpeakingStationDefinition,
} from "@/lib/beta-learning-scope";
import { getSpeakingLessonOptions } from "@/lib/content/speaking-prompts";
import type { AppLocale } from "@/i18n/config";

export interface BetaSpeakingStationData {
  id: BetaSpeakingStationDefinition["id"];
  lessonId: string;
  lessonSlug: string;
  lessonTitle: string;
  scenarioTitle: string;
  unlocked: boolean;
}

export async function getBetaSpeakingStations(
  userId: string,
  locale: AppLocale,
): Promise<BetaSpeakingStationData[]> {
  const lessonOptions = await getSpeakingLessonOptions(locale);
  const definitions = BETA_SPEAKING_STATIONS.flatMap((definition) => {
    const lesson = lessonOptions.find(
      (option) => option.slug === definition.lessonSlug,
    );
    return lesson ? [{ definition, lesson }] : [];
  });

  const progressRows =
    definitions.length === 0
      ? []
      : await db.learnerLessonProgress.findMany({
          where: {
            userId,
            lessonId: { in: definitions.map(({ lesson }) => lesson.id) },
          },
          select: { lessonId: true },
        });
  const startedLessonIds = new Set(progressRows.map((row) => row.lessonId));

  return definitions.map(({ definition, lesson }) => ({
    id: definition.id,
    lessonId: lesson.id,
    lessonSlug: lesson.slug,
    lessonTitle: lesson.title,
    scenarioTitle: lesson.scenarioTitle,
    unlocked: startedLessonIds.has(lesson.id),
  }));
}
