import { describe, expect, it } from "vitest";
import { buildJourneyAttemptCapture } from "@/lib/journey-speaking-capture";
import { createSpeakingTurnEvidence } from "@/lib/speech/speaking-pronunciation-evidence";
import { JourneyAttemptSealSchema } from "@/lib/journey-speaking-attempt-contract";

describe("Journey browser capture without recognition rewriting", () => {
  it("retains raw words separately from contextual interpretation, never a pronunciation issue", () => {
    const result = buildJourneyAttemptCapture(
      "attempt",
      "lesson",
      [{ role: "user", content: "我想喝水。" }],
      {
        speakingEvidence: [
          createSpeakingTurnEvidence(1, "共享喝水", "我想喝水。", 0.3),
        ],
        closeReason: "USER_END",
      },
    );
    expect(result.turns[0]).toEqual({
      role: "user",
      content: "共享喝水",
      recognition: {
        rawTranscript: "共享喝水",
        interpretedTranscript: "我想喝水。",
        confidence: 0.3,
      },
    });
    expect(JSON.stringify(result)).not.toContain("pronunciation");
  });
  it("full realtime capture does not cut long audio down to 240-character legacy diagnostics", () => {
    const original = "我".repeat(600);
    const result = buildJourneyAttemptCapture(
      "attempt",
      "lesson",
      [{ role: "user", content: "AI hypothesis" }],
      {
        speakingEvidence: [],
        capturedTurns: [
          {
            role: "user",
            content: original,
            recognition: {
              rawTranscript: original,
              interpretedTranscript: original,
              confidence: null,
            },
          },
        ],
      },
    );
    expect(result.turns[0]!.content).toBe(original);
    expect(result.turns[0]!.recognition!.confidence).toBeNull();
  });
  it("does not map unrelated diagnostic text to another learner turn", () => {
    const result = buildJourneyAttemptCapture(
      "attempt",
      "lesson",
      [{ role: "user", content: "我是老师。" }],
      {
        speakingEvidence: [
          createSpeakingTurnEvidence(1, "error", "我是学生。", 0.1),
        ],
      },
    );
    expect(result.turns[0]).toEqual({ role: "user", content: "我是老师。" });
  });
  it.each([81, 90])(
    "marks overlong turn captures technical instead of pretending complete (%s)",
    (count) => {
      const result = buildJourneyAttemptCapture(
        "attempt",
        "lesson",
        Array.from({ length: count }, () => ({
          role: "user" as const,
          content: "你好",
        })),
        { speakingEvidence: [], closeReason: "NATURAL" },
      );
      expect(result.turns).toHaveLength(80);
      expect(result.closeReason).toBe("TECHNICAL_FAILURE");
      expect(result.quality?.pendingLearnerTurn).toBe(true);
    },
  );
  it("bounds total characters and individual utterances without silently truncating their words", () => {
    const result = buildJourneyAttemptCapture(
      "attempt",
      "lesson",
      Array.from({ length: 9 }, () => ({
        role: "user" as const,
        content: "我".repeat(3000),
      })),
      { speakingEvidence: [] },
    );
    expect(result.turns).toHaveLength(8);
    expect(result.closeReason).toBe("TECHNICAL_FAILURE");
    expect(
      buildJourneyAttemptCapture(
        "attempt",
        "lesson",
        [{ role: "user", content: "我".repeat(3001) }],
        { speakingEvidence: [] },
      ).turns,
    ).toHaveLength(0);
  });
  it("rejects forged quality scores, confidence outside the range and assistant recognition", () => {
    const input = {
      attemptId: "attempt",
      lessonId: "lesson",
      closeReason: "USER_END",
      turns: [
        {
          role: "user",
          content: "我",
          recognition: {
            rawTranscript: "我",
            interpretedTranscript: "我",
            confidence: 0.8,
          },
        },
      ],
    };
    expect(JourneyAttemptSealSchema.safeParse(input).success).toBe(true);
    for (const change of [
      {
        quality: {
          pendingLearnerTurn: false,
          interruptedAssistant: false,
          score: 100,
        },
      },
      { turns: [{ ...input.turns[0], role: "assistant" }] },
      { turns: [{ ...input.turns[0], content: "你" }] },
      {
        turns: [
          {
            ...input.turns[0],
            recognition: { ...input.turns[0]!.recognition, confidence: 2 },
          },
        ],
      },
    ])
      expect(
        JourneyAttemptSealSchema.safeParse({ ...input, ...change }).success,
      ).toBe(false);
  });
});
