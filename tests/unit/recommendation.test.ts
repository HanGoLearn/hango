import { describe, expect, it } from "vitest";
import { computeInitialRecommendation } from "@/lib/recommendation";

describe("computeInitialRecommendation", () => {
  it("always recommends the Restaurant scenario (the only one seeded before FASE 4)", () => {
    const result = computeInitialRecommendation({
      currentLevel: "HSK_4",
      learningGoals: [],
      skillPriorities: [],
    });
    expect(result.scenarioSlug).toBe("restaurant");
  });

  it("tailors the reason to a travel goal", () => {
    const result = computeInitialRecommendation({
      currentLevel: "HSK_4",
      learningGoals: ["TRAVEL"],
      skillPriorities: [],
    });
    expect(result.reason).toMatch(/travel/i);
  });

  it("tailors the reason to a speaking priority when no goal matches", () => {
    const result = computeInitialRecommendation({
      currentLevel: "HSK_4",
      learningGoals: ["WORK"],
      skillPriorities: ["SPEAKING"],
    });
    expect(result.reason).toMatch(/speaking/i);
  });

  it("gives a generic-but-real reason for an unsure/unknown level", () => {
    const result = computeInitialRecommendation({
      currentLevel: "UNSURE",
      learningGoals: [],
      skillPriorities: [],
    });
    expect(result.reason.length).toBeGreaterThan(0);
  });
});
