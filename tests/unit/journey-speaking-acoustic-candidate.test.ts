import { describe, expect, it } from "vitest";
import {
  inspectJourneyAcousticCandidate,
  type JourneyAcousticCandidate,
  type JourneyAcousticReviewContext,
} from "@/lib/journey-speaking-acoustic-candidate";

// Fictitious metadata, no audio generated, recorded or sent. These tests check
// provenance/bounds, NOT pronunciation detection or linguistic correctness.
function context(): JourneyAcousticReviewContext {
  return {
    attemptId: "pilot-attempt",
    locale: "es",
    source: "PRIVATE_RECORDING",
    additionalReviewAuthorized: true,
    evidenceVerified: true,
    turns: [
      {
        id: "a1",
        role: "assistant",
        audio: {
          refId: "partner",
          durationMs: 2000,
          complete: true,
          quality: "USABLE",
          containsSpeech: true,
        },
      },
      {
        id: "u1",
        role: "user",
        audio: {
          refId: "learner",
          durationMs: 3000,
          complete: true,
          quality: "USABLE",
          containsSpeech: true,
        },
      },
    ],
  };
}
function candidate(): JourneyAcousticCandidate {
  return {
    attemptId: "pilot-attempt",
    locale: "es",
    findings: [
      {
        turnId: "u1",
        audioRefId: "learner",
        category: "tone",
        segment: { startMs: 400, endMs: 950 },
        heard: "Hipótesis pendiente de escuchar.",
        target: "叫",
        explanation: "Revisar este segmento con el docente.",
        practice: "Pendiente de confirmación.",
      },
    ],
  };
}

describe("Journey acoustic prototype: never awards a grade", () => {
  it("allows only a bounded candidate for human review", () => {
    const result = inspectJourneyAcousticCandidate(candidate(), context());
    expect(result.status).toBe("REVIEWABLE");
    expect(result.findings).toHaveLength(1);
    expect(result.eligibleForScoring).toBe(false);
    expect(result.score).toBeNull();
    expect(result.coverage).toEqual({
      learnerTurns: 1,
      usableLearnerAudioTurns: 1,
    });
  });
  it("does not interpret an empty review as a perfect score", () => {
    const raw = { ...candidate(), findings: [] };
    const result = inspectJourneyAcousticCandidate(raw, context());
    expect(result.status).toBe("REVIEWABLE");
    expect(result.score).toBeNull();
    expect(result.eligibleForScoring).toBe(false);
  });
  it.each([
    ["TRANSCRIPT_ONLY", { source: "TRANSCRIPT_ONLY" }],
    ["UNVERIFIED_AUDIO", { evidenceVerified: false }],
    ["REVIEW_NOT_AUTHORIZED", { additionalReviewAuthorized: false }],
  ] as const)("blocks %s", (reason, change) => {
    const result = inspectJourneyAcousticCandidate(candidate(), {
      ...context(),
      ...change,
    });
    expect(result.status).toBe("NOT_EVALUABLE");
    expect(result.reason).toBe(reason);
    expect(result.findings).toEqual([]);
  });
  it.each(["UNKNOWN", "UNUSABLE"] as const)(
    "cannot use %s audio",
    (quality) => {
      const ctx = context();
      ctx.turns[1]!.audio!.quality = quality;
      expect(inspectJourneyAcousticCandidate(candidate(), ctx).reason).toBe(
        "NO_USABLE_LEARNER_AUDIO",
      );
    },
  );
  it.each([false, null] as const)(
    "cannot infer speech from %s",
    (containsSpeech) => {
      const ctx = context();
      ctx.turns[1]!.audio!.containsSpeech = containsSpeech;
      expect(inspectJourneyAcousticCandidate(candidate(), ctx).reason).toBe(
        "NO_USABLE_LEARNER_AUDIO",
      );
    },
  );
  it("cannot grade an incomplete recording", () => {
    const ctx = context();
    ctx.turns[1]!.audio!.complete = false;
    expect(inspectJourneyAcousticCandidate(candidate(), ctx).reason).toBe(
      "NO_USABLE_LEARNER_AUDIO",
    );
  });
  it.each([0, -1, NaN, Infinity, 1.5])(
    "rejects invalid duration %s",
    (durationMs) => {
      const ctx = context();
      ctx.turns[1]!.audio!.durationMs = durationMs;
      expect(inspectJourneyAcousticCandidate(candidate(), ctx).reason).toBe(
        "NO_USABLE_LEARNER_AUDIO",
      );
    },
  );
  it.each(["a1", "unknown"])(
    "never attributes turn %s to the learner",
    (turnId) => {
      const raw = candidate();
      raw.findings[0]!.turnId = turnId;
      expect(
        inspectJourneyAcousticCandidate(raw, context()).excluded[0]!.reason,
      ).toBe("UNSUPPORTED_TURN");
    },
  );
  it("rejects a foreign audio reference", () => {
    const raw = candidate();
    raw.findings[0]!.audioRefId = "other-recording";
    expect(
      inspectJourneyAcousticCandidate(raw, context()).excluded[0]!.reason,
    ).toBe("WRONG_AUDIO_REFERENCE");
  });
  it.each([
    { startMs: 900, endMs: 800 },
    { startMs: 900, endMs: 900 },
    { startMs: 900, endMs: 3001 },
  ])("bounds segment %j", (segment) => {
    const raw = candidate();
    raw.findings[0]!.segment = segment;
    expect(
      inspectJourneyAcousticCandidate(raw, context()).excluded[0]!.reason,
    ).toBe("INVALID_SEGMENT");
  });
  it("deduplicates findings without treating repetition as more errors", () => {
    const raw = candidate();
    raw.findings.push(structuredClone(raw.findings[0]!));
    const result = inspectJourneyAcousticCandidate(raw, context());
    expect(result.findings).toHaveLength(1);
    expect(result.excluded[0]!.reason).toBe("DUPLICATE_FINDING");
  });
  it("cannot mix attempts or locales", () => {
    for (const change of [{ attemptId: "foreign" }, { locale: "en" }])
      expect(
        inspectJourneyAcousticCandidate(
          { ...candidate(), ...change },
          context(),
        ).reason,
      ).toBe("WRONG_ATTEMPT_OR_LOCALE");
  });
  it("rejects unexpected scores or uncalibrated confidence fields", () => {
    expect(
      inspectJourneyAcousticCandidate({ ...candidate(), score: 100 }, context())
        .reason,
    ).toBe("INVALID_SCHEMA");
    const raw = candidate();
    expect(
      inspectJourneyAcousticCandidate(
        { ...raw, findings: [{ ...raw.findings[0], confidence: 0.99 }] },
        context(),
      ).reason,
    ).toBe("INVALID_SCHEMA");
  });
  it("bounds the candidate and rejects invalid segment numbers", () => {
    const raw = candidate();
    expect(
      inspectJourneyAcousticCandidate(
        { ...raw, findings: Array(41).fill(raw.findings[0]) },
        context(),
      ).reason,
    ).toBe("INVALID_SCHEMA");
    raw.findings[0]!.segment.startMs = -1;
    expect(inspectJourneyAcousticCandidate(raw, context()).reason).toBe(
      "INVALID_SCHEMA",
    );
  });
  it("rejects duplicate context IDs", () => {
    const ctx = context();
    ctx.turns.push(structuredClone(ctx.turns[1]!));
    expect(inspectJourneyAcousticCandidate(candidate(), ctx).reason).toBe(
      "DUPLICATE_CONTEXT_ID",
    );
  });
  it("does not mutate trusted context or raw findings", () => {
    const ctx = context();
    const raw = candidate();
    const before = JSON.stringify({ ctx, raw });
    inspectJourneyAcousticCandidate(raw, ctx);
    expect(JSON.stringify({ ctx, raw })).toBe(before);
  });
});
