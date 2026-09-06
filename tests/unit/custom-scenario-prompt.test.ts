import { describe, expect, it } from "vitest";
import {
  buildCustomScenarioPrompt,
  parseCustomScenario,
} from "@/lib/custom-scenario-prompt";

describe("buildCustomScenarioPrompt", () => {
  it("includes the learner's request and level", () => {
    const prompt = buildCustomScenarioPrompt(
      "I want to practice explaining to my boss that I'll be late",
      "HSK 3",
      [],
    );
    expect(prompt).toContain(
      "explaining to my boss that I'll be late",
    );
    expect(prompt).toContain("HSK 3");
  });

  it("includes known facts only when present", () => {
    const withFacts = buildCustomScenarioPrompt("practice ordering coffee", "HSK 2", [
      "Works as a nurse",
    ]);
    expect(withFacts).toContain("Works as a nurse");

    const withoutFacts = buildCustomScenarioPrompt(
      "practice ordering coffee",
      "HSK 2",
      [],
    );
    expect(withoutFacts).not.toContain("already know about this learner");
  });

  it("asks for a JSON object shaped with all 6 scenario fields", () => {
    const prompt = buildCustomScenarioPrompt("practice a job interview", "HSK 4", []);
    expect(prompt).toContain('"title"');
    expect(prompt).toContain('"scenarioContext"');
    expect(prompt).toContain('"learnerRole"');
    expect(prompt).toContain('"aiRole"');
    expect(prompt).toContain('"objective"');
    expect(prompt).toContain('"openingLine"');
  });
});

describe("parseCustomScenario", () => {
  const validJson = JSON.stringify({
    title: "Ordering coffee",
    scenarioContext: "At a small coffee shop in Beijing.",
    learnerRole: "A customer ordering a drink",
    aiRole: "A barista",
    objective: "Order a coffee and pay for it",
    openingLine: "你好，你要点什么？",
  });

  it("parses a well-formed response", () => {
    const scenario = parseCustomScenario(validJson);
    expect(scenario).toEqual({
      title: "Ordering coffee",
      scenarioContext: "At a small coffee shop in Beijing.",
      learnerRole: "A customer ordering a drink",
      aiRole: "A barista",
      objective: "Order a coffee and pay for it",
      openingLine: "你好，你要点什么？",
    });
  });

  it("returns null, not throwing, for garbled output", () => {
    expect(parseCustomScenario("not json at all")).toBeNull();
    expect(parseCustomScenario("")).toBeNull();
    expect(parseCustomScenario("{ not valid json")).toBeNull();
  });

  it("returns null when a required field is missing", () => {
    const missing = JSON.stringify({
      title: "Ordering coffee",
      scenarioContext: "At a coffee shop.",
      learnerRole: "A customer",
      aiRole: "A barista",
      objective: "Order a coffee",
      // openingLine missing
    });
    expect(parseCustomScenario(missing)).toBeNull();
  });

  it("returns null when a required field is an empty string", () => {
    const empty = JSON.stringify({
      title: "Ordering coffee",
      scenarioContext: "At a coffee shop.",
      learnerRole: "A customer",
      aiRole: "A barista",
      objective: "Order a coffee",
      openingLine: "   ",
    });
    expect(parseCustomScenario(empty)).toBeNull();
  });
});
