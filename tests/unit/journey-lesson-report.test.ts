import { describe, expect, it } from "vitest";
import {
  buildJourneyLessonReport,
  JourneyAssessmentSnapshotSchema,
  JOURNEY_LESSON_REPORT_VERSION,
  selectJourneyQuestionEvidence,
  summarizeJourneyQuiz,
  type JourneyAssessmentSnapshot,
  JourneyReportProvenanceSchema,
  hasJourneyReportProvenance,
} from "@/lib/journey-lesson-report";
import { JOURNEY_RUBRIC_VERSION } from "@/lib/journey-speaking-attempt-contract";
import type { JourneyEvaluationReport } from "@/lib/journey-speaking-evaluation";

function assessment(): JourneyAssessmentSnapshot {
  return {
    version: JOURNEY_LESSON_REPORT_VERSION,
    progressId: "progress",
    progressStartedAt: "2026-10-11T10:00:00.000Z",
    capturedAt: "2026-10-11T10:30:00.000Z",
    vocabulary: [{ key: "word:quicktest", attemptId: "v1", result: true }],
    grammar: [{ key: "g1", attemptId: "g1a", result: false }],
    comprehension: [{ key: "c1", attemptId: "c1a", result: true }],
  };
}
function speaking(locale: "es" | "en" = "es"): JourneyEvaluationReport {
  const dimension = {
    observation: "OBSERVED" as const,
    level: 3,
    reason: "A contextual answer.",
    citations: [{ turnId: "u1", quote: "我叫Ana" }],
  };
  return {
    rubricVersion: JOURNEY_RUBRIC_VERSION,
    bankVersion: "test-bank",
    locale,
    dimensions: {
      communication: dimension,
      language: dimension,
      interaction: dimension,
      autonomy: dimension,
    },
    evidence: [],
    limitations: [],
    status: "COMPLETE",
    score: 75,
    pronunciation: {
      status: "NOT_EVALUATED",
      reason: "NO_VERIFIED_ACOUSTIC_MEASUREMENT",
    },
    feedback: {
      summary: "You introduced yourself.",
      achievement: null,
      priority: null,
      nextStep: "Ask a question next.",
    },
  };
}
describe("Journey lesson aggregation without missing-to-zero or rewards mutation", () => {
  it("recognizes versioned provenance without mistaking it for the legacy acoustic rubric", () => {
    const metadata = {
      version: JOURNEY_LESSON_REPORT_VERSION,
      attemptId: "a",
      progressId: "p",
      progressStartedAt: "2026-10-11T10:00:00.000Z",
    };
    expect(JourneyReportProvenanceSchema.safeParse(metadata).success).toBe(
      true,
    );
    expect(hasJourneyReportProvenance(metadata)).toBe(true);
    expect(
      hasJourneyReportProvenance({ ...metadata, version: "corrupted" }),
    ).toBe(true);
    expect(
      JourneyReportProvenanceSchema.safeParse({
        ...metadata,
        version: "corrupted",
      }).success,
    ).toBe(false);
    expect(
      JourneyReportProvenanceSchema.safeParse({ ...metadata, score: 100 })
        .success,
    ).toBe(false);
    expect(hasJourneyReportProvenance({ pronunciation: 50 })).toBe(false);
    expect(hasJourneyReportProvenance(null)).toBe(false);
  });
  it("keeps only the first answer of expected IDs, not arbitrary correct retries", () => {
    const entries = selectJourneyQuestionEvidence(
      ["a", "b", "c", "a"],
      [
        { id: "a1", key: "a", isCorrect: false },
        { id: "a2", key: "a", isCorrect: true },
        { id: "extra", key: "invented", isCorrect: true },
        { id: "b1", key: "b", isCorrect: null },
        { id: "b2", key: "b", isCorrect: true },
      ],
    );
    expect(entries).toEqual([
      { key: "a", attemptId: "a1", result: false },
      { key: "b", attemptId: "b1", result: null },
      { key: "c", attemptId: null, result: null },
    ]);
    expect(summarizeJourneyQuiz(entries)).toEqual({
      state: "PARTIAL",
      total: 3,
      correct: 0,
      incorrect: 1,
      pending: 1,
      missing: 1,
      score: null,
    });
  });
  it("a real wrong answer gives zero; a missing answer does not", () => {
    expect(
      summarizeJourneyQuiz([{ key: "a", attemptId: "a1", result: false }]),
    ).toMatchObject({ state: "COMPLETE", score: 0, incorrect: 1 });
    expect(
      summarizeJourneyQuiz([{ key: "a", attemptId: null, result: null }]),
    ).toMatchObject({ state: "MISSING", score: null, incorrect: 0 });
  });
  it("an ungraded submitted answer remains pending", () => {
    expect(
      summarizeJourneyQuiz([{ key: "short", attemptId: "a1", result: null }]),
    ).toMatchObject({
      state: "PARTIAL",
      score: null,
      pending: 1,
      incorrect: 0,
    });
  });
  it("no authored questions means no opportunity, not 100 or zero", () => {
    expect(summarizeJourneyQuiz([])).toMatchObject({
      state: "NO_OPPORTUNITY",
      score: null,
      total: 0,
    });
  });
  it("rejects duplicate question IDs and results with no real attempt", () => {
    expect(() =>
      summarizeJourneyQuiz([{ key: "a", attemptId: null, result: true }]),
    ).toThrow();
    expect(() =>
      summarizeJourneyQuiz([
        { key: "a", attemptId: "a1", result: true },
        { key: "a", attemptId: "a2", result: false },
      ]),
    ).toThrow();
  });
  it("keeps the 20/20/30/30 total and existing star bands without claiming settled rewards", () => {
    const result = buildJourneyLessonReport(
      "attempt",
      "es",
      assessment(),
      "COMPLETE",
      speaking(),
    );
    expect(result.overall).toEqual({ state: "COMPLETE", score: 73, stars: 2 });
    expect(result.rewards).toEqual({
      eligible: true,
      settlement: "NOT_SETTLED",
    });
  });
  it.each([
    "MISSING",
    "PENDING",
    "PROCESSING",
    "PARTIAL",
    "INSUFFICIENT",
    "FAILED",
  ] as const)(
    "%s speaking does not become zero or inflate the other weights",
    (state) => {
      const result = buildJourneyLessonReport(
        "attempt",
        "es",
        assessment(),
        state,
        null,
      );
      expect(result.overall.score).toBeNull();
      expect(result.overall.stars).toBeNull();
      expect(result.speaking.score).toBeNull();
      expect(result.rewards.eligible).toBe(false);
    },
  );
  it.each(["vocabulary", "grammar", "comprehension"] as const)(
    "missing %s prevents a complete grade despite complete Speaking",
    (key) => {
      const snapshot = assessment();
      snapshot[key] = [{ key: "missing", attemptId: null, result: null }];
      expect(
        buildJourneyLessonReport(
          "attempt",
          "es",
          snapshot,
          "COMPLETE",
          speaking(),
        ).overall,
      ).toEqual({ state: "PARTIAL", score: null, stars: null });
    },
  );
  it("does not synthesize a complete score when Speaking COMPLETE has no report", () => {
    expect(
      buildJourneyLessonReport("attempt", "es", assessment(), "COMPLETE", null)
        .overall.score,
    ).toBeNull();
  });
  it("does not accept a mismatched language or partial report as complete", () => {
    expect(() =>
      buildJourneyLessonReport(
        "attempt",
        "en",
        assessment(),
        "COMPLETE",
        speaking("es"),
      ),
    ).toThrow();
    expect(() =>
      buildJourneyLessonReport("attempt", "es", assessment(), "COMPLETE", {
        ...speaking(),
        status: "PARTIAL",
        score: null,
      }),
    ).toThrow();
  });
  it("requires a versioned server run and bounded evidence, not a browser score", () => {
    expect(
      JourneyAssessmentSnapshotSchema.safeParse({ ...assessment(), score: 100 })
        .success,
    ).toBe(false);
    expect(
      JourneyAssessmentSnapshotSchema.safeParse({
        ...assessment(),
        version: "legacy",
      }).success,
    ).toBe(false);
  });
});
