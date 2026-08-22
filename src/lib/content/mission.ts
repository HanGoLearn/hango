import { db } from "@/lib/db";

const include = {
  successConditions: { orderBy: { order: "asc" as const } },
  evaluationCriteria: { orderBy: { order: "asc" as const } },
};

export async function getMissionForLesson(lessonId: string) {
  return db.mission.findFirst({
    where: { lessonId, status: "PUBLISHED" },
    include,
  });
}

export async function getMissionForScenario(scenarioId: string) {
  return db.mission.findFirst({
    where: { scenarioId, status: "PUBLISHED" },
    include,
  });
}
