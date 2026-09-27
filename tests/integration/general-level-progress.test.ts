import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  computeLessonEarnedPoints,
  recomputeGeneralLevelPoints,
} from "@/lib/general-level";
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
import { getOrGenerateScenarioCompletion } from "@/lib/scenario-completion";

const testUserIds: string[] = [];

afterEach(async () => {
  if (testUserIds.length === 0) return;
  await db.user.deleteMany({ where: { id: { in: testUserIds } } });
  testUserIds.length = 0;
});

async function createTestUser(label: string) {
  const user = await db.user.create({
    data: { email: `${label}-${Date.now()}@hango.dev` },
  });
  testUserIds.push(user.id);
  await db.learnerProfile.create({ data: { userId: user.id } });
  return user;
}

async function getGettingStartedWeights() {
  const scenario = await db.scenario.findUniqueOrThrow({
    where: { slug: "getting-started" },
    select: { id: true },
  });
  const weights = (await getPublishedScenarioWeights()).find(
    (entry) => entry.scenarioId === scenario.id,
  );
  if (!weights || weights.lessons.length < 2) {
    throw new Error("Getting Started needs at least two published lessons.");
  }
  return weights;
}

async function createReflectionReport(
  userId: string,
  lessonId: string,
  totalScore: number,
) {
  return db.lessonReflectionReport.create({
    data: {
      userId,
      lessonId,
      vocabularyCovered: 0,
      vocabularyTotal: 0,
      vocabularyScore: totalScore,
      comprehensionScore: totalScore,
      grammarScore: totalScore,
      speakingScore: totalScore,
      totalScore,
      hanNarrative: "Integration test report.",
      strengths: [],
      improvements: [],
      rewardsGrantedAt: new Date(),
    },
  });
}

describe("General Level points while a scenario is in progress", () => {
  it("credits the first reflected lesson without marking the scenario complete", async () => {
    const user = await createTestUser("general-level-partial");
    const scenario = await getGettingStartedWeights();
    const lesson = scenario.lessons[0]!;
    const score = 83;

    await createReflectionReport(user.id, lesson.id, score);
    await recomputeGeneralLevelPoints(user.id);

    const chapterHskSums = await getChapterHskSums();
    const scenarioBudget = computeScenarioPointsBudget(
      scenario.hskSum,
      chapterHskSums[scenario.chapter],
      CHAPTER_BUDGET[scenario.chapter],
    );
    const weightedAverage = computeWeightedReflectionAverage(
      scenario.lessons.map((entry) => ({
        hskReference: entry.hskReference,
        totalScore: entry.id === lesson.id ? score : null,
      })),
    );
    const expectedPoints = computeScenarioEarnedPoints(
      scenarioBudget,
      weightedAverage,
    );

    const profile = await db.learnerProfile.findUniqueOrThrow({
      where: { userId: user.id },
      select: { generalLevelPoints: true },
    });
    expect(profile.generalLevelPoints).toBeGreaterThan(0);
    expect(profile.generalLevelPoints).toBeCloseTo(expectedPoints, 8);

    const completion = await db.scenarioCompletion.findUnique({
      where: {
        userId_scenarioId: {
          userId: user.id,
          scenarioId: scenario.scenarioId,
        },
      },
    });
    expect(completion).toBeNull();

    // The reward card rounds to a whole point. Its lesson-level estimate
    // and the scenario-level running total may differ only by the scenario
    // average's sub-point rounding, never by a duplicated/full-scenario sum.
    const displayedLessonPoints = await computeLessonEarnedPoints(
      lesson.id,
      score,
    );
    expect(
      Math.abs(profile.generalLevelPoints - displayedLessonPoints),
    ).toBeLessThanOrEqual(scenarioBudget / 200 + Number.EPSILON);
    expect(
      Math.abs(
        Math.round(profile.generalLevelPoints) -
          Math.round(displayedLessonPoints),
      ),
    ).toBeLessThanOrEqual(1);
  });

  it("replaces partial credit with the completion row instead of counting both", async () => {
    const user = await createTestUser("general-level-no-double-count");
    const scenario = await getGettingStartedWeights();
    const score = 84;

    for (const lesson of scenario.lessons) {
      await createReflectionReport(user.id, lesson.id, score);
    }
    await recomputeGeneralLevelPoints(user.id);

    const beforeCompletion = await db.learnerProfile.findUniqueOrThrow({
      where: { userId: user.id },
      select: { generalLevelPoints: true },
    });
    expect(beforeCompletion.generalLevelPoints).toBeGreaterThan(0);

    const completion = await getOrGenerateScenarioCompletion(
      user.id,
      scenario.scenarioId,
    );
    expect(completion).not.toBeNull();

    const afterCompletion = await db.learnerProfile.findUniqueOrThrow({
      where: { userId: user.id },
      select: { generalLevelPoints: true },
    });
    expect(beforeCompletion.generalLevelPoints).toBeCloseTo(
      completion!.earnedPoints,
      8,
    );
    expect(afterCompletion.generalLevelPoints).toBeCloseTo(
      completion!.earnedPoints,
      8,
    );
    expect(afterCompletion.generalLevelPoints).not.toBeCloseTo(
      completion!.earnedPoints * 2,
      8,
    );

    const rows = await db.scenarioCompletion.count({
      where: { userId: user.id, scenarioId: scenario.scenarioId },
    });
    expect(rows).toBe(1);
  });
});
