/**
 * Speaking feedback (10.6) - prompt construction and response parsing are
 * pure/testable here; the actual AI call lives in speaking-data.ts. Scores
 * follow speaking_lab.md's 5-dimension rubric (Pronunciation, Fluency,
 * Accuracy, Complexity, Communication Effectiveness) - no numeric scale is
 * defined in the docs, so 0-100 was chosen for consistency with the
 * quiz/exercise scoring already used elsewhere in the app.
 */
export interface SpeakingFeedback {
  pronunciation: number;
  fluency: number;
  accuracy: number;
  complexity: number;
  communicationEffectiveness: number;
  notes: string;
  recommendedNextStep: string;
  mistakes: SpeakingMistake[];
  /**
   * Real tone-contour match (0-100), computed client-side from the actual
   * recording against the expected pinyin (tone-analysis.ts) - not an AI
   * guess from a transcript like `pronunciation` above. null when no target
   * pinyin was available (free-form activities) or there wasn't enough
   * voiced audio to score.
   */
  toneScore?: number | null;
}

export interface SpeakingMistake {
  category: "tones" | "pronunciation" | "grammar" | "vocabulary" | "context" | "response" | "fluency";
  evidence: string;
  feedback: string;
}

/** Used whenever the AI call fails or returns something unparseable - the recording/transcript are never lost over this (8.6/10 "AI failure must not block"). */
export const DEFAULT_SPEAKING_FEEDBACK: SpeakingFeedback = {
  pronunciation: 50,
  fluency: 50,
  accuracy: 50,
  complexity: 50,
  communicationEffectiveness: 50,
  notes:
    "Automatic feedback couldn't be generated this time, but your recording and transcript were saved.",
  recommendedNextStep: "Feel free to try this activity again.",
  mistakes: [],
};

const ACTIVITY_LABELS: Record<string, string> = {
  PRONUNCIATION: "Pronunciation practice (repeating a single word)",
  SHADOWING: "Shadowing practice (repeating a full sentence)",
  GUIDED_CONVERSATION: "Guided conversation (open-ended spoken response)",
  SCENARIO_ROLE_PLAY: "Scenario role play (in-character spoken response)",
};

export function buildSpeakingFeedbackPrompt(
  activityType: string,
  prompt: string,
  transcript: string,
): string {
  return [
    "You are evaluating a Mandarin Chinese learner's spoken practice attempt.",
    `Activity: ${ACTIVITY_LABELS[activityType] ?? activityType}`,
    `What the learner was asked to say: "${prompt}"`,
    `Transcript of what they actually said (from speech-to-text, may contain errors): "${transcript}"`,
    "",
    "Rate the attempt on these 5 dimensions, each 0-100: pronunciation, fluency, accuracy, complexity, communicationEffectiveness.",
    "Do not claim perfect phonetic certainty - the transcript comes from automatic speech recognition, not a phonetic analysis.",
    'Write 1-2 sentences of specific, actionable feedback (e.g. name the actual issue, not "pronunciation was wrong"), and one short recommended next step.',
    "",
    "Respond with ONLY a JSON object shaped exactly like this, no other text:",
    '{"pronunciation": number, "fluency": number, "accuracy": number, "complexity": number, "communicationEffectiveness": number, "notes": string, "recommendedNextStep": string}',
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

/** Never throws - returns DEFAULT_SPEAKING_FEEDBACK for anything that doesn't parse cleanly. */
export function parseSpeakingFeedback(raw: string): SpeakingFeedback {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return DEFAULT_SPEAKING_FEEDBACK;

  try {
    const parsed: unknown = JSON.parse(jsonMatch[0]);
    if (!parsed || typeof parsed !== "object") return DEFAULT_SPEAKING_FEEDBACK;

    const candidate = parsed as Record<string, unknown>;
    const scores = [
      "pronunciation",
      "fluency",
      "accuracy",
      "complexity",
      "communicationEffectiveness",
    ] as const;

    if (!scores.every((key) => isFiniteNumberInRange(candidate[key]))) {
      return DEFAULT_SPEAKING_FEEDBACK;
    }
    if (
      typeof candidate.notes !== "string" ||
      typeof candidate.recommendedNextStep !== "string"
    ) {
      return DEFAULT_SPEAKING_FEEDBACK;
    }

    const mistakes = Array.isArray(candidate.mistakes)
      ? candidate.mistakes.flatMap((item) => {
          if (!item || typeof item !== "object") return [];
          const mistake = item as Record<string, unknown>;
          const categories = ["tones", "pronunciation", "grammar", "vocabulary", "context", "response", "fluency"];
          if (
            typeof mistake.category !== "string" ||
            !categories.includes(mistake.category) ||
            typeof mistake.evidence !== "string" ||
            typeof mistake.feedback !== "string"
          ) return [];
          return [{
            category: mistake.category as SpeakingMistake["category"],
            evidence: mistake.evidence,
            feedback: mistake.feedback,
          }];
        }).slice(0, 6)
      : [];

    return {
      pronunciation: candidate.pronunciation as number,
      fluency: candidate.fluency as number,
      accuracy: candidate.accuracy as number,
      complexity: candidate.complexity as number,
      communicationEffectiveness:
        candidate.communicationEffectiveness as number,
      notes: candidate.notes,
      recommendedNextStep: candidate.recommendedNextStep,
      mistakes,
    };
  } catch {
    return DEFAULT_SPEAKING_FEEDBACK;
  }
}
