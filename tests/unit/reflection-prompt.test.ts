import { describe, expect, it } from "vitest";
import {
  buildSpeakingConversationFeedbackPrompt,
  hasEnoughSpeakingEvidence,
  parseSpeakingConversationFeedback,
  buildHanReflectionNarrativePrompt,
  parseHanReflectionNarrative,
} from "@/lib/reflection-prompt";

describe("buildSpeakingConversationFeedbackPrompt", () => {
  const scenario = {
    learnerRole: "Customer",
    aiRole: "Waiter",
    objective: "Order food",
  };
  const transcript = [
    { role: "user" as const, content: "你好" },
    { role: "assistant" as const, content: "欢迎光临" },
  ];

  it("labels each turn with the correct role", () => {
    const prompt = buildSpeakingConversationFeedbackPrompt(
      scenario,
      transcript,
    );
    expect(prompt).toContain("Customer: 你好");
    expect(prompt).toContain("Waiter: 欢迎光临");
  });

  it("rates pronunciation as a cautious estimate, not a sentinel", () => {
    const prompt = buildSpeakingConversationFeedbackPrompt(
      scenario,
      transcript,
    );
    expect(prompt).toContain("not a phonetic analysis");
    expect(prompt).toContain("pronunciation");
  });

  it("asks for the two Points & Leveling System gate ratios", () => {
    const prompt = buildSpeakingConversationFeedbackPrompt(
      scenario,
      transcript,
    );
    expect(prompt).toContain("vocabularyUsageRatio");
    expect(prompt).toContain("objectiveCompletionRatio");
  });

  it("handles an empty transcript without crashing", () => {
    const prompt = buildSpeakingConversationFeedbackPrompt(scenario, []);
    expect(prompt).toContain("(no messages)");
  });

  it("requests evidence-based Speaking errors and forbids invented tone feedback", () => {
    const prompt = buildSpeakingConversationFeedbackPrompt(scenario, transcript);
    expect(prompt).toContain("quote brief evidence from the learner's own words");
    expect(prompt).toContain("fail to answer the character's question");
    expect(prompt).toContain("Never add a tones mistake without audio evidence");
  });
});

describe("hasEnoughSpeakingEvidence", () => {
  it("rejects a greeting followed by an immediate exit", () => {
    expect(hasEnoughSpeakingEvidence([
      { role: "assistant", content: "欢迎光临！请问几位？" },
      { role: "user", content: "nihao" },
    ])).toBe(false);
  });

  it("accepts a multi-turn learner attempt with substantive responses", () => {
    expect(hasEnoughSpeakingEvidence([
      { role: "assistant", content: "请问几位？" },
      { role: "user", content: "你好" },
      { role: "assistant", content: "请问几位？" },
      { role: "user", content: "两位" },
      { role: "assistant", content: "想吃什么？" },
      { role: "user", content: "我要宫保鸡丁" },
    ])).toBe(true);
  });

  it("accepts one substantial transcript chunk produced by semantic VAD", () => {
    expect(hasEnoughSpeakingEvidence([
      { role: "assistant", content: "请问您想吃什么？" },
      { role: "user", content: "我要一个宫保鸡丁和一杯茶" },
    ])).toBe(true);
  });

  it("rejects one minimal answer that cannot demonstrate the mission", () => {
    expect(hasEnoughSpeakingEvidence([
      { role: "assistant", content: "请问几位？" },
      { role: "user", content: "两位" },
    ])).toBe(false);
  });
});

describe("parseSpeakingConversationFeedback (extends speaking-feedback.ts's rubric)", () => {
  it("parses a well-formed response including the two gate ratios", () => {
    const raw = JSON.stringify({
      pronunciation: 70,
      fluency: 60,
      accuracy: 80,
      complexity: 55,
      communicationEffectiveness: 75,
      vocabularyUsageRatio: 0.6,
      objectiveCompletionRatio: 0.9,
      notes: "Good effort.",
      recommendedNextStep: "Try shadowing.",
      mistakes: [{ category: "response", evidence: "你好", feedback: "Answer the waiter's question next." }],
    });
    const feedback = parseSpeakingConversationFeedback(raw);
    expect(feedback.fluency).toBe(60);
    expect(feedback.vocabularyUsageRatio).toBe(0.6);
    expect(feedback.objectiveCompletionRatio).toBe(0.9);
    expect(feedback.notes).toBe("Good effort.");
    expect(feedback.mistakes).toEqual([
      { category: "response", evidence: "你好", feedback: "Answer the waiter's question next." },
    ]);
  });

  it("defaults both ratios to 0 when the response omits them", () => {
    const raw = JSON.stringify({
      pronunciation: 70,
      fluency: 60,
      accuracy: 80,
      complexity: 55,
      communicationEffectiveness: 75,
      notes: "Good effort.",
      recommendedNextStep: "Try shadowing.",
      mistakes: [],
    });
    const feedback = parseSpeakingConversationFeedback(raw);
    expect(feedback.vocabularyUsageRatio).toBe(0);
    expect(feedback.objectiveCompletionRatio).toBe(0);
    // Base rubric fields still parse correctly even without the ratios.
    expect(feedback.fluency).toBe(60);
  });
});

describe("buildHanReflectionNarrativePrompt", () => {
  const scores = {
    vocabularyCovered: 5,
    vocabularyTotal: 6,
    vocabularyScore: 82,
    comprehensionScore: 75,
    grammarScore: 100,
    speakingScore: null,
  };

  it("includes the real scores in the prompt", () => {
    const prompt = buildHanReflectionNarrativePrompt("Ordering Food", scores);
    expect(prompt).toContain("5 of 6 words");
    expect(prompt).toContain("Vocabulary quiz accuracy: 82/100");
    expect(prompt).toContain("Comprehension score: 75/100");
    expect(prompt).toContain("Grammar practice score: 100/100");
  });

  it("marks missing data explicitly instead of a fabricated score", () => {
    const prompt = buildHanReflectionNarrativePrompt("Ordering Food", scores);
    expect(prompt).toContain("Speaking: not enough data yet.");
  });

  it("asks for JSON with narrative, strengths, and improvements", () => {
    const prompt = buildHanReflectionNarrativePrompt("Ordering Food", scores);
    expect(prompt).toContain(
      '{"narrative": string, "strengths": string[], "improvements": string[]}',
    );
  });

  it("requires Han's complete note and feedback lists to be in English", () => {
    const prompt = buildHanReflectionNarrativePrompt("Ordering Food", scores);
    expect(prompt).toContain("every output field in natural English only");
    expect(prompt).toContain("Keep those lists in English too");
  });
});

describe("parseHanReflectionNarrative", () => {
  it("parses a well-formed response", () => {
    const raw = JSON.stringify({
      narrative: "You did great today!",
      strengths: ["Used 要 correctly"],
      improvements: ["Practice fluency"],
    });
    expect(parseHanReflectionNarrative(raw)).toEqual({
      narrative: "You did great today!",
      strengths: ["Used 要 correctly"],
      improvements: ["Practice fluency"],
    });
  });

  it("degrades to a safe generic fallback without throwing on invalid input", () => {
    const result = parseHanReflectionNarrative("not json");
    expect(result.narrative).toBeTruthy();
    expect(result.strengths).toEqual([]);
    expect(result.improvements).toEqual([]);
  });
});
