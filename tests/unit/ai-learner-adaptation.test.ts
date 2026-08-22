import { describe, expect, it } from "vitest";
import { buildAdaptiveLearnerSummary } from "@/lib/ai-learner-adaptation";

describe("buildAdaptiveLearnerSummary", () => {
  it("does not invent a level without graded evidence", () => {
    expect(buildAdaptiveLearnerSummary([], [])).toEqual({
      demonstratedBand: "Not yet established",
      recentAccuracy: null,
      strengths: [],
      focusAreas: [],
    });
  });

  it("weights competencies by their evidence and identifies strengths and gaps", () => {
    const summary = buildAdaptiveLearnerSummary(
      [
        { name: "Listening", weightedScore: 0.9, evidenceCount: 6 },
        { name: "Speaking", weightedScore: 0.55, evidenceCount: 4 },
      ],
      [0.5, 0.7, 0.9],
    );

    expect(summary.demonstratedBand).toContain("Independent");
    expect(summary.recentAccuracy).toBeCloseTo(0.7);
    expect(summary.strengths).toEqual(["Listening"]);
    expect(summary.focusAreas).toEqual(["Speaking"]);
  });
});
