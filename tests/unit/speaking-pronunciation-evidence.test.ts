import { describe, expect, it } from "vitest";
import {
  buildSpeakingEvidenceReviewInstructions,
  createSpeakingTurnEvidence,
  parseSpeakingEvidenceReview,
  speakingEvidenceForPrompt,
} from "@/lib/speech/speaking-pronunciation-evidence";

describe("Speaking pronunciation evidence", () => {
  it("keeps the intended transcript separate from the raw STT result", () => {
    expect(createSpeakingTurnEvidence(1, "ni hao", "你好", 0.78)).toEqual({
      turnIndex: 1,
      rawTranscript: "ni hao",
      interpretedTranscript: "你好",
      transcriptionConfidence: 0.78,
      understanding: "context_resolved",
      issue: null,
    });
  });

  it("does not turn low transcription confidence into a pronunciation error", () => {
    const evidence = createSpeakingTurnEvidence(1, "我买苹果", "我买苹果", 0.3);
    expect(evidence.understanding).toBe("uncertain");
    expect(evidence.issue).toBeNull();
  });

  it("asks the same Realtime session for one silent audio-grounded review", () => {
    const prompt = buildSpeakingEvidenceReviewInstructions(
      {
        aiRole: "waiter",
        learnerRole: "customer",
        scenarioContext: "At a restaurant",
        objective: "Order food",
        lessonVocabulary: ["菜单", "米饭"],
      },
      [createSpeakingTurnEvidence(1, "菜单", "菜单", 0.8)],
    );
    expect(prompt).toContain("actual audio turns already present");
    expect(prompt).toContain("acoustic audio is the evidence");
    expect(prompt).toContain("Never infer an error from low STT confidence");
    expect(prompt).toContain("菜单");
  });

  it("accepts only confident issues tied to a real learner turn", () => {
    const seeds = [createSpeakingTurnEvidence(1, "我卖苹果", "我买苹果", 0.7)];
    const result = parseSpeakingEvidenceReview(
      JSON.stringify({
        turns: [
          {
            turnIndex: 1,
            intendedText: "我买苹果",
            understood: true,
            issue: {
              category: "tone",
              evidence: "买 sounded too close to 卖.",
              feedback: "Keep mǎi low before it rises.",
              confidence: 0.84,
            },
          },
          {
            turnIndex: 99,
            intendedText: "ignored",
            issue: {
              category: "pronunciation",
              evidence: "invented",
              feedback: "invented",
              confidence: 1,
            },
          },
        ],
      }),
      seeds,
    );
    expect(result[0]?.issue?.category).toBe("tone");
    expect(speakingEvidenceForPrompt(result)).toContain("Turn 1");
    expect(result).toHaveLength(1);
  });

  it("fails safely when the final review is missing or malformed", () => {
    const seeds = [createSpeakingTurnEvidence(1, "你好", "你好", 0.8)];
    expect(parseSpeakingEvidenceReview("not json", seeds)).toEqual(seeds);
    expect(speakingEvidenceForPrompt(seeds)).toContain("No high-confidence");
  });
});
