import "server-only";
import { db } from "@/lib/db";
import { computeLabPoints } from "@/lib/lab-points";
import { checkLevelAchievements } from "@/lib/achievements";
import {
  getChapterHskSums,
  getPublishedScenarioWeights,
} from "@/lib/curriculum-weights";
import {
  CHAPTER_BUDGET,
  computeScenarioEarnedPoints,
  computeScenarioPointsBudget,
  computeWeightedReflectionAverage,
} from "@/lib/points-system";

/**
 * The single place LearnerProfile.generalLevelPoints gets recomputed
 * (docs/02_academy/points_system.md) - always derived fresh from source,
 * never incremented, so any change anywhere (a scenario redo, a new
 * Writing/Speaking submission) is reflected correctly with no separate
 * reconciliation step. Call this after anything that could change either
 * source: a finished lesson (reflection.ts), scenario completion/redo
 * (scenario-completion.ts), a Writing Lab submission (writing-data.ts), or
 * a completed Speaking Lab session (speaking-data.ts).
 */
export async function recomputeGeneralLevelPoints(
  userId: string,
): Promise<void> {
  const [scenarioTotal, inProgressPoints, labPoints] = await Promise.all([
    db.scenarioCompletion.aggregate({
      where: { userId },
      _sum: { earnedPoints: true },
    }),
    computeInProgressScenarioPoints(userId),
    computeLabPoints(userId),
  ]);
  const generalLevelPoints =
    (scenarioTotal._sum.earnedPoints ?? 0) + inProgressPoints + labPoints.total;
  // updateMany, not update (2026-09-21): this now runs after every finished
  // lesson, not only from paths that had already created the profile, and
  // `update` throws when the row is absent. A learner with no profile row
  // has nothing to store; the next recompute writes the same derived total
  // once the row exists, since this never increments.
  await db.learnerProfile.updateMany({
    where: { userId },
    data: { generalLevelPoints },
  });
  await checkLevelAchievements(userId, generalLevelPoints);
}

/**
 * Credit for scenarios the learner is still inside (2026-09-21, user
 * request). Before this, points landed only once every lesson of a
 * scenario had been reflected on, so three finished lessons were worth
 * literally zero and the fourth paid out all ~15 at once - roughly twenty
 * lesson steps with no signal, then a jump.
 *
 * Deliberately NOT a partial row in ScenarioCompletion: five other readers
 * treat a row there as "this scenario is finished" (the first-scenario and
 * chapter achievements, two admin analytics counts, and the weighted
 * average on Progress), so partial rows would fire rewards early and skew
 * reporting. The scenario's own row, and every reward hanging off it,
 * still appears only when the scenario is genuinely complete.
 *
 * No new formula: the same three functions the finished scenario uses,
 * and computeWeightedReflectionAverage already scores an unattempted
 * lesson as 0 rather than excluding it. So a scenario at 2 of 4 lessons is
 * worth about half its budget, and when the last lesson lands the row
 * records the identical number this was already contributing - the total
 * converges instead of jumping.
 */
async function computeInProgressScenarioPoints(
  userId: string,
): Promise<number> {
  const [scenarios, completedRows, reports, chapterHskSums] = await Promise.all(
    [
      getPublishedScenarioWeights(),
      db.scenarioCompletion.findMany({
        where: { userId },
        select: { scenarioId: true },
      }),
      db.lessonReflectionReport.findMany({
        where: { userId },
        select: { lessonId: true, totalScore: true },
      }),
      getChapterHskSums(),
    ],
  );

  if (reports.length === 0) return 0;

  // The exclusion that makes double counting impossible: a scenario with a
  // row is already in the aggregate above, so it must never be counted here
  // as well.
  const completedScenarioIds = new Set(
    completedRows.map((row) => row.scenarioId),
  );
  const scoreByLesson = new Map(
    reports.map((report) => [report.lessonId, report.totalScore]),
  );

  let total = 0;
  for (const scenario of scenarios) {
    if (completedScenarioIds.has(scenario.scenarioId)) continue;
    if (!scenario.lessons.some((lesson) => scoreByLesson.has(lesson.id))) {
      continue;
    }

    const weightedReflectionAverage = computeWeightedReflectionAverage(
      scenario.lessons.map((lesson) => ({
        hskReference: lesson.hskReference,
        totalScore: scoreByLesson.get(lesson.id) ?? null,
      })),
    );
    const scenarioPointsBudget = computeScenarioPointsBudget(
      scenario.hskSum,
      chapterHskSums[scenario.chapter],
      CHAPTER_BUDGET[scenario.chapter],
    );
    total += computeScenarioEarnedPoints(
      scenarioPointsBudget,
      weightedReflectionAverage,
    );
  }
  return total;
}

/**
 * A finished lesson's weighted share, for the "+N experience" line on its
 * results screen. The running scenario contribution rounds its weighted
 * average before applying the budget, so the card rounds this share to a
 * whole point too; at stored decimal precision the two can differ by the
 * scenario average's sub-point rounding.
 */
export async function computeLessonEarnedPoints(
  lessonId: string,
  totalScore: number,
): Promise<number> {
  const [scenarios, chapterHskSums] = await Promise.all([
    getPublishedScenarioWeights(),
    getChapterHskSums(),
  ]);
  const scenario = scenarios.find((entry) =>
    entry.lessons.some((lesson) => lesson.id === lessonId),
  );
  const lesson = scenario?.lessons.find((entry) => entry.id === lessonId);
  if (!scenario || !lesson || scenario.hskSum === 0) return 0;

  const scenarioPointsBudget = computeScenarioPointsBudget(
    scenario.hskSum,
    chapterHskSums[scenario.chapter],
    CHAPTER_BUDGET[scenario.chapter],
  );
  const lessonBudget =
    ((lesson.hskReference ?? 3) / scenario.hskSum) * scenarioPointsBudget;
  return (lessonBudget * totalScore) / 100;
}
