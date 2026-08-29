import { describe, expect, it } from "vitest";
import { buildFreeTopicRolePlay } from "@/lib/free-topic-role-play";

describe("buildFreeTopicRolePlay", () => {
  it("treats a Spanish learner-authored setup as role and scene instructions", () => {
    const rolePlay = buildFreeTopicRolePlay({
      topic: "Eres un profesor y yo soy un alumno nuevo en tu primera clase.",
      extraInstructions: "Estamos dentro del aula.",
      selectedAiRole: "unused auto role",
      useScenarioRole: true,
      level: "HSK 1",
      pace: "normal",
      correctionMode: "scene",
    });

    expect(rolePlay.aiRole).toContain("assigned to 'you'");
    expect(rolePlay.learnerRole).toContain("assigned to 'I/me'");
    expect(rolePlay.scenarioContext).toContain("profesor");
    expect(rolePlay.scenarioContext).toContain("dentro del aula");
    expect(rolePlay.objective).toContain("one continuous, coherent");
  });

  it("keeps an explicitly selected character while still resolving the learner's role", () => {
    const rolePlay = buildFreeTopicRolePlay({
      topic: "We meet at a supermarket checkout.",
      extraInstructions: "I am a customer with the wrong receipt.",
      selectedAiRole: "a store employee",
      useScenarioRole: false,
      pace: "slow",
      correctionMode: "tutor",
    });

    expect(rolePlay.aiRole).toBe("a store employee");
    expect(rolePlay.learnerRole).toContain("learner-authored scene");
    expect(rolePlay.isFreeTopic).toBe(true);
  });
});
