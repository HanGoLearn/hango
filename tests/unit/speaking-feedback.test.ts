import { describe, expect, it } from "vitest";
import {
  buildSpeakingFeedbackPrompt,
  parseSpeakingFeedback,
  DEFAULT_SPEAKING_FEEDBACK,
} from "@/lib/speaking-feedback";

describe("buildSpeakingFeedbackPrompt", () => {
  it("includes the activity, prompt, and transcript", () => {
    const prompt = buildSpeakingFeedbackPrompt("PRONUNCIATION", "要", "yao");
    expect(prompt).toContain("Pronunciation practice");
    expect(prompt).toContain("要");
    expect(prompt).toContain("yao");
  });

  it("instructs the model not to claim perfect phonetic certainty", () => {
    const prompt = buildSpeakingFeedbackPrompt("SHADOWING", "x", "y");
    expect(prompt.toLowerCase()).toContain("perfect phonetic certainty");
  });
});

describe("parseSpeakingFeedback", () => {
  const validJson = JSON.stringify({
    pronunciation: 80,
    fluency: 70,
    accuracy: 90,
    complexity: 60,
    communicationEffectiveness: 85,
    notes: "Good job.",
    recommendedNextStep: "Try a harder sentence.",
  });

  it("parses a well-formed JSON response", () => {
    const feedback = parseSpeakingFeedback(validJson);
    expect(feedback.pronunciation).toBe(80);
    expect(feedback.notes).toBe("Good job.");
  });

  it("parses JSON embedded in surrounding prose", () => {
    const feedback = parseSpeakingFeedback(
      `Here you go:\n${validJson}\nHope that helps!`,
    );
    expect(feedback.pronunciation).toBe(80);
  });

  it("parses valid structured mistakes and drops invalid categories", () => {
    const feedback = parseSpeakingFeedback(JSON.stringify({
      ...JSON.parse(validJson),
      mistakes: [
        { category: "grammar", evidence: "我要两位", feedback: "Use 两位 for the number of people." },
        { category: "invented", evidence: "x", feedback: "y" },
      ],
    }));
    expect(feedback.mistakes).toEqual([
      { category: "grammar", evidence: "我要两位", feedback: "Use 两位 for the number of people." },
    ]);
  });

  it("falls back to the default when there's no JSON at all", () => {
    expect(parseSpeakingFeedback("Sorry, I can't help with that.")).toEqual(
      DEFAULT_SPEAKING_FEEDBACK,
    );
  });

  it("falls back to the default when a score is out of range", () => {
    const bad = JSON.stringify({
      pronunciation: 150,
      fluency: 70,
      accuracy: 90,
      complexity: 60,
      communicationEffectiveness: 85,
      notes: "x",
      recommendedNextStep: "y",
    });
    expect(parseSpeakingFeedback(bad)).toEqual(DEFAULT_SPEAKING_FEEDBACK);
  });

  it("falls back to the default when a required field is missing", () => {
    const bad = JSON.stringify({ pronunciation: 80 });
    expect(parseSpeakingFeedback(bad)).toEqual(DEFAULT_SPEAKING_FEEDBACK);
  });

  it("falls back to the default on malformed JSON", () => {
    expect(parseSpeakingFeedback("{ this is not json")).toEqual(
      DEFAULT_SPEAKING_FEEDBACK,
    );
  });
});
