import { describe, expect, it } from "vitest";
import {
  buildLearnerFactsExtractionPrompt,
  parseLearnerFacts,
} from "@/lib/learner-facts-prompt";

describe("buildLearnerFactsExtractionPrompt", () => {
  const transcript = [
    { role: "user" as const, content: "I work as a nurse in Lima." },
    { role: "assistant" as const, content: "那太好了！" },
  ];

  it("labels each turn with the correct speaker", () => {
    const prompt = buildLearnerFactsExtractionPrompt(transcript);
    expect(prompt).toContain("Learner: I work as a nurse in Lima.");
    expect(prompt).toContain("Han: 那太好了！");
  });

  it("asks for a JSON object shaped with a facts array", () => {
    const prompt = buildLearnerFactsExtractionPrompt(transcript);
    expect(prompt).toContain('"facts"');
    expect(prompt).toContain("JOB");
  });

  it("tells the model to skip lesson/vocabulary content", () => {
    const prompt = buildLearnerFactsExtractionPrompt(transcript);
    expect(prompt).toContain("Skip anything about Chinese vocabulary");
  });

  it("handles an empty transcript without crashing", () => {
    const prompt = buildLearnerFactsExtractionPrompt([]);
    expect(prompt).toContain("Conversation:");
  });
});

describe("parseLearnerFacts", () => {
  it("parses a well-formed response", () => {
    const facts = parseLearnerFacts(
      '{"facts": [{"category": "JOB", "fact": "Works as a nurse"}, {"category": "TRIP", "fact": "Traveling to Shanghai next month"}]}',
    );
    expect(facts).toEqual([
      { category: "JOB", fact: "Works as a nurse" },
      { category: "TRIP", fact: "Traveling to Shanghai next month" },
    ]);
  });

  it("returns an empty list, not throwing, for garbled output", () => {
    expect(parseLearnerFacts("not json at all")).toEqual([]);
    expect(parseLearnerFacts("")).toEqual([]);
    expect(parseLearnerFacts("{ this is not valid json")).toEqual([]);
  });

  it("returns an empty list when facts is missing or not an array", () => {
    expect(parseLearnerFacts('{"nope": true}')).toEqual([]);
    expect(parseLearnerFacts('{"facts": "not an array"}')).toEqual([]);
  });

  it("filters out an entry with an invalid category, keeping the valid ones", () => {
    const facts = parseLearnerFacts(
      '{"facts": [{"category": "NOT_REAL", "fact": "bogus"}, {"category": "HOBBY", "fact": "Enjoys hiking"}]}',
    );
    expect(facts).toEqual([{ category: "HOBBY", fact: "Enjoys hiking" }]);
  });

  it("filters out an entry with an empty fact string", () => {
    const facts = parseLearnerFacts(
      '{"facts": [{"category": "OTHER", "fact": "   "}, {"category": "GOAL", "fact": "Learning Chinese to work in Beijing"}]}',
    );
    expect(facts).toEqual([
      { category: "GOAL", fact: "Learning Chinese to work in Beijing" },
    ]);
  });

  it("returns an empty list for a genuinely empty facts array", () => {
    expect(parseLearnerFacts('{"facts": []}')).toEqual([]);
  });
});
