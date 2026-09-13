import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { AppLocale } from "@/i18n/config";
import { localizeContentRecord } from "@/lib/content/localization";

export const localizedMissionInclude = {
  translations: true,
  successConditions: {
    orderBy: { order: "asc" as const },
    include: { translations: true },
  },
  evaluationCriteria: {
    orderBy: { order: "asc" as const },
    include: { translations: true },
  },
} satisfies Prisma.MissionInclude;

export type MissionWithTranslations = Prisma.MissionGetPayload<{
  include: typeof localizedMissionInclude;
}>;

export function localizeMission(
  mission: MissionWithTranslations,
  locale: AppLocale,
) {
  const localized = localizeContentRecord(mission, locale, [
    "title",
    "context",
    "objective",
    "learnerRole",
    "aiRole",
  ]);

  return {
    ...localized,
    successConditions: localized.successConditions.map((condition) =>
      localizeContentRecord(condition, locale, ["description"]),
    ),
    evaluationCriteria: localized.evaluationCriteria.map((criterion) =>
      localizeContentRecord(criterion, locale, ["name", "description"]),
    ),
  };
}

export async function getMissionForLesson(
  lessonId: string,
  locale: AppLocale = "en",
) {
  const mission = await db.mission.findFirst({
    where: { lessonId, status: "PUBLISHED" },
    include: localizedMissionInclude,
  });
  return mission ? localizeMission(mission, locale) : null;
}

export async function getMissionForScenario(
  scenarioId: string,
  locale: AppLocale = "en",
) {
  const mission = await db.mission.findFirst({
    where: { scenarioId, status: "PUBLISHED" },
    include: localizedMissionInclude,
  });
  return mission ? localizeMission(mission, locale) : null;
}
