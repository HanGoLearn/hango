import "server-only";
import { db } from "@/lib/db";
import {
  resolveJourneyChapter,
  type JourneyChapter,
} from "@/lib/content/learning-journey";
import {
  CHAPTER_BUDGET,
  computeScenarioPointsBudget,
  computeWeightedReflectionAverage,
  computeScenarioEarnedPoints,
} from "@/lib/points-system";
import { recomputeGeneralLevelPoints } from "@/lib/general-level";
import { getChapterHskSums } from "@/lib/curriculum-weights";
import {
  checkScenarioCompletionAchievements,
  checkChapterCompletionAchievements,
  checkGraduateAchievement,
} from "@/lib/achievements";
import { grantCoins } from "@/lib/coins";

export class ScenarioCompletionNotFoundError extends Error {}

export interface ScenarioCompletionResult {
  earnedPoints: number;
  weightedReflectionAverage: number;
  scenarioPointsBudget: number;
  chapter: JourneyChapter;
}

export interface ScenarioCompletionOptions {
  /**
   * Placement can complete dozens of scenarios in one operation. It defers
   * the shared General Level/achievement reward chain until every scenario
   * row exists, then runs that chain once through
   * finalizeScenarioCompletionBatch(). Ordinary lesson completion keeps the
   * existing immediate behavior.
   */
  deferRewards?: boolean;
}

export interface DeferredScenarioCompletion {
  scenarioId: string;
  chapter: JourneyChapter;
}

/**
 * Finalizes the shared reward chain after one or many ScenarioCompletion
 * rows have been written. Every operation is idempotent, and
 * rewardsGrantedAt is deliberately written last so a failed batch remains
 * retryable on the next placement-credit call.
 */
export async function finalizeScenarioCompletionBatch(
  userId: string,
  completions: readonly DeferredScenarioCompletion[],
): Promise<void> {
  if (completions.length === 0) return;

  const scenarioIds = [...new Set(completions.map((item) => item.scenarioId))];
  const chapters = [...new Set(completions.map((item) => item.chapter))];

  await recomputeGeneralLevelPoints(userId);
  await checkScenarioCompletionAchievements(userId);
  for (const chapter of chapters) {
    await checkChapterCompletionAchievements(userId, chapter);
  }
  await checkGraduateAchievement(userId);

  const COIN_BATCH_SIZE = 8;
  for (let offset = 0; offset < scenarioIds.length; offset += COIN_BATCH_SIZE) {
    await Promise.all(
      scenarioIds
        .slice(offset, offset + COIN_BATCH_SIZE)
        .map((scenarioId) =>
          grantCoins(userId, 5, "scenario_completed", `scenario:${scenarioId}`),
        ),
    );
  }

  await db.scenarioCompletion.updateMany({
    where: { userId, scenarioId: { in: scenarioIds } },
    data: { rewardsGrantedAt: new Date() },
  });
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
  options: ScenarioCompletionOptions = {},
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
  if (!scenario)
    throw new ScenarioCompletionNotFoundError("Scenario not found.");

  const lessons = scenario.levels.flatMap((level) => level.lessons);
  if (lessons.length === 0) return null;

  const reports = await db.lessonReflectionReport.findMany({
    where: { userId, lessonId: { in: lessons.map((l) => l.id) } },
    select: { lessonId: true, totalScore: true },
  });
  const scoreByLesson = new Map(reports.map((r) => [r.lessonId, r.totalScore]));

  // An existing partial/pending report is NOT a graded lesson. A legitimate
  // zero is complete; null, non-integer and out-of-range grades are not.
  if (
    lessons.some((lesson) => {
      const score = scoreByLesson.get(lesson.id);
      return (
        typeof score !== "number" ||
        !Number.isInteger(score) ||
        score < 0 ||
        score > 100
      );
    })
  )
    return null;

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
    existing.weightedReflectionAverage !== weightedReflectionAverage ||
    // Rewards weren't confirmed last time (a prior attempt threw partway
    // through) - retry the whole chain even though the values above
    // already match. Every step below is independently safe to repeat.
    !existing.rewardsGrantedAt
  ) {
    await db.scenarioCompletion.upsert({
      where: { userId_scenarioId: { userId, scenarioId } },
      create: { userId, scenarioId, earnedPoints, weightedReflectionAverage },
      update: { earnedPoints, weightedReflectionAverage },
    });
    if (!options.deferRewards) {
      await finalizeScenarioCompletionBatch(userId, [{ scenarioId, chapter }]);
    }
  }

  return {
    earnedPoints,
    weightedReflectionAverage,
    scenarioPointsBudget,
    chapter,
  };
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
async function resetLessonsData(
  userId: string,
  lessonIds: string[],
): Promise<void> {
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
    db.progressEvidence.deleteMany({
      where: {
        userId,
        source: "SPEAKING",
        relatedActivityId: {
          in: lessonIds.map((id) => `lesson-reflection-speaking:${id}`),
        },
      },
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
  if (!scenario)
    throw new ScenarioCompletionNotFoundError("Scenario not found.");

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
export async function redoLesson(
  userId: string,
  lessonId: string,
): Promise<void> {
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
