import { db } from "@/lib/db";

/**
 * Content retrieval services (4.6) — the only place UI code should reach
 * for curriculum data. Keeps educational content out of components
 * (continuous requirement 5) and centralizes the published-only filter
 * (4.7 — draft content must never reach learners).
 */
export async function getPublishedScenarios() {
  return db.scenario.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ domain: { order: "asc" } }, { order: "asc" }],
    include: { domain: true },
  });
}

export async function getScenarioBySlug(slug: string) {
  return db.scenario.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      domain: true,
      learningObjectives: { orderBy: { order: "asc" } },
      levels: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            where: { status: "PUBLISHED" },
            orderBy: { order: "asc" },
          },
        },
      },
      missions: {
        where: { status: "PUBLISHED" },
        include: { successConditions: { orderBy: { order: "asc" } } },
      },
    },
  });
}
