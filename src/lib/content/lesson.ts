import { db } from "@/lib/db";

export async function getLessonBySlug(slug: string) {
  return db.lesson.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      steps: { orderBy: { order: "asc" } },
      learningObjectives: { orderBy: { order: "asc" } },
      competencies: { include: { competency: true } },
      scenarioLevel: { include: { scenario: true } },
    },
  });
}

export async function getLessonsForScenarioLevel(scenarioLevelId: string) {
  return db.lesson.findMany({
    where: { scenarioLevelId, status: "PUBLISHED" },
    orderBy: { order: "asc" },
  });
}
