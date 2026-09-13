import { db } from "@/lib/db";
import type { AppLocale } from "@/i18n/config";
import { localizeContentRecord } from "@/lib/content/localization";

export async function getLessonBySlug(slug: string, locale: AppLocale = "en") {
  const lesson = await db.lesson.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      translations: true,
      steps: {
        orderBy: { order: "asc" },
        include: { translations: true },
      },
      learningObjectives: {
        orderBy: { order: "asc" },
        include: { translations: true },
      },
      competencies: { include: { competency: true } },
      scenarioLevel: {
        include: {
          scenario: { include: { translations: true } },
        },
      },
    },
  });
  if (!lesson) return null;

  const localized = localizeContentRecord(lesson, locale, [
    "title",
    "communicationObjective",
  ]);
  return {
    ...localized,
    steps: localized.steps.map((step) =>
      localizeContentRecord(step, locale, ["title"]),
    ),
    learningObjectives: localized.learningObjectives.map((objective) =>
      localizeContentRecord(objective, locale, ["description"]),
    ),
    scenarioLevel: {
      ...localized.scenarioLevel,
      scenario: localizeContentRecord(
        localized.scenarioLevel.scenario,
        locale,
        ["name", "description", "context", "communicationOutcomes"],
      ),
    },
  };
}

export async function getLessonsForScenarioLevel(
  scenarioLevelId: string,
  locale: AppLocale = "en",
) {
  const lessons = await db.lesson.findMany({
    where: { scenarioLevelId, status: "PUBLISHED" },
    orderBy: { order: "asc" },
    include: { translations: true },
  });
  return lessons.map((lesson) =>
    localizeContentRecord(lesson, locale, ["title", "communicationObjective"]),
  );
}
