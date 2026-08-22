import { describe, expect, it } from "vitest";
import { buildMissionSystemPrompt } from "@/lib/mission-prompt";

describe("buildMissionSystemPrompt", () => {
  const mission = {
    title: "Order Your Meal",
    context: "You've just sat down at a restaurant.",
    objective: "Order a dish and a drink.",
    learnerRole: "Customer",
    aiRole: "Waiter",
    successConditions: ["Order at least one dish", "Order at least one drink"],
  };

  it("assigns the AI its role and the learner theirs", () => {
    const prompt = buildMissionSystemPrompt(mission);
    expect(prompt).toContain('play the role of "Waiter"');
    expect(prompt).toContain('learner plays "Customer"');
  });

  it("includes the objective, context, and success conditions", () => {
    const prompt = buildMissionSystemPrompt(mission);
    expect(prompt).toContain("Order a dish and a drink.");
    expect(prompt).toContain("You've just sat down at a restaurant.");
    expect(prompt).toContain("Order at least one dish");
    expect(prompt).toContain("Order at least one drink");
  });

  it("instructs the AI to stay in character and never correct mid-conversation", () => {
    const prompt = buildMissionSystemPrompt(mission);
    expect(prompt.toLowerCase()).toContain("stay strictly in character");
    expect(prompt.toLowerCase()).toContain("do not correct");
  });

  it("instructs the AI not to complete the task for the learner", () => {
    const prompt = buildMissionSystemPrompt(mission);
    expect(prompt.toLowerCase()).toContain("do not complete the task");
  });

  it("allows introducing one unexpected complication", () => {
    const prompt = buildMissionSystemPrompt(mission);
    expect(prompt).toContain("ONE realistic, in-scenario complication");
  });

  it("omits the success-conditions block when there are none", () => {
    const prompt = buildMissionSystemPrompt({
      ...mission,
      successConditions: [],
    });
    expect(prompt).not.toContain("Success looks like:");
  });

  it("omits speaking-difficulty scaling when no hskReference is given", () => {
    const prompt = buildMissionSystemPrompt(mission);
    expect(prompt).not.toContain("Speaking difficulty:");
  });

  it("tells the AI to speak slowly and simply for an HSK 1 lesson", () => {
    const prompt = buildMissionSystemPrompt({ ...mission, hskReference: 1 });
    expect(prompt).toContain("Speaking difficulty: HSK 1");
    expect(prompt.toLowerCase()).toContain("speak slowly");
  });

  it("tells the AI to speak at a natural, faster pace for an HSK 4 lesson", () => {
    const prompt = buildMissionSystemPrompt({ ...mission, hskReference: 4 });
    expect(prompt).toContain("Speaking difficulty: HSK 4");
    expect(prompt.toLowerCase()).toContain("slightly faster");
  });

  it("tells the AI to speak at native pace with idioms for HSK 5+", () => {
    const prompt = buildMissionSystemPrompt({ ...mission, hskReference: 6 });
    expect(prompt).toContain("Speaking difficulty: HSK 6");
    expect(prompt.toLowerCase()).toContain("native conversational pace");
    expect(prompt.toLowerCase()).toContain("chengyu");
  });
});
