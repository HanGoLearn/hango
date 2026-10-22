import { describe, expect, it } from "vitest";
import {
  buildJourneySpeakingLevel,
  buildJourneyAudioLessonContext,
  journeySpeakingLevelInstructions,
} from "@/lib/journey-speaking-level";
import { hskNumberForPoints } from "@/lib/points-system";
import { canStartUndispatchedUnifiedEvaluation } from "@/lib/journey-evaluation-recovery";
import { unifiedContext } from "../fixtures/journey-unified";

describe("frozen lesson level with existing General Level progression", () => {
  it("keeps live character instructions separate from grading and handles an upper-intermediate fallback", () => {
    const level = buildJourneySpeakingLevel(null, "UPPER_INTERMEDIATE", 900);
    expect(level.lessonLevel).toBe(5);
    expect(
      journeySpeakingLevelInstructions(level, "conversation"),
    ).not.toContain("Evaluation:");
    expect(journeySpeakingLevelInstructions(level, "evaluation")).not.toContain(
      "acoustic anchors",
    );
  });
  it.each([
    0, 99, 100, 349, 350, 699, 700, 899, 900, 1150, 1500, 1650, 1800, 2000,
  ])(
    "reuses the actual progress thresholds at %i points, for every curricular level",
    (points) => {
      for (let lesson = 1; lesson <= 9; lesson++) {
        const level = buildJourneySpeakingLevel(lesson, "BEGINNER", points);
        expect(level.generalLevel).toBe(hskNumberForPoints(points));
        expect(level.entryLevel).toBeLessThanOrEqual(lesson);
        expect(level.entryLevel).toBeGreaterThanOrEqual(
          Math.max(1, lesson - 1),
        );
        expect(level.stretchLevel).toBeLessThanOrEqual(Math.min(9, lesson + 1));
        expect(level.stretchLevel).toBeGreaterThanOrEqual(lesson);
      }
    },
  );
  it("keeps greetings elementary for a highly experienced learner and increases support gradually within the same task", () => {
    expect(buildJourneySpeakingLevel(1, "BEGINNER", 1800)).toMatchObject({
      lessonLevel: 1,
      entryLevel: 1,
      stretchLevel: 2,
      generalLevel: 8,
    });
    expect(buildJourneySpeakingLevel(3, "INTERMEDIATE", 350).entryLevel).toBe(
      2,
    );
    expect(buildJourneySpeakingLevel(3, "INTERMEDIATE", 700).entryLevel).toBe(
      3,
    );
    const instructions = journeySpeakingLevelInstructions(
      buildJourneySpeakingLevel(1, "BEGINNER", 0),
    );
    expect(instructions).toContain("planning pauses are expected");
    expect(instructions).toContain("no bonus or penalty for earned points");
    expect(instructions).toContain("Spanish/English help pauses immersion");
    expect(
      journeySpeakingLevelInstructions(
        buildJourneySpeakingLevel(7, "ADVANCED", 1800),
      ),
    ).toContain("sustained intelligible");
  });
  it("keeps historical snapshots unchanged and sends only a bounded task, not exercise grades", () => {
    const snapshot = unifiedContext().snapshot;
    expect(
      buildJourneyAudioLessonContext(snapshot, "a".repeat(64)),
    ).toBeUndefined();
    snapshot.speakingLevel = buildJourneySpeakingLevel(1, "BEGINNER", 100);
    const context = buildJourneyAudioLessonContext(snapshot, "a".repeat(64));
    expect(context).toMatchObject({
      contextHash: "a".repeat(64),
      lesson: { coreVocabulary: ["叫"], coreGrammar: ["Subject + 叫 + Name"] },
    });
    expect(context).not.toHaveProperty("assessment");
  });
});
describe("explicit first unified dispatch after preflight failure", () => {
  it.each([
    "structured_provider_unavailable",
    "budget_blocked",
    "processing_expired",
  ])("allows a zero-dispatch %s only", (failureCode) => {
    const evaluation = {
      status: "FAILED",
      requestCount: 0,
      failureCode,
      report: null,
    };
    expect(canStartUndispatchedUnifiedEvaluation(evaluation)).toBe(true);
    expect(
      canStartUndispatchedUnifiedEvaluation({ ...evaluation, requestCount: 1 }),
    ).toBe(false);
    expect(
      canStartUndispatchedUnifiedEvaluation({
        ...evaluation,
        report: { response: "paid" },
      }),
    ).toBe(false);
    expect(
      canStartUndispatchedUnifiedEvaluation({
        ...evaluation,
        status: "PROCESSING",
      }),
    ).toBe(false);
  });
  it("fails closed for unknown and potentially paid failures", () => {
    for (const failureCode of [
      "evaluation_failed",
      "provider_timeout",
      "invalid_evidence",
      "provider_refused",
      "unified_review_rejected",
    ])
      expect(
        canStartUndispatchedUnifiedEvaluation({
          status: "FAILED",
          requestCount: 0,
          failureCode,
        }),
      ).toBe(false);
  });
});
