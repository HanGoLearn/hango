import "server-only";
import { db } from "@/lib/db";
import {
  resolveJourneyChapter,
  type JourneyChapter,
} from "@/lib/content/learning-journey";
import { createTtlCache } from "@/lib/ttl-cache";

/**
 * Published-curriculum weights, shared by the two callers that turn them
 * into General Level points (2026-09-21). Extracted from
 * scenario-completion.ts so general-level.ts can credit a scenario the
 * learner is still inside without importing it: scenario-completion.ts
 * already imports recomputeGeneralLevelPoints, so reaching back the other
 * way would be a cycle.
 *
 * No live publish/unpublish action exists in this app - content only
 * changes via seed scripts/migrations, so a multi-minute staleness window
 * costs nothing in practice.
 */
const CURRICULUM_WEIGHTS_TTL_MS = 5 * 60 * 1000;

export interface ScenarioWeights {
  scenarioId: string;
  chapter: JourneyChapter;
  /** Every published lesson in the scenario, with the weight points are split by. */
  lessons: { id: string; hskReference: number | null }[];
  hskSum: number;
}

/**
 * Total HSK-reference weight per chapter, across every published lesson -
 * the denominator in computeScenarioPointsBudget().
 *
 * Deliberately resolves each lesson's chapter from its OWN level's
 * difficulty, which is what this sum has always done. Note that
 * getOrGenerateScenarioCompletion resolves a *scenario's* chapter across
 * all of its levels instead, so a multi-level scenario can contribute its
 * lessons to one chapter's denominator while drawing its budget from
 * another. That asymmetry predates this refactor and is preserved exactly:
 * changing it would move every learner's points.
 */
export const getChapterHskSums = createTtlCache(
  async (): Promise<Record<JourneyChapter, number>> => {
    const lessons = await db.lesson.findMany({
      where: { status: "PUBLISHED" },
      select: {
        hskReference: true,
        scenarioLevel: { select: { difficulty: true } },
      },
    });

    const sums: Record<JourneyChapter, number> = {
      BEGINNER: 0,
      INTERMEDIATE: 0,
      ADVANCED: 0,
    };
    for (const lesson of lessons) {
      const chapter = resolveJourneyChapter([lesson.scenarioLevel.difficulty]);
      sums[chapter] += lesson.hskReference ?? 3;
    }
    return sums;
  },
  CURRICULUM_WEIGHTS_TTL_MS,
);

/**
 * Every published scenario with the lessons its point budget is split
 * across. `chapter` is resolved across all of the scenario's levels, the
 * same way getOrGenerateScenarioCompletion resolves it, so a partial
 * credit computed from this lands on the identical budget the finished
 * scenario will later record.
 */
export const getPublishedScenarioWeights = createTtlCache(
  async (): Promise<ScenarioWeights[]> => {
    const scenarios = await db.scenario.findMany({
      where: { status: "PUBLISHED" },
      select: {
        id: true,
        levels: {
          select: {
            difficulty: true,
            lessons: {
              where: { status: "PUBLISHED" },
              select: { id: true, hskReference: true },
            },
          },
        },
      },
    });

    return scenarios.map((scenario) => {
      const lessons = scenario.levels.flatMap((level) => level.lessons);
      return {
        scenarioId: scenario.id,
        chapter: resolveJourneyChapter(
          scenario.levels.map((level) => level.difficulty),
        ),
        lessons,
        hskSum: lessons.reduce((sum, l) => sum + (l.hskReference ?? 3), 0),
      };
    });
  },
  CURRICULUM_WEIGHTS_TTL_MS,
);
