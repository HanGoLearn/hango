import { cache } from "react";
import { db } from "@/lib/db";
import { getScenarioBySlug } from "@/lib/content/scenario";
import { createTtlCache } from "@/lib/ttl-cache";
import {
  JOURNEY_CHAPTER_ORDER,
  resolveJourneyChapter,
  resolveScenarioStatus,
  resolveLessonAvailability,
  resolveContinueLearning,
} from "@/lib/content/learning-journey";

/**
 * Data-fetching layer combining published curriculum content with one
 * learner's completion data — kept separate from learning-journey.ts's
 * pure functions so those stay trivially unit-testable without a database.
 */

/**
 * Cached per-request (React.cache) - Dashboard and Progress each pull this
 * same lessonId list through 3-4 independent functions
 * (getScenariosWithProgress, getContinueLearningTarget,
 * getVocabularyGrammarExposure, getReviewQueue); without the cache each one
 * re-fired the identical query (project/db-operations-optimization.md,
 * Tier 1).
 */
export const getCompletedLessonIds = cache(
  async (userId: string): Promise<string[]> => {
    const completions = await db.learnerLessonCompletion.findMany({
      where: { userId },
      select: { lessonId: true },
    });
    return completions.map((c) => c.lessonId);
  },
);

/**
 * Every LessonVocabulary row across a learner's completed lessons, full
 * projection (vocabularyItem + lesson) - cached per-request (React.cache,
 * 2026-08-21) so `getReviewQueue` (review-data.ts) and
 * `getVocabularyGrammarExposure` (progress-data.ts) share one fetch instead
 * of each running its own separately-shaped query against the same table
 * with the same `lessonId: { in: lessonIds }` filter (both fire in the same
 * Promise.all on the Progress page). The narrower "just the distinct count"
 * query getVocabularyGrammarExposure used before this is now derived
 * client-side (a Set over these already-fetched rows) instead of a second
 * round trip.
 */
export const getLessonVocabularyRows = cache(async (userId: string) => {
  const lessonIds = await getCompletedLessonIds(userId);
  if (lessonIds.length === 0) return [];
  return db.lessonVocabulary.findMany({
    where: { lessonId: { in: lessonIds } },
    include: {
      vocabularyItem: true,
      lesson: { select: { slug: true, title: true } },
    },
    orderBy: { order: "asc" },
  });
});

/** Same sharing rationale as getLessonVocabularyRows, for LessonGrammarPoint. */
export const getLessonGrammarPointRows = cache(async (userId: string) => {
  const lessonIds = await getCompletedLessonIds(userId);
  if (lessonIds.length === 0) return [];
  return db.lessonGrammarPoint.findMany({
    where: { lessonId: { in: lessonIds } },
    include: {
      grammarPoint: true,
      lesson: { select: { slug: true, title: true } },
    },
    orderBy: { order: "asc" },
  });
});

/** No live publish/unpublish action exists in this app - content only changes via seed scripts/migrations, so a multi-minute staleness window costs nothing in practice (same reasoning as getLessonCompetencyIds, progress-evidence.ts). */
const PUBLISHED_SCENARIO_TREE_TTL_MS = 5 * 60 * 1000;

/**
 * Every published scenario -> domain -> level -> lesson, identical for
 * every learner and queried fresh on every Learning Journey/Dashboard/
 * Progress visit (2026-08-20, project/learning-journey-optimization.md) -
 * `getScenariosWithProgress` and `getContinueLearningTarget` each ran
 * their own separate version of this same query, and `getDashboardData`
 * (dashboard-data.ts) calls both in the same `Promise.all`, so one
 * Dashboard load paid for this curriculum tree twice. Selects the union of
 * fields either caller needs (`getScenariosWithProgress` needs `domain`
 * and `description`; `getContinueLearningTarget` needs lessons'
 * `order`/`slug`/`title`) so both can share one cached fetch instead of
 * each declaring a narrower, mutually-incompatible shape.
 */
const getCachedPublishedScenarioTree = createTtlCache(
  () =>
    db.scenario.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ domain: { order: "asc" } }, { order: "asc" }],
      include: {
        domain: true,
        levels: {
          orderBy: { order: "asc" },
          include: {
            lessons: {
              where: { status: "PUBLISHED" },
              orderBy: { order: "asc" },
              select: { id: true, order: true, slug: true, title: true },
            },
          },
        },
      },
    }),
  PUBLISHED_SCENARIO_TREE_TTL_MS,
);

/**
 * The exact curriculum sequence rendered by Learning Journey: chapters first,
 * then the already ordered domain/scenario tree, followed by each scenario's
 * ordered levels and lessons. Consumers such as the temporary Speaking QA
 * picker must use this instead of inventing a second, subtly different order.
 */
export async function getPublishedJourneyLessonSequence() {
  const scenarios = await getCachedPublishedScenarioTree();

  return JOURNEY_CHAPTER_ORDER.flatMap((chapter) =>
    scenarios
      .filter(
        (scenario) =>
          resolveJourneyChapter(
            scenario.levels.map((level) => level.difficulty),
          ) === chapter,
      )
      .flatMap((scenario) =>
        scenario.levels.flatMap((level) =>
          level.lessons.map((lesson) => ({
            ...lesson,
            chapter,
            difficulty: level.difficulty,
            scenarioTitle: scenario.name,
            scenarioSlug: scenario.slug,
          })),
        ),
      ),
  );
}

/**
 * Compact authoritative content map for Han's own app-navigation answers.
 * Reuses the existing published-tree cache, so voice/text sessions do not add
 * a second curriculum query. Deliberately excludes learner progress and full
 * lesson content: Han only needs enough information to recommend a real route.
 */
export async function getPublishedJourneyCatalog() {
  const scenarios = await getCachedPublishedScenarioTree();
  return scenarios.map((scenario) => ({
    name: scenario.name,
    slug: scenario.slug,
    description: scenario.description,
    communicationOutcomes: scenario.communicationOutcomes,
    lessonTitles: scenario.levels.flatMap((level) =>
      level.lessons.map((lesson) => lesson.title),
    ),
  }));
}

export async function getScenariosWithProgress(userId: string) {
  const [scenarios, completedIdsList] = await Promise.all([
    getCachedPublishedScenarioTree(),
    getCompletedLessonIds(userId),
  ]);

  const completedIds = new Set(completedIdsList);

  return scenarios.map((scenario) => {
    const allLessons = scenario.levels.flatMap((level) => level.lessons);
    const completedLessons = allLessons.filter((lesson) =>
      completedIds.has(lesson.id),
    ).length;

    return {
      ...scenario,
      totalLessons: allLessons.length,
      completedLessons,
      status: resolveScenarioStatus(allLessons.length, completedLessons),
    };
  });
}

export async function getScenarioDetailWithProgress(
  slug: string,
  userId: string,
) {
  const scenario = await getScenarioBySlug(slug);
  if (!scenario) return null;

  const allLessonIds = scenario.levels.flatMap((level) =>
    level.lessons.map((lesson) => lesson.id),
  );
  const [completions, reflectionReports] = await Promise.all([
    db.learnerLessonCompletion.findMany({
      // Scoped to this scenario's lessons (2026-08-19,
      // project/learning-journey-optimization.md Facet H) - only ever
      // checked against allLessonIds below, so fetching the learner's
      // entire completion history across every other scenario too was
      // pure waste, growing with lifetime activity instead of with this
      // page's actual scope. Matches the reflectionReports query right
      // below, which was already scoped correctly.
      where: { userId, lessonId: { in: allLessonIds } },
      select: { lessonId: true },
    }),
    db.lessonReflectionReport.findMany({
      where: { userId, lessonId: { in: allLessonIds } },
      select: { lessonId: true, totalScore: true },
    }),
  ]);
  const completedIds = new Set(completions.map((c) => c.lessonId));
  const totalScoreByLesson = new Map(
    reflectionReports.map((r) => [r.lessonId, r.totalScore]),
  );

  const levels = scenario.levels.map((level) => {
    const availability = resolveLessonAvailability(level.lessons, completedIds);
    return {
      ...level,
      lessons: level.lessons.map((lesson) => ({
        ...lesson,
        availability: availability.get(lesson.id)!,
        reflectionTotalScore: totalScoreByLesson.get(lesson.id) ?? null,
      })),
    };
  });

  const allLessons = scenario.levels.flatMap((level) => level.lessons);
  const completedLessons = allLessons.filter((lesson) =>
    completedIds.has(lesson.id),
  ).length;

  return {
    ...scenario,
    levels,
    totalLessons: allLessons.length,
    completedLessons,
    status: resolveScenarioStatus(allLessons.length, completedLessons),
  };
}

export async function getContinueLearningTarget(userId: string) {
  const [scenarios, completedIdsList] = await Promise.all([
    getCachedPublishedScenarioTree(),
    getCompletedLessonIds(userId),
  ]);

  const completedIds = new Set(completedIdsList);
  return resolveContinueLearning(scenarios, completedIds);
}
