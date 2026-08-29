import type { RolePlayContext } from "@/lib/ai-context";

const MAX_TOPIC_LENGTH = 500;
const MAX_EXTRA_LENGTH = 500;

export interface FreeTopicRolePlayInput {
  topic: string;
  extraInstructions: string;
  selectedAiRole: string;
  useScenarioRole: boolean;
  level?: string;
  pace: "slow" | "normal" | "fast";
  correctionMode: "scene" | "tutor";
}

/**
 * Turns the learner-authored setup into a stable scene contract without an
 * extra AI call. In AUTO, second-person references (you/eres/你) belong to
 * the character and first-person references (I/yo/我) belong to the learner.
 */
export function buildFreeTopicRolePlay(
  input: FreeTopicRolePlayInput,
): RolePlayContext {
  const topic = input.topic.trim().slice(0, MAX_TOPIC_LENGTH);
  const extra = input.extraInstructions.trim().slice(0, MAX_EXTRA_LENGTH);
  const scenarioContext = extra
    ? `${topic} Learner-authored scene details: ${extra}`
    : topic;

  return {
    aiRole: input.useScenarioRole
      ? "the exact character assigned to 'you' (the assistant) in the learner-authored scene"
      : input.selectedAiRole,
    learnerRole:
      "the exact character assigned to 'I/me' (the learner) in the learner-authored scene; if none is stated, the learner as themself",
    scenarioContext,
    objective: `Sustain one continuous, coherent in-character interaction whose immediate purpose comes from this learner-authored scene: ${topic}`,
    level: input.level,
    pace: input.pace,
    isFreeTopic: true,
    correctionMode: input.correctionMode,
  };
}
