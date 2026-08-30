import "server-only";
import { db } from "@/lib/db";
import { resolveJourneyChapter, type JourneyChapter } from "@/lib/content/learning-journey";
import {
  CHAPTER_BUDGET,
  computeScenarioPointsBudget,
  computeWeightedReflectionAverage,
  computeScenarioEarnedPoints,
} from "@/lib/points-system";
import { recomputeGeneralLevelPoints } from "@/lib/general-level";
import { createTtlCache } from "@/lib/ttl-cache";
import {
  checkScenarioCompletionAchievements,
  checkChapterCompletionAchievements,
  checkGraduateAchievement,
} from "@/lib/achievements";
import { grantCoins } from "@/lib/coins";

export class ScenarioCompletionNotFoundError extends Error {}

/** No live publish/unpublish action exists in this app - content only changes via seed scripts/migrations, so a multi-minute staleness window costs nothing in practice. */
const CHAPTER_HSK_SUMS_TTL_MS = 5 * 60 * 1000;

/**
 * Total HSK-reference weight per Learning Journey chapter, across every
 * published lesson - the denominator in computeScenarioPointsBudget().
 * Was "cheap enough to recompute on demand" (max ~224 rows today), but it
 * ran on *every single scenario-completion check, for every user* - a
 * genuine caching candidate now that "revisit later" has arrived
 * (project/db-operations-optimization.md, Tier 3). See ttl-cache.ts for
 * why this isn't Next's own `unstable_cache`.
 */
const getChapterHskSums = createTtlCache(async (): Promise<
  Record<JourneyChapter, number>
> => {
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
}, CHAPTER_HSK_SUMS_TTL_MS);

export interface ScenarioCompletionResult {
  earnedPoints: number;
  weightedReflectionAverage: number;
  scenarioPointsBudget: number;
  chapter: JourneyChapter;
}

/**
 * Lazily computes and caches what a scenario contributes to the learner's
 * General Level - same "generate once, cache, regenerate on mismatch"
 * pattern as getOrGenerateLessonReflectionReport() in reflection.ts.
 * Returns null if the scenario isn't fully completed yet (every published
 * lesson needs a LessonReflectionReport) - callers use that to decide
 * whether to show the completion section at all.
 */
export async function getOrGenerateScenarioCompletion(
  userId: string,
  scenarioId: string,
): Promise<ScenarioCompletionResult | null> {
  const scenario = await db.scenario.findUnique({
    where: { id: scenarioId },
    include: {
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
  if (!scenario) throw new ScenarioCompletionNotFoundError("Scenario not found.");

  const lessons = scenario.levels.flatMap((level) => level.lessons);
  if (lessons.length === 0) return null;

  const reports = await db.lessonReflectionReport.findMany({
    where: { userId, lessonId: { in: lessons.map((l) => l.id) } },
    select: { lessonId: true, totalScore: true },
  });
  const scoreByLesson = new Map(reports.map((r) => [r.lessonId, r.totalScore]));

  // Not every lesson has been through Reflection yet - the scenario isn't
  // "complete" for General Level purposes until all of them have.
  if (lessons.some((l) => !scoreByLesson.has(l.id))) return null;

  const weightedReflectionAverage = computeWeightedReflectionAverage(
    lessons.map((l) => ({
      hskReference: l.hskReference,
      totalScore: scoreByLesson.get(l.id) ?? null,
    })),
  );

  const chapter = resolveJourneyChapter(
    scenario.levels.map((level) => level.difficulty),
  );
  const scenarioHskSum = lessons.reduce(
    (sum, l) => sum + (l.hskReference ?? 3),
    0,
  );
  const chapterHskSums = await getChapterHskSums();
  const scenarioPointsBudget = computeScenarioPointsBudget(
    scenarioHskSum,
    chapterHskSums[chapter],
    CHAPTER_BUDGET[chapter],
  );
  const earnedPoints = computeScenarioEarnedPoints(
    scenarioPointsBudget,
    weightedReflectionAverage,
  );

  const existing = await db.scenarioCompletion.findUnique({
    where: { userId_scenarioId: { userId, scenarioId } },
  });
  if (
    !existing ||
    existing.earnedPoints !== earnedPoints ||
    existing.weightedReflectionAverage !== weightedReflectionAverage
  ) {
    await db.scenarioCompletion.upsert({
      where: { userId_scenarioId: { userId, scenarioId } },
      create: { userId, scenarioId, earnedPoints, weightedReflectionAverage },
      update: { earnedPoints, weightedReflectionAverage },
    });
    await recomputeGeneralLevelPoints(userId);
    await checkScenarioCompletionAchievements(userId);
    await checkChapterCompletionAchievements(userId, chapter);
    // Graduate (2026-08-30) can only newly unlock the moment the last of the
    // 3 chapter achievements above does, so it's checked right after them.
    await checkGraduateAchievement(userId);
    // HanCoins (2026-08-30): 5 coins, once per scenario ever - the
    // `scenario:{scenarioId}` sourceKey means this is safe to call again on
    // a later rescoring update (e.g. a lesson inside got redone), it just
    // no-ops after the first real grant.
    await grantCoins(userId, 5, "scenario_completed", `scenario:${scenarioId}`);
  }

  return { earnedPoints, weightedReflectionAverage, scenarioPointsBudget, chapter };
}

/**
 * Resets a scenario for a full retry (points_system.md Part 1's "redo
 * replaces, never stacks"). Clears completion/progress AND the underlying
 * graded-attempt tables - leaving old attempts in place would let the
 * "first attempt" scoring convention (computeExerciseScore,
 * computeVocabularyScore) keep grading against the *original* try even
 * after a deliberate redo, defeating the point of asking for one. Shared
 * by both redoScenario() (all of a scenario's lessons) and redoLesson()
 * (just one) - the underlying tables to clear are identical either way.
 */
async function resetLessonsData(userId: string, lessonIds: string[]): Promise<void> {
  if (lessonIds.length === 0) return;
  await db.$transaction([
    db.learnerLessonCompletion.deleteMany({
      where: { userId, lessonId: { in: lessonIds } },
    }),
    db.learnerLessonProgress.deleteMany({
      where: { userId, lessonId: { in: lessonIds } },
    }),
    db.lessonReflectionReport.deleteMany({
      where: { userId, lessonId: { in: lessonIds } },
    }),
    db.exerciseAttempt.deleteMany({
      where: { userId, exercise: { lessonId: { in: lessonIds } } },
    }),
    db.vocabularyQuizAttempt.deleteMany({
      where: { userId, lessonId: { in: lessonIds } },
    }),
    db.quizAttempt.deleteMany({
      where: { userId, quiz: { lessonId: { in: lessonIds } } },
    }),
  ]);
}

/**
 * Resets an entire scenario for a full retry. The ScenarioCompletion row is
 * deleted outright, not just marked stale - a scenario being redone should
 * not keep contributing its old points to the General Level until it's
 * actually completed again.
 */
export async function redoScenario(
  userId: string,
  scenarioId: string,
): Promise<void> {
  const scenario = await db.scenario.findUnique({
    where: { id: scenarioId },
    include: { levels: { select: { lessons: { select: { id: true } } } } },
  });
  if (!scenario) throw new ScenarioCompletionNotFoundError("Scenario not found.");

  const lessonIds = scenario.levels.flatMap((level) =>
    level.lessons.map((lesson) => lesson.id),
  );
  await resetLessonsData(userId, lessonIds);
  await db.scenarioCompletion.deleteMany({ where: { userId, scenarioId } });
  await recomputeGeneralLevelPoints(userId);
}

/**
 * Resets a single lesson for a retry, without touching its siblings. If the
 * parent scenario had already been fully completed (ScenarioCompletion
 * exists), that row is deleted too - the scenario is no longer truly
 * complete once one of its lessons loses its Reflection score, so it
 * should stop contributing to the General Level until finished again.
 */
export async function redoLesson(userId: string, lessonId: string): Promise<void> {
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: { scenarioLevel: { select: { scenarioId: true } } },
  });
  if (!lesson) throw new ScenarioCompletionNotFoundError("Lesson not found.");

  await resetLessonsData(userId, [lessonId]);
  await db.scenarioCompletion.deleteMany({
    where: { userId, scenarioId: lesson.scenarioLevel.scenarioId },
  });
  await recomputeGeneralLevelPoints(userId);
}
