import { describe, expect, it } from "vitest";
import {
  buildMissionEvaluationPrompt,
  parseMissionReport,
  defaultMissionReport,
} from "@/lib/mission-evaluation";

const mission = {
  title: "Order Your Meal",
  objective: "Order a dish and a drink.",
  learnerRole: "Customer",
  aiRole: "Waiter",
  successConditions: ["Order at least one dish", "Order at least one drink"],
};

describe("buildMissionEvaluationPrompt", () => {
  it("includes the mission details and the full transcript", () => {
    const prompt = buildMissionEvaluationPrompt(mission, [
      { role: "assistant", content: "欢迎光临，请问几位？" },
      { role: "user", content: "两位，谢谢。" },
    ]);
    expect(prompt).toContain("Order Your Meal");
    expect(prompt).toContain("Waiter: 欢迎光临，请问几位？");
    expect(prompt).toContain("Customer: 两位，谢谢。");
  });

  it("instructs that minor grammar errors must not cause automatic failure", () => {
    const prompt = buildMissionEvaluationPrompt(mission, []);
    expect(prompt).toContain(
      "Minor grammar errors must NOT automatically cause failure",
    );
  });
});

describe("parseMissionReport", () => {
  const validJson = JSON.stringify({
    communicationSuccess: 80,
    taskCompletion: 90,
    vocabularyUsage: 70,
    grammarUsage: 60,
    clarity: 85,
    successConditions: [
      { description: "Order at least one dish", met: true },
      { description: "Order at least one drink", met: false },
    ],
    overallNotes: "Good job overall.",
    recommendedNextStep: "Try a longer conversation next time.",
  });

  it("parses a well-formed JSON response", () => {
    const report = parseMissionReport(validJson, [
      "Order at least one dish",
      "Order at least one drink",
    ]);
    expect(report.taskCompletion).toBe(90);
    expect(report.successConditions).toHaveLength(2);
    expect(report.successConditions[0]!.met).toBe(true);
  });

  it("falls back to a default built from the real success conditions when nothing parses", () => {
    const report = parseMissionReport("not json at all", [
      "Order at least one dish",
    ]);
    expect(report).toEqual(defaultMissionReport(["Order at least one dish"]));
    expect(report.successConditions[0]!.met).toBe(false);
  });

  it("falls back to the default when a score is out of range", () => {
    const bad = JSON.stringify({
      communicationSuccess: 200,
      taskCompletion: 90,
      vocabularyUsage: 70,
      grammarUsage: 60,
      clarity: 85,
      successConditions: [],
      overallNotes: "x",
      recommendedNextStep: "y",
    });
    expect(parseMissionReport(bad, [])).toEqual(defaultMissionReport([]));
  });

  it("falls back to the default when successConditions isn't a valid array", () => {
    const bad = JSON.stringify({
      communicationSuccess: 80,
      taskCompletion: 90,
      vocabularyUsage: 70,
      grammarUsage: 60,
      clarity: 85,
      successConditions: "not an array",
      overallNotes: "x",
      recommendedNextStep: "y",
    });
    expect(parseMissionReport(bad, [])).toEqual(defaultMissionReport([]));
  });
});
