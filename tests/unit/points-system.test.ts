import { describe, expect, it } from "vitest";
import {
  vocabularyQuestionsPerWord,
  computeReflectionTotal,
  computeSpeakingConversationScore,
  hskLevelForPoints,
  computeScenarioPointsBudget,
  computeLessonPointsWithinScenario,
  computeWeightedReflectionAverage,
  computeScenarioEarnedPoints,
  effectiveHskWeight,
  CHAPTER_BUDGET,
  dedupeLabEvidence,
  weekKey,
  computeLabFactorDominio,
  computeLabFactorVolumen,
  computeLabFactorTiempo,
  computeLabFactorConsistencia,
  computeLabSkillPoints,
  LAB_SKILL_BUDGET,
  CURRENT_MAX_GENERAL_LEVEL_POINTS,
} from "@/lib/points-system";

describe("vocabularyQuestionsPerWord", () => {
  it("gives Beginner 4 questions (3 base + 1 fill-blank)", () => {
    expect(vocabularyQuestionsPerWord("BEGINNER")).toBe(4);
  });

  it("gives Intermediate/Upper Intermediate 5 questions", () => {
    expect(vocabularyQuestionsPerWord("INTERMEDIATE")).toBe(5);
    expect(vocabularyQuestionsPerWord("UPPER_INTERMEDIATE")).toBe(5);
  });

  it("gives Advanced 6 questions", () => {
    expect(vocabularyQuestionsPerWord("ADVANCED")).toBe(6);
  });
});

describe("computeReflectionTotal", () => {
  it("weighs Vocabulary 20, Grammar 20, Comprehension 30, Speaking 30", () => {
    const total = computeReflectionTotal({
      vocabularyScore: 100,
      grammarScore: 100,
      comprehensionScore: 100,
      speakingScore: 100,
    });
    expect(total).toBe(100);
  });

  it("treats a missing sub-score as 0, not excluded from the average", () => {
    // Perfect on the other three, but no grammar exercises graded yet -
    // the 20 grammar points are simply unearned, not redistributed.
    const total = computeReflectionTotal({
      vocabularyScore: 100,
      grammarScore: null,
      comprehensionScore: 100,
      speakingScore: 100,
    });
    expect(total).toBe(80);
  });

  it("70 is reachable with a realistic mix, not just a perfect run", () => {
    const total = computeReflectionTotal({
      vocabularyScore: 80,
      grammarScore: 70,
      comprehensionScore: 75,
      speakingScore: 60,
    });
    expect(total).toBeGreaterThanOrEqual(70);
  });
});

describe("computeSpeakingConversationScore", () => {
  it("is multiplicative - a weak ratio caps a strong metric average", () => {
    const score = computeSpeakingConversationScore({
      pronunciation: 90,
      fluency: 85,
      accuracy: 80,
      complexity: 75,
      communicationEffectiveness: 88,
      vocabularyUsageRatio: 0.7,
      objectiveCompletionRatio: 0.9,
    });
    // base average 83.6 * 0.7 * 0.9 = 52.67
    expect(score).toBe(53);
  });

  it("cannot reach a high score without high ratios, no matter the metrics", () => {
    const score = computeSpeakingConversationScore({
      pronunciation: 100,
      fluency: 100,
      accuracy: 100,
      complexity: 100,
      communicationEffectiveness: 100,
      vocabularyUsageRatio: 0.2,
      objectiveCompletionRatio: 0.2,
    });
    expect(score).toBeLessThan(10);
  });

  it("reaches close to 100 only with strong metrics AND strong ratios", () => {
    const score = computeSpeakingConversationScore({
      pronunciation: 95,
      fluency: 95,
      accuracy: 95,
      complexity: 95,
      communicationEffectiveness: 95,
      vocabularyUsageRatio: 1,
      objectiveCompletionRatio: 1,
    });
    expect(score).toBe(95);
  });
});

describe("hskLevelForPoints", () => {
  it.each([
    [0, "Just Starting Out"],
    [99, "Just Starting Out"],
    [100, "Getting By"],
    [349, "Getting By"],
    [350, "Finding Your Footing"],
    [700, "Speaking with Ease"],
    [900, "Easily Understood"],
    [1150, "Handling Real Situations"],
    [1500, "Speaking Like a Professional"],
    [1650, "Nearing Mastery"],
    [1800, "Refined Fluency"],
    [2000, "Mastering the Language"],
  ])("labels %i points as %s", (points, expected) => {
    expect(hskLevelForPoints(points)).toBe(expected);
  });
});

describe("effectiveHskWeight", () => {
  it("falls back to 3 for a lesson with no hskReference set", () => {
    expect(effectiveHskWeight(null)).toBe(3);
  });

  it("uses the real value when set", () => {
    expect(effectiveHskWeight(7)).toBe(7);
  });
});

describe("computeScenarioPointsBudget", () => {
  it("is proportional to the scenario's share of the chapter's HSK weight", () => {
    // Scenario carries 20 of the chapter's 100 total HSK weight -> 20% of budget.
    const budget = computeScenarioPointsBudget(20, 100, CHAPTER_BUDGET.BEGINNER);
    expect(budget).toBe(70); // 20% of 350
  });

  it("returns 0 when the chapter has no weight at all (avoids division by zero)", () => {
    expect(computeScenarioPointsBudget(0, 0, CHAPTER_BUDGET.ADVANCED)).toBe(0);
  });
});

describe("computeLessonPointsWithinScenario", () => {
  it("splits a scenario's budget proportional to each lesson's HSK weight", () => {
    // 4 lessons all HSK 1, scenario budget 16.9 -> each lesson worth a quarter.
    const points = computeLessonPointsWithinScenario(1, 4, 16.9);
    expect(points).toBeCloseTo(4.225, 3);
  });
});

describe("computeWeightedReflectionAverage", () => {
  it("weighs each lesson's score by its own HSK difficulty", () => {
    const average = computeWeightedReflectionAverage([
      { hskReference: 1, totalScore: 71 },
      { hskReference: 1, totalScore: 75 },
      { hskReference: 1, totalScore: 72 },
      { hskReference: 1, totalScore: 90 },
    ]);
    // Equal weights here -> plain average.
    expect(average).toBe(77);
  });

  it("an unattempted lesson (null score) contributes 0, not excluded", () => {
    const average = computeWeightedReflectionAverage([
      { hskReference: 1, totalScore: 100 },
      { hskReference: 1, totalScore: null },
    ]);
    expect(average).toBe(50);
  });

  it("returns 0 for an empty lesson list rather than dividing by zero", () => {
    expect(computeWeightedReflectionAverage([])).toBe(0);
  });
});

describe("computeScenarioEarnedPoints", () => {
  it("scales the budget by the weighted average as a percentage", () => {
    // Matches the design doc's worked example (78.5% weighted average).
    const earned = computeScenarioEarnedPoints(46.4, 78.5);
    expect(earned).toBeCloseTo(36.424, 2);
  });

  it("a perfect scenario earns its full budget", () => {
    expect(computeScenarioEarnedPoints(50, 100)).toBe(50);
  });

  it("an unstarted scenario (0% average) earns nothing", () => {
    expect(computeScenarioEarnedPoints(50, 0)).toBe(0);
  });
});

describe("CURRENT_MAX_GENERAL_LEVEL_POINTS", () => {
  it("is 1850, not 2000, until Reading Lab exists", () => {
    expect(CURRENT_MAX_GENERAL_LEVEL_POINTS).toBe(1850);
  });
});

describe("dedupeLabEvidence", () => {
  it("keeps only the most recent point per distinct key", () => {
    const points = dedupeLabEvidence([
      { distinctKey: "task-1", score: 60, occurredAt: new Date("2026-01-01") },
      { distinctKey: "task-1", score: 90, occurredAt: new Date("2026-02-01") },
      { distinctKey: "task-2", score: 70, occurredAt: new Date("2026-01-15") },
    ]);
    expect(points).toHaveLength(2);
    const task1 = points.find((p) => p.distinctKey === "task-1");
    expect(task1?.score).toBe(90);
  });
});

describe("weekKey", () => {
  it("gives the same key for two dates in the same ISO week", () => {
    // A Monday and the following Sunday, same week.
    expect(weekKey(new Date("2026-08-17"))).toBe(weekKey(new Date("2026-08-23")));
  });

  it("gives different keys for dates in different weeks", () => {
    expect(weekKey(new Date("2026-08-17"))).not.toBe(weekKey(new Date("2026-08-24")));
  });
});

describe("computeLabFactorDominio", () => {
  it("is 0 below a 70% average", () => {
    expect(computeLabFactorDominio([65, 68, 60])).toBe(0);
  });

  it("is 1 at a perfect 100% average", () => {
    expect(computeLabFactorDominio([100, 100, 100])).toBe(1);
  });

  it("scales linearly between 70 and 100", () => {
    expect(computeLabFactorDominio([85])).toBeCloseTo(0.5, 5);
  });
});

describe("computeLabFactorVolumen", () => {
  it("is 0 with fewer than 20 distinct attempts", () => {
    expect(computeLabFactorVolumen(10)).toBe(0);
  });

  it("is 1 at 60+ distinct attempts", () => {
    expect(computeLabFactorVolumen(60)).toBe(1);
    expect(computeLabFactorVolumen(100)).toBe(1);
  });

  it("scales linearly between 20 and 60", () => {
    expect(computeLabFactorVolumen(40)).toBeCloseTo(0.5, 5);
  });
});

describe("computeLabFactorTiempo", () => {
  it("is 0 with fewer than 2 distinct weeks of practice", () => {
    expect(computeLabFactorTiempo(1)).toBe(0);
  });

  it("is 1 at 12+ distinct weeks (~3 months)", () => {
    expect(computeLabFactorTiempo(12)).toBe(1);
  });

  it("penalizes the same volume compressed into one week vs spread over months", () => {
    // Same evidence count, different time spread - factor_tiempo is what tells them apart.
    expect(computeLabFactorTiempo(1)).toBeLessThan(computeLabFactorTiempo(10));
  });
});

describe("computeLabFactorConsistencia", () => {
  it("is 1 for perfectly consistent scores", () => {
    expect(computeLabFactorConsistencia([80, 80, 80])).toBe(1);
  });

  it("is lower for volatile scores than for steady ones at the same average", () => {
    const steady = computeLabFactorConsistencia([80, 80, 80, 80]);
    const volatile = computeLabFactorConsistencia([98, 60, 98, 64]); // same-ish average, high spread
    expect(volatile).toBeLessThan(steady);
  });
});

describe("computeLabSkillPoints", () => {
  it("matches the design doc's worked example (~55% of budget after 3 months of solid practice)", () => {
    // 65 distinct submissions spread across 12 weeks, avg 88, stdev 8.
    const baseDate = new Date("2026-01-05T00:00:00Z");
    const evidence = Array.from({ length: 65 }, (_, i) => ({
      distinctKey: `task-${i}`,
      // Alternate scores around 88 with an ~8-point spread.
      score: i % 2 === 0 ? 92 : 84,
      occurredAt: new Date(baseDate.getTime() + i * 3 * 24 * 60 * 60 * 1000), // spread over ~12 weeks
    }));
    const points = computeLabSkillPoints(LAB_SKILL_BUDGET.WRITING, evidence);
    expect(points).toBeGreaterThan(0);
    expect(points).toBeLessThan(LAB_SKILL_BUDGET.WRITING);
  });

  it("is 0 with no evidence at all", () => {
    expect(computeLabSkillPoints(LAB_SKILL_BUDGET.SPEAKING, [])).toBe(0);
  });

  it("stays 0 even with a perfect score if volume/time thresholds aren't met (a couple of practices isn't enough)", () => {
    const evidence = [
      { distinctKey: "a", score: 100, occurredAt: new Date("2026-01-01") },
      { distinctKey: "b", score: 100, occurredAt: new Date("2026-01-02") },
    ];
    expect(computeLabSkillPoints(LAB_SKILL_BUDGET.WRITING, evidence)).toBe(0);
  });

  it("caps at the full skill budget only with strong scores, volume, time spread, and consistency all at once", () => {
    const baseDate = new Date("2026-01-05T00:00:00Z");
    const evidence = Array.from({ length: 80 }, (_, i) => ({
      distinctKey: `session-${i}`,
      score: 100,
      occurredAt: new Date(baseDate.getTime() + i * 7 * 24 * 60 * 60 * 1000), // one per week
    }));
    const points = computeLabSkillPoints(LAB_SKILL_BUDGET.SPEAKING, evidence);
    expect(points).toBeCloseTo(LAB_SKILL_BUDGET.SPEAKING, 5);
  });
});
