import { describe, expect, it } from "vitest";
import {
  buildPlacementSpeakingEvaluationPrompt,
  computePlacementSpeakingScore,
  nextPlacementSpeakingLevel,
  parsePlacementSpeakingEvaluation,
  placementSpeakingStartLevel,
  PLACEMENT_SPEAKING_SCENARIOS,
} from "@/lib/placement-speaking";

describe("placement speaking", () => {
  it("starts at the weakest recognition skill and never below HSK3", () => {
    expect(placementSpeakingStartLevel([5, 4, 6, 5])).toBe(4);
    expect(placementSpeakingStartLevel([3, 3, 3, 3])).toBe(3);
    expect(placementSpeakingStartLevel([4, 2, 4, 4])).toBeNull();
    expect(placementSpeakingStartLevel([4, null, 4, 4])).toBeNull();
    expect(placementSpeakingStartLevel([9, 8, 7, 9])).toBe(7);
  });

  it("climbs through the combined diagnostic tier", () => {
    expect(nextPlacementSpeakingLevel(3)).toBe(4);
    expect(nextPlacementSpeakingLevel(6)).toBe(7);
    expect(nextPlacementSpeakingLevel(7)).toBeNull();
  });

  it("uses the placement formula without the lesson vocabulary multiplier", () => {
    expect(
      computePlacementSpeakingScore({
        pronunciation: 80,
        fluency: 70,
        accuracy: 75,
        complexity: 85,
        communicationEffectiveness: 90,
        objectiveCompletionRatio: 0.5,
      }),
    ).toBe(40);
  });

  it("keeps all exact authored openings and observable criteria", () => {
    expect(PLACEMENT_SPEAKING_SCENARIOS[3].rolePlay.openingLine).toBe(
      "这个周末你想在家休息休息，还是想出去运动？",
    );
    expect(PLACEMENT_SPEAKING_SCENARIOS[7].rolePlay.openingLine).toBe(
      "你觉得真正的创新一定要颠覆原来的范式吗？",
    );
    expect(
      buildPlacementSpeakingEvaluationPrompt(
        PLACEMENT_SPEAKING_SCENARIOS[7],
        [],
      ),
    ).toContain("HSK 7-9");
    expect(
      PLACEMENT_SPEAKING_SCENARIOS[5].rolePlay.successCriteria,
    ).toHaveLength(3);
  });

  it("grades learner evidence and keeps ASR confidence only as a weak signal", () => {
    const prompt = buildPlacementSpeakingEvaluationPrompt(
      PLACEMENT_SPEAKING_SCENARIOS[6],
      [
        { role: "assistant", content: "这个想法有什么局限性？" },
        { role: "user", content: "虽然有局限性，但是它还是很有价值。" },
      ],
      [0.82],
    );
    expect(prompt).toContain("grade LEARNER turns only");
    expect(prompt).toContain("weak pronunciation signal");
    expect(prompt).toContain("Character prompting or language never counts");
  });

  it("parses the rubric and computes the final deterministic score", () => {
    const result = parsePlacementSpeakingEvaluation(
      JSON.stringify({
        pronunciation: 80,
        fluency: 80,
        accuracy: 80,
        complexity: 80,
        communicationEffectiveness: 80,
        objectiveCompletionRatio: 0.75,
        notes: "Clear but incomplete.",
        recommendedNextStep: "Develop the counterargument.",
        mistakes: [],
      }),
    );
    expect(result.objectiveCompletionRatio).toBe(0.75);
    expect(result.score).toBe(60);
  });
});
