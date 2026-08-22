import { db } from "@/lib/db";
import { normalizeDifficulty } from "@/lib/competency-progress";
import { createTtlCache } from "@/lib/ttl-cache";

export type ProgressEvidenceSourceType =
  "EXERCISE" | "QUIZ" | "SPEAKING" | "WRITING" | "MISSION";

export function isEvidenceRelevantToCompetency(
  source: ProgressEvidenceSourceType,
  competency: { name: string; category: string },
): boolean {
  switch (source) {
    case "EXERCISE":
    case "QUIZ":
      return competency.name === "LISTENING" || competency.name === "READING";
    case "SPEAKING":
      return competency.name === "SPEAKING" || competency.category === "COMMUNICATION_ABILITY";
    case "WRITING":
      return competency.name === "WRITING" || competency.category === "COMMUNICATION_ABILITY";
    case "MISSION":
      return competency.category === "COMMUNICATION_ABILITY";
  }
}

/**
 * Writes one ProgressEvidence row per competency a graded activity touches
 * (13.1). Attribution only works for lesson-scoped activities - Competency
 * only links to content through `LessonCompetency`, so a scenario-scoped
 * activity (a Scenario Role Play speaking session, a scenario's final
 * mission) has no competency to attribute evidence to and is silently
 * skipped (empty `competencyIds`). This is a real scope gap, not a bug -
 * closing it would mean modeling scenario-level competency links, which no
 * doc calls for.
 */
export async function recordProgressEvidence(
  userId: string,
  competencyIds: string[],
  source: ProgressEvidenceSourceType,
  result: number,
  difficultyLabel: string | null | undefined,
  relatedActivityId: string,
): Promise<void> {
  if (competencyIds.length === 0) return;

  const difficulty = normalizeDifficulty(source, difficultyLabel);
  await db.progressEvidence.createMany({
    data: competencyIds.map((competencyId) => ({
      userId,
      competencyId,
      source,
      result,
      difficulty,
      relatedActivityId,
    })),
  });
}

/** Replaces one stable assessment snapshot without duplicating it on reload. */
export async function replaceProgressEvidence(
  userId: string,
  competencyIds: string[],
  source: ProgressEvidenceSourceType,
  result: number,
  difficultyLabel: string | null | undefined,
  relatedActivityId: string,
): Promise<void> {
  if (competencyIds.length === 0) return;

  const difficulty = normalizeDifficulty(source, difficultyLabel);
  const boundedResult = Math.max(0, Math.min(1, result));
  await db.$transaction([
    db.progressEvidence.deleteMany({
      where: {
        userId,
        competencyId: { in: competencyIds },
        source,
        relatedActivityId,
      },
    }),
    db.progressEvidence.createMany({
      data: competencyIds.map((competencyId) => ({
        userId,
        competencyId,
        source,
        result: boundedResult,
        difficulty,
        relatedActivityId,
      })),
    }),
  ]);
}

/** No live publish/unpublish action exists in this app - content only changes via seed scripts/migrations, so a multi-minute staleness window costs nothing in practice. */
const LESSON_COMPETENCY_IDS_TTL_MS = 5 * 60 * 1000;

/**
 * Which competencies a lesson maps to - authored curriculum metadata, not
 * per-user data, but queried fresh on every single exercise submission and
 * quiz completion (5-10+ times per lesson session). A genuine caching
 * candidate (project/db-operations-optimization.md, Tier 3). See
 * ttl-cache.ts for why this isn't Next's own `unstable_cache`.
 */
const getCachedLessonCompetencyIds = createTtlCache(
  async (
    lessonId: string,
    source: ProgressEvidenceSourceType,
  ): Promise<string[]> => {
    const rows = await db.lessonCompetency.findMany({
      where: { lessonId },
      select: {
        competencyId: true,
        competency: { select: { name: true, category: true } },
      },
    });
    return rows
      .filter((row) => isEvidenceRelevantToCompetency(source, row.competency))
      .map((row) => row.competencyId);
  },
  LESSON_COMPETENCY_IDS_TTL_MS,
);

export async function getLessonCompetencyIds(
  lessonId: string | null | undefined,
  source: ProgressEvidenceSourceType,
): Promise<string[]> {
  if (!lessonId) return [];
  return getCachedLessonCompetencyIds(lessonId, source);
}
