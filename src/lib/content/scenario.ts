import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { AppLocale } from "@/i18n/config";
import { localizeContentRecord } from "@/lib/content/localization";
import {
  localizeMission,
  localizedMissionInclude,
} from "@/lib/content/mission";

const publishedScenarioInclude = {
  translations: true,
  domain: { include: { translations: true } },
  learningObjectives: {
    orderBy: { order: "asc" as const },
    include: { translations: true },
  },
  levels: {
    orderBy: { order: "asc" as const },
    include: {
      lessons: {
        where: { status: "PUBLISHED" as const },
        orderBy: { order: "asc" as const },
        include: { translations: true },
      },
    },
  },
  missions: {
    where: { status: "PUBLISHED" as const },
    include: localizedMissionInclude,
  },
} satisfies Prisma.ScenarioInclude;

type PublishedScenario = Prisma.ScenarioGetPayload<{
  include: typeof publishedScenarioInclude;
}>;

function localizeScenario(scenario: PublishedScenario, locale: AppLocale) {
  const localized = localizeContentRecord(scenario, locale, [
    "name",
    "description",
    "context",
    "communicationOutcomes",
  ]);

  return {
    ...localized,
    domain: localizeContentRecord(localized.domain, locale, [
      "name",
      "description",
    ]),
    learningObjectives: localized.learningObjectives.map((objective) =>
      localizeContentRecord(objective, locale, ["description"]),
    ),
    levels: localized.levels.map((level) => ({
      ...level,
      lessons: level.lessons.map((lesson) =>
        localizeContentRecord(lesson, locale, [
          "title",
          "communicationObjective",
        ]),
      ),
    })),
    missions: localized.missions.map((mission) =>
      localizeMission(mission, locale),
    ),
  };
}

/**
 * Content retrieval services (4.6) — the only place UI code should reach
 * for curriculum data. Keeps educational content out of components
 * (continuous requirement 5) and centralizes the published-only filter
 * (4.7 — draft content must never reach learners).
 */
export async function getPublishedScenarios(locale: AppLocale = "en") {
  const scenarios = await db.scenario.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ domain: { order: "asc" } }, { order: "asc" }],
    include: publishedScenarioInclude,
  });
  return scenarios.map((scenario) => localizeScenario(scenario, locale));
}

export async function getScenarioBySlug(
  slug: string,
  locale: AppLocale = "en",
) {
  const scenario = await db.scenario.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: publishedScenarioInclude,
  });
  return scenario ? localizeScenario(scenario, locale) : null;
}
