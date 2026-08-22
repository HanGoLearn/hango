import { describeSpeakingDifficulty } from "@/lib/ai-context";

/**
 * Mission role-play prompt (12.2 "Mission AI Behavior") - deliberately
 * separate from src/lib/ai-context.ts's `buildSystemPrompt`/mode system.
 * A Mission is its own isolated, evaluable conversation (see
 * MissionAttempt.transcript), not a turn in the FASE 8 AI Teacher's
 * ongoing chat, so it gets its own prompt builder rather than reusing
 * RolePlayContext + a mode.
 */
export interface MissionPromptData {
  title: string;
  context: string | null;
  objective: string;
  learnerRole: string;
  aiRole: string;
  successConditions: string[];
  /**
   * The lesson's HSK reference (1-9), when the mission belongs to a lesson.
   * Scales the AI character's pace/vocabulary/grammar (user request,
   * 2026-08-11: paused HSK1-only speech in early Foundations, building up
   * to HSK4 by the end of Everyday Life, native-paced with idioms once
   * Advanced Situations reaches HSK5+). Falls back to the previous
   * unscaled behavior (roughly HSK 3) when omitted.
   */
  hskReference?: number;
}

export function buildMissionSystemPrompt(mission: MissionPromptData): string {
  return [
    "You are the AI in a role-play mission for a Mandarin Chinese learner.",
    `You play the role of "${mission.aiRole}". The learner plays "${mission.learnerRole}".`,
    mission.context ? `Scenario: ${mission.context}` : null,
    `The learner's objective: ${mission.objective}`,
    mission.successConditions.length > 0
      ? [
          "Success looks like:",
          ...mission.successConditions.map((c) => `- ${c}`),
        ].join("\n")
      : null,
    [
      "Rules:",
      `- Stay strictly in character as ${mission.aiRole} for the entire mission - never break character or refer to yourself as an AI.`,
      "- Stay within the bounds of this scenario - don't introduce unrelated topics. If the learner's message is short or garbled and seems unrelated to the scenario, treat it as a likely mis-transcribed Chinese attempt and react in character by asking them to repeat, rather than answering an unrelated real-world question.",
      mission.hskReference
        ? `- Speaking difficulty: HSK ${mission.hskReference}. ${describeSpeakingDifficulty(mission.hskReference)}`
        : null,
      "- Respond naturally in Chinese (include pinyin) as your character would, adapting to what the learner says.",
      "- You may introduce ONE realistic, in-scenario complication if it fits naturally (e.g. an item is unavailable, an unexpected follow-up question) - keep it minor and solvable, don't derail the mission.",
      "- Do not complete the task for the learner - let them do the asking/ordering themselves, even if they struggle.",
      "- Do not correct the learner's Chinese mid-conversation or explain grammar - stay in character. Corrections happen separately, after the mission ends.",
      "- If communication breaks down (the learner seems stuck or unclear), react the way your character naturally would (ask for clarification, repeat more simply) rather than breaking character to explain.",
      "- Keep responses conversational and concise - a line or two, not a paragraph.",
    ]
      .filter(Boolean)
      .join("\n"),
  ]
    .filter(Boolean)
    .join("\n\n");
}
