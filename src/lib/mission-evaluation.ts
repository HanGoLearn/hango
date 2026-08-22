/**
 * Mission evaluation (12.5) - prompt construction and response parsing are
 * pure/testable here; the actual AI call lives in mission-data.ts (same
 * split as speaking/writing feedback).
 */
export interface MissionSuccessConditionResult {
  description: string;
  met: boolean;
}

export interface MissionReport {
  communicationSuccess: number;
  taskCompletion: number;
  vocabularyUsage: number;
  grammarUsage: number;
  clarity: number;
  successConditions: MissionSuccessConditionResult[];
  overallNotes: string;
  recommendedNextStep: string;
}

export function defaultMissionReport(
  successConditionDescriptions: string[],
): MissionReport {
  return {
    communicationSuccess: 50,
    taskCompletion: 50,
    vocabularyUsage: 50,
    grammarUsage: 50,
    clarity: 50,
    successConditions: successConditionDescriptions.map((description) => ({
      description,
      met: false,
    })),
    overallNotes:
      "Automatic evaluation couldn't be generated this time, but your mission was saved.",
    recommendedNextStep: "Feel free to try this mission again.",
  };
}

export interface MissionTranscriptMessage {
  role: "user" | "assistant";
  content: string;
}

export function buildMissionEvaluationPrompt(
  mission: {
    title: string;
    objective: string;
    learnerRole: string;
    aiRole: string;
    successConditions: string[];
  },
  transcript: MissionTranscriptMessage[],
): string {
  const transcriptText = transcript
    .map(
      (message) =>
        `${message.role === "user" ? mission.learnerRole : mission.aiRole}: ${message.content}`,
    )
    .join("\n");

  return [
    "You are evaluating a completed role-play mission for a Mandarin Chinese learner.",
    `Mission: ${mission.title}`,
    `Objective: ${mission.objective}`,
    "Success conditions:",
    ...mission.successConditions.map((c) => `- ${c}`),
    "",
    "Full conversation:",
    transcriptText || "(no messages were exchanged)",
    "",
    "Evaluate on these 5 dimensions, each 0-100: communicationSuccess, taskCompletion, vocabularyUsage, grammarUsage, clarity.",
    "Minor grammar errors must NOT automatically cause failure when communication succeeded overall - weigh communicationSuccess and taskCompletion most heavily.",
    "For each success condition listed above, decide whether the learner met it (true/false) based on the conversation.",
    "Write one short overall note and one recommended next step.",
    "",
    "Respond with ONLY a JSON object shaped exactly like this, no other text:",
    '{"communicationSuccess": number, "taskCompletion": number, "vocabularyUsage": number, "grammarUsage": number, "clarity": number, "successConditions": [{"description": string, "met": boolean}], "overallNotes": string, "recommendedNextStep": string}',
  ].join("\n");
}

function isFiniteNumberInRange(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 100
  );
}

function isSuccessConditionArray(
  value: unknown,
): value is MissionSuccessConditionResult[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item &&
        typeof item === "object" &&
        typeof (item as Record<string, unknown>).description === "string" &&
        typeof (item as Record<string, unknown>).met === "boolean",
    )
  );
}

/** Never throws - returns a neutral default (built from the mission's real success conditions) for anything that doesn't parse cleanly. */
export function parseMissionReport(
  raw: string,
  successConditionDescriptions: string[],
): MissionReport {
  const fallback = defaultMissionReport(successConditionDescriptions);
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return fallback;

  try {
    const parsed: unknown = JSON.parse(jsonMatch[0]);
    if (!parsed || typeof parsed !== "object") return fallback;

    const candidate = parsed as Record<string, unknown>;
    const scores = [
      "communicationSuccess",
      "taskCompletion",
      "vocabularyUsage",
      "grammarUsage",
      "clarity",
    ] as const;

    if (!scores.every((key) => isFiniteNumberInRange(candidate[key]))) {
      return fallback;
    }
    if (
      typeof candidate.overallNotes !== "string" ||
      typeof candidate.recommendedNextStep !== "string" ||
      !isSuccessConditionArray(candidate.successConditions)
    ) {
      return fallback;
    }

    return {
      communicationSuccess: candidate.communicationSuccess as number,
      taskCompletion: candidate.taskCompletion as number,
      vocabularyUsage: candidate.vocabularyUsage as number,
      grammarUsage: candidate.grammarUsage as number,
      clarity: candidate.clarity as number,
      successConditions: candidate.successConditions,
      overallNotes: candidate.overallNotes,
      recommendedNextStep: candidate.recommendedNextStep,
    };
  } catch {
    return fallback;
  }
}
