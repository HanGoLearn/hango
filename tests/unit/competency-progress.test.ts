import { describe, expect, it } from "vitest";
import {
  computeCompetencyProgress,
  normalizeDifficulty,
} from "@/lib/competency-progress";
import { isEvidenceRelevantToCompetency } from "@/lib/progress-evidence";

describe("computeCompetencyProgress", () => {
  it("is EXPOSURE with no evidence at all", () => {
    const progress = computeCompetencyProgress([]);
    expect(progress.stage).toBe("EXPOSURE");
    expect(progress.evidenceCount).toBe(0);
  });

  it("is PRACTICE after a single piece of evidence", () => {
    const progress = computeCompetencyProgress([
      { result: 1, difficulty: 3, source: "EXERCISE" },
    ]);
    expect(progress.stage).toBe("PRACTICE");
  });

  it("a single activity cannot reach MASTERY, even with a perfect score", () => {
    const progress = computeCompetencyProgress([
      { result: 1, difficulty: 5, source: "EXERCISE" },
    ]);
    expect(progress.stage).not.toBe("MASTERY");
  });

  it("requires multiple distinct sources to reach CONFIDENT", () => {
    const sameSourceOnly = computeCompetencyProgress(
      Array.from({ length: 6 }, () => ({
        result: 1,
        difficulty: 4,
        source: "EXERCISE",
      })),
    );
    expect(sameSourceOnly.stage).not.toBe("CONFIDENT");

    const mixedSources = computeCompetencyProgress([
      { result: 1, difficulty: 4, source: "EXERCISE" },
      { result: 1, difficulty: 4, source: "EXERCISE" },
      { result: 1, difficulty: 4, source: "QUIZ" },
      { result: 1, difficulty: 4, source: "QUIZ" },
      { result: 1, difficulty: 4, source: "SPEAKING" },
    ]);
    expect(mixedSources.stage).toBe("CONFIDENT");
  });

  it("reaches MASTERY with enough high-scoring evidence from 3+ sources", () => {
    const progress = computeCompetencyProgress([
      { result: 1, difficulty: 4, source: "EXERCISE" },
      { result: 1, difficulty: 4, source: "EXERCISE" },
      { result: 1, difficulty: 4, source: "QUIZ" },
      { result: 1, difficulty: 4, source: "QUIZ" },
      { result: 0.9, difficulty: 4, source: "SPEAKING" },
      { result: 0.9, difficulty: 4, source: "SPEAKING" },
      { result: 0.9, difficulty: 4, source: "WRITING" },
      { result: 0.9, difficulty: 4, source: "MISSION" },
    ]);
    expect(progress.stage).toBe("MASTERY");
  });

  it("repeated mistakes (a low weighted average) block progression past PRACTICE", () => {
    const progress = computeCompetencyProgress([
      { result: 0, difficulty: 3, source: "EXERCISE" },
      { result: 0, difficulty: 3, source: "QUIZ" },
      { result: 0.2, difficulty: 3, source: "SPEAKING" },
      { result: 0.1, difficulty: 3, source: "WRITING" },
    ]);
    expect(progress.stage).toBe("PRACTICE");
  });

  it("weights harder evidence more heavily than easy evidence", () => {
    const easyWin = computeCompetencyProgress([
      { result: 1, difficulty: 1, source: "EXERCISE" },
      { result: 0, difficulty: 5, source: "EXERCISE" },
    ]);
    // The difficulty-5 zero drags the weighted average down harder than a flat average would.
    expect(easyWin.weightedScore).toBeLessThan(0.5);
  });

  it("keeps the exact weighted result available for the Progress percentage", () => {
    const progress = computeCompetencyProgress([
      { result: 0.2, difficulty: 2, source: "EXERCISE" },
      { result: 0.8, difficulty: 3, source: "SPEAKING" },
    ]);
    expect(progress.weightedScore).toBeCloseTo(0.56);
  });

  it("is deterministic - same input always produces the same stage", () => {
    const evidence = [
      { result: 0.8, difficulty: 3, source: "EXERCISE" },
      { result: 0.9, difficulty: 4, source: "QUIZ" },
    ];
    const first = computeCompetencyProgress(evidence);
    const second = computeCompetencyProgress(evidence);
    expect(first).toEqual(second);
  });
});

describe("normalizeDifficulty", () => {
  it("maps each source's own difficulty vocabulary to 1-5", () => {
    expect(normalizeDifficulty("EXERCISE", "BEGINNER")).toBeLessThan(
      normalizeDifficulty("EXERCISE", "ADVANCED"),
    );
    expect(normalizeDifficulty("QUIZ", "EASY")).toBeLessThan(
      normalizeDifficulty("QUIZ", "HARD"),
    );
    expect(normalizeDifficulty("MISSION", "GUIDED")).toBeLessThan(
      normalizeDifficulty("MISSION", "EXPERT"),
    );
  });

  it("defaults to the midpoint for speaking/writing (no difficulty field) or an unknown label", () => {
    expect(normalizeDifficulty("SPEAKING", null)).toBe(3);
    expect(normalizeDifficulty("WRITING", undefined)).toBe(3);
    expect(normalizeDifficulty("EXERCISE", "NOT_A_REAL_LABEL")).toBe(3);
  });
});

describe("progress evidence attribution", () => {
  it("does not turn comprehension exercise results into Speaking progress", () => {
    expect(
      isEvidenceRelevantToCompetency("EXERCISE", {
        name: "SPEAKING",
        category: "LANGUAGE_SKILL",
      }),
    ).toBe(false);
    expect(
      isEvidenceRelevantToCompetency("EXERCISE", {
        name: "LISTENING",
        category: "LANGUAGE_SKILL",
      }),
    ).toBe(true);
  });

  it("attributes a role-play score to Speaking and communication", () => {
    expect(
      isEvidenceRelevantToCompetency("SPEAKING", {
        name: "SPEAKING",
        category: "LANGUAGE_SKILL",
      }),
    ).toBe(true);
    expect(
      isEvidenceRelevantToCompetency("SPEAKING", {
        name: "DAILY_COMMUNICATION",
        category: "COMMUNICATION_ABILITY",
      }),
    ).toBe(true);
  });
});
