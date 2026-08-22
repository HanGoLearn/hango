/**
 * Writing feedback (11.5) - prompt construction and response parsing are
 * pure/testable here; the actual AI call lives in writing-data.ts (same
 * split as speaking-feedback.ts). Evaluates grammar, vocabulary,
 * naturalness, and communication clarity per TASKS.md 11.5 - "organization"
 * is folded into naturalness/clarity rather than a 5th score, since no doc
 * defines it as a separate numeric dimension the way speaking_lab.md does
 * for speaking.
 */
export interface WritingFeedback {
  grammar: number;
  vocabulary: number;
  naturalness: number;
  communicationClarity: number;
  correctedVersion: string;
  importantChanges: string[];
  overallNotes: string;
}

export const DEFAULT_WRITING_FEEDBACK: WritingFeedback = {
  grammar: 50,
  vocabulary: 50,
  naturalness: 50,
  communicationClarity: 50,
  correctedVersion: "",
  importantChanges: [],
  overallNotes:
    "Automatic feedback couldn't be generated this time, but your writing was saved.",
};

const TASK_TYPE_LABELS: Record<string, string> = {
  PARAGRAPH: "a paragraph",
  TRANSLATION_CHALLENGE: "a translation into Chinese",
};

/**
 * `referenceAnswer` is only set for TRANSLATION_CHALLENGE tasks (the
 * lesson's own Chinese text, never shown to the learner) - when present,
 * grading checks the translation's accuracy against it while still
 * accepting any other valid, natural phrasing of the same meaning, not
 * just an exact match (2026-08-08, Writing Lab redesign).
 */
export function buildWritingFeedbackPrompt(
  taskType: string,
  prompt: string,
  submittedText: string,
  referenceAnswer?: string | null,
): string {
  return [
    "You are evaluating a Mandarin Chinese learner's written response.",
    `Task type: ${TASK_TYPE_LABELS[taskType] ?? taskType}`,
    `Writing prompt: "${prompt}"`,
    referenceAnswer
      ? `One valid Chinese translation (for your reference only - the learner never saw this; accept any other natural phrasing that preserves the same meaning): "${referenceAnswer}"`
      : null,
    `Learner's response: "${submittedText}"`,
    "",
    "First, evaluate the learner's own attempt as written (do not silently rewrite it in your head first) on these 4 dimensions, each 0-100: grammar, vocabulary, naturalness, communicationClarity.",
    referenceAnswer
      ? "For this translation task, communicationClarity should reflect how accurately the learner's meaning matches the source text, not just general clarity."
      : null,
    "Then provide a corrected version of their response - natural, correct Chinese that preserves their intended meaning.",
    'List the important changes you made (a short phrase per change, e.g. "要 → 想 - more natural for expressing a wish"), and a short overall note.',
    "",
    "Respond with ONLY a JSON object shaped exactly like this, no other text:",
    '{"grammar": number, "vocabulary": number, "naturalness": number, "communicationClarity": number, "correctedVersion": string, "importantChanges": string[], "overallNotes": string}',
  ]
    .filter(Boolean)
    .join("\n");
}

export interface CustomWritingCharacteristics {
  topic: string;
  /** e.g. "HSK 3" - undefined means "use my profile level". */
  level?: string;
  /** e.g. "a short message", "a paragraph", "a practical note" - free text, no fixed catalog. */
  format?: string;
  tone?: "casual" | "formal";
  /** Anything else the learner wants honored (matches Speaking Lab's free-topic "anything else" field). */
  extra?: string;
}

/**
 * "Custom Writing" (Writing Lab redesign, 2026-08-08 round 2) - the learner
 * states their own topic/level/format/tone instead of picking a fixed
 * WritingTask; grading is judged against exactly those stated
 * characteristics rather than a pre-written prompt. No WritingTask row
 * involved - ordinary WritingTask rows are a shared catalog, not meant for
 * one-off personalized prompts - but the graded attempt is still persisted
 * (see submitCustomWriting() in writing-data.ts), just without one.
 */
export function buildCustomWritingFeedbackPrompt(
  characteristics: CustomWritingCharacteristics,
  submittedText: string,
): string {
  return [
    "You are evaluating a Mandarin Chinese learner's written response to a prompt they customized themselves.",
    `Topic: ${characteristics.topic}`,
    characteristics.level ? `Requested level: ${characteristics.level}` : null,
    characteristics.format ? `Requested format: ${characteristics.format}` : null,
    characteristics.tone ? `Requested tone: ${characteristics.tone}` : null,
    characteristics.extra
      ? `Additional instructions from the learner: ${characteristics.extra}`
      : null,
    `Learner's response: "${submittedText}"`,
    "",
    "First, evaluate the learner's own attempt as written (do not silently rewrite it in your head first) on these 4 dimensions, each 0-100: grammar, vocabulary, naturalness, communicationClarity.",
    "Judge naturalness and communicationClarity specifically against how well the response matches the requested topic, format, and tone above - not just general correctness.",
    "Then provide a corrected version of their response - natural, correct Chinese that preserves their intended meaning and honors the requested characteristics.",
    'List the important changes you made (a short phrase per change), and a short overall note.',
    "",
    "Respond with ONLY a JSON object shaped exactly like this, no other text:",
    '{"grammar": number, "vocabulary": number, "naturalness": number, "communicationClarity": number, "correctedVersion": string, "importantChanges": string[], "overallNotes": string}',
  ]
    .filter(Boolean)
    .join("\n");
}

function isFiniteNumberInRange(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 100
  );
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

/** Never throws - returns DEFAULT_WRITING_FEEDBACK for anything that doesn't parse cleanly. */
export function parseWritingFeedback(raw: string): WritingFeedback {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return DEFAULT_WRITING_FEEDBACK;

  try {
    const parsed: unknown = JSON.parse(jsonMatch[0]);
    if (!parsed || typeof parsed !== "object") return DEFAULT_WRITING_FEEDBACK;

    const candidate = parsed as Record<string, unknown>;
    const scores = [
      "grammar",
      "vocabulary",
      "naturalness",
      "communicationClarity",
    ] as const;

    if (!scores.every((key) => isFiniteNumberInRange(candidate[key]))) {
      return DEFAULT_WRITING_FEEDBACK;
    }
    if (
      typeof candidate.correctedVersion !== "string" ||
      typeof candidate.overallNotes !== "string" ||
      !isStringArray(candidate.importantChanges)
    ) {
      return DEFAULT_WRITING_FEEDBACK;
    }

    return {
      grammar: candidate.grammar as number,
      vocabulary: candidate.vocabulary as number,
      naturalness: candidate.naturalness as number,
      communicationClarity: candidate.communicationClarity as number,
      correctedVersion: candidate.correctedVersion,
      importantChanges: candidate.importantChanges,
      overallNotes: candidate.overallNotes,
    };
  } catch {
    return DEFAULT_WRITING_FEEDBACK;
  }
}
