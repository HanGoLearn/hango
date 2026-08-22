import { describe, expect, it } from "vitest";
import {
  buildWritingFeedbackPrompt,
  buildCustomWritingFeedbackPrompt,
  parseWritingFeedback,
  DEFAULT_WRITING_FEEDBACK,
} from "@/lib/writing-feedback";

describe("buildWritingFeedbackPrompt", () => {
  it("includes the task type, prompt, and submitted text", () => {
    const prompt = buildWritingFeedbackPrompt(
      "PARAGRAPH",
      "Order a dish",
      "我要宫保鸡丁。",
    );
    expect(prompt).toContain("a paragraph");
    expect(prompt).toContain("Order a dish");
    expect(prompt).toContain("我要宫保鸡丁。");
  });

  it("instructs the model to evaluate the learner's own attempt before correcting it", () => {
    const prompt = buildWritingFeedbackPrompt("PARAGRAPH", "x", "y");
    expect(prompt).toContain("evaluate the learner's own attempt as written");
  });

  it("omits reference-translation guidance when there's no referenceAnswer", () => {
    const prompt = buildWritingFeedbackPrompt("PARAGRAPH", "x", "y");
    expect(prompt).not.toContain("One valid Chinese translation");
  });

  it("includes the reference translation as grading context, never shown to the learner, for TRANSLATION_CHALLENGE tasks", () => {
    const prompt = buildWritingFeedbackPrompt(
      "TRANSLATION_CHALLENGE",
      'Translate: "Two people, thanks."',
      "两个人，谢谢",
      "两位，谢谢。",
    );
    expect(prompt).toContain("a translation into Chinese");
    expect(prompt).toContain("两位，谢谢。");
    expect(prompt).toContain("never saw this");
    expect(prompt).toContain("accept any other natural phrasing");
  });
});

describe("buildCustomWritingFeedbackPrompt", () => {
  it("includes every stated characteristic and grades against them, not a fixed prompt", () => {
    const prompt = buildCustomWritingFeedbackPrompt(
      {
        topic: "A trip to the mountains",
        level: "HSK 4",
        format: "a paragraph",
        tone: "formal",
        extra: "Mention the weather.",
      },
      "我去了山上。",
    );
    expect(prompt).toContain("A trip to the mountains");
    expect(prompt).toContain("HSK 4");
    expect(prompt).toContain("a paragraph");
    expect(prompt).toContain("formal");
    expect(prompt).toContain("Mention the weather.");
    expect(prompt).toContain("matches the requested topic, format, and tone");
  });

  it("omits unset optional characteristics instead of printing them as blank", () => {
    const prompt = buildCustomWritingFeedbackPrompt({ topic: "x" }, "y");
    expect(prompt).not.toContain("Requested level");
    expect(prompt).not.toContain("Requested format");
    expect(prompt).not.toContain("Requested tone");
    expect(prompt).not.toContain("Additional instructions");
  });
});

describe("parseWritingFeedback", () => {
  const validJson = JSON.stringify({
    grammar: 80,
    vocabulary: 70,
    naturalness: 60,
    communicationClarity: 90,
    correctedVersion: "我要一个宫保鸡丁。",
    importantChanges: ["added 一个 as a measure word"],
    overallNotes: "Good job.",
  });

  it("parses a well-formed JSON response", () => {
    const feedback = parseWritingFeedback(validJson);
    expect(feedback.grammar).toBe(80);
    expect(feedback.correctedVersion).toBe("我要一个宫保鸡丁。");
    expect(feedback.importantChanges).toHaveLength(1);
  });

  it("parses JSON embedded in surrounding prose", () => {
    const feedback = parseWritingFeedback(
      `Here you go:\n${validJson}\nHope that helps!`,
    );
    expect(feedback.grammar).toBe(80);
  });

  it("falls back to the default when there's no JSON at all", () => {
    expect(parseWritingFeedback("Sorry, I can't help with that.")).toEqual(
      DEFAULT_WRITING_FEEDBACK,
    );
  });

  it("falls back to the default when a score is out of range", () => {
    const bad = JSON.stringify({
      grammar: 150,
      vocabulary: 70,
      naturalness: 60,
      communicationClarity: 90,
      correctedVersion: "x",
      importantChanges: [],
      overallNotes: "y",
    });
    expect(parseWritingFeedback(bad)).toEqual(DEFAULT_WRITING_FEEDBACK);
  });

  it("falls back to the default when importantChanges isn't a string array", () => {
    const bad = JSON.stringify({
      grammar: 80,
      vocabulary: 70,
      naturalness: 60,
      communicationClarity: 90,
      correctedVersion: "x",
      importantChanges: "not an array",
      overallNotes: "y",
    });
    expect(parseWritingFeedback(bad)).toEqual(DEFAULT_WRITING_FEEDBACK);
  });

  it("falls back to the default on malformed JSON", () => {
    expect(parseWritingFeedback("{ this is not json")).toEqual(
      DEFAULT_WRITING_FEEDBACK,
    );
  });
});
