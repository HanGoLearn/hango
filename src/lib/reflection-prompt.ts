/**
 * Prompt construction and response parsing for the Reflection step's
 * scored report (Remaining Lesson Steps Upgrade Phase G) - pure/testable,
 * same split as mission-evaluation.ts. The actual AI calls and persistence
 * live in src/lib/reflection.ts.
 */
import type { SpeakingFeedback } from "@/lib/speaking-feedback";
import {
  parseSpeakingFeedback,
  DEFAULT_SPEAKING_FEEDBACK,
} from "@/lib/speaking-feedback";

/**
 * Extends Speaking Lab's SpeakingFeedback with the two gates the Points &
 * Leveling System's Speaking score needs (docs/02_academy/points_system.md
 * Part 1): how much of the lesson's taught vocabulary was actually used,
 * and how completely the scenario's objective was met. Kept separate from
 * SpeakingFeedback itself (not added there) - these two ratios only make
 * sense for a lesson's Speaking step, which has taught vocabulary and an
 * objective; they don't apply to every Speaking Lab activity type (e.g.
 * single-word Pronunciation practice has neither).
 */
export interface SpeakingConversationFeedback extends SpeakingFeedback {
  /**
   * 0-1: fraction of taughtVocabulary the learner demonstrably engaged
   * with - either produced themselves, or understood well enough to give a
   * coherent response when the AI character used it first (2026-08-16
   * redesign: the original "learner must self-produce every word" rule
   * penalized natural Chinese, which drops a noun once established and
   * replies with 好，我要 instead of restating it - and made the score
   * fragile to a single mis-transcribed word, since it depended on exact
   * string matching in the learner's own turn).
   */
  vocabularyUsageRatio: number;
  /** 0-1: how completely the scenario's objective/success conditions were met. */
  objectiveCompletionRatio: number;
}

export const DEFAULT_SPEAKING_CONVERSATION_FEEDBACK: SpeakingConversationFeedback =
  {
    ...DEFAULT_SPEAKING_FEEDBACK,
    vocabularyUsageRatio: 0,
    objectiveCompletionRatio: 0,
  };

export interface SpeakingConversationScenario {
  learnerRole: string;
  aiRole: string;
  objective: string;
  taughtVocabulary?: string[];
  taughtGrammar?: string[];
  successConditions?: string[];
}

export interface SpeakingTranscriptMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Extends SpeakingFeedback's rubric (Speaking Lab's shape) with two gates
 * the Points & Leveling System's Speaking score multiplies by
 * (docs/02_academy/points_system.md Part 1) - vocabularyUsageRatio and
 * objectiveCompletionRatio - so a fluent conversation that never used the
 * taught vocabulary or never completed the objective can't average its way
 * to a high score. "Pronunciation" is rated the same cautious way Speaking
 * Lab already does (speaking-feedback.ts's buildSpeakingFeedbackPrompt) -
 * an AI estimate from the transcript, not a phonetic analysis. It is
 * included for consistency between the two Speaking scoring paths (user
 * decision, 2026-08-15); the real audio-derived signal that exists in the
 * app (tone-analysis.ts's toneScore, used by Speaking Lab) is not yet wired
 * in here - worth revisiting since it's a stronger signal than an AI guess.
 */
export function buildSpeakingConversationFeedbackPrompt(
  scenario: SpeakingConversationScenario,
  transcript: SpeakingTranscriptMessage[],
): string {
  const transcriptText = transcript
    .map(
      (message) =>
        `${message.role === "user" ? scenario.learnerRole : scenario.aiRole}: ${message.content}`,
    )
    .join("\n");

  return [
    "You are evaluating a Mandarin Chinese learner's practice conversation from this lesson's Speaking step.",
    `The learner played "${scenario.learnerRole}", the AI played "${scenario.aiRole}".`,
    `Objective: ${scenario.objective}`,
    `Lesson vocabulary the learner was taught: ${scenario.taughtVocabulary?.join(", ") || "none supplied"}.`,
    `Lesson grammar/structures the learner was taught: ${scenario.taughtGrammar?.join(", ") || "none supplied"}.`,
    `Mission success conditions: ${scenario.successConditions?.join("; ") || "none supplied"}.`,
    "Conversation transcript:",
    transcriptText || "(no messages)",
    "",
    "First judge only the learner's turns; never give the learner credit for language used only by the AI character.",
    "Before flagging a missing greeting, question, or piece of information as a mistake, check what the AI character already said earlier in the transcript. If the AI character already greeted the learner, already volunteered its own name/role/nationality/etc. unprompted, or already answered a question the learner would otherwise need to ask, do not require the learner to redundantly repeat or re-request that same thing - a natural reply does not restate information the other side just gave. Only flag a missing greeting, question, or reciprocal detail when the learner genuinely had an open opportunity to give or ask for it and did not.",
    "Rate these dimensions 0-100 using demonstrated evidence only:",
    "- pronunciation: your best estimate from the transcript alone (this is speech-to-text, not a phonetic analysis - do not claim certainty).",
    "- fluency: continuity, responsiveness, and natural turn-taking across the learner's turns; a greeting alone is not fluency evidence.",
    "- accuracy: correctness and comprehensibility of the learner's Mandarin.",
    "- complexity: useful range of the lesson's taught vocabulary and grammar structures, appropriate to the learner's level. Do not reward advanced language for its own sake.",
    "- communicationEffectiveness: whether the learner understood the situation and responded relevantly.",
    "Also rate, 0-1 (not 0-100):",
    "- vocabularyUsageRatio: fraction of the listed lesson vocabulary the learner demonstrably engaged with. A word counts if EITHER (a) the learner used it correctly themselves, OR (b) the AI character used it first and the learner's next turn gives a clear, contextually appropriate response that shows they understood it - a natural reply that doesn't repeat the word back (e.g. answering 你想喝咖啡吗 with 好，我要 instead of restating 咖啡) still counts, because that is how a fluent speaker actually responds. Do not count a word merely because it appears somewhere in the transcript with no evidence the learner understood it - a confused, off-topic, or non-responsive reply after the character used the word does not count, even if the learner's turn happens to contain the same characters (this could also be a mis-transcription, not real usage).",
    "- objectiveCompletionRatio: how completely the objective/success conditions above were achieved by the end of the conversation.",
    "A learner who only greets, gives one short answer, or ends before attempting the mission must receive very low scores across the board, including both ratios; do not award a participation baseline.",
    "Write 1-2 sentences of specific, actionable feedback, and one short recommended next step.",
    "Also return up to 6 specific learner mistakes. Allowed categories: tones, pronunciation, grammar, vocabulary, context, response, fluency. Each mistake must quote brief evidence from the learner's own words and explain how to improve it.",
    "Use context when the learner goes off-scenario, response when they fail to answer the character's question, grammar/vocabulary for incorrect or missing lesson language, and fluency for unnatural turn progression.",
    "Never add a tones mistake without audio evidence - this evaluator currently receives transcript-only evidence, so omit that category (pronunciation mistakes are fine, per the estimate above).",
    "",
    "Respond with ONLY a JSON object shaped exactly like this, no other text:",
    '{"pronunciation": number, "fluency": number, "accuracy": number, "complexity": number, "communicationEffectiveness": number, "vocabularyUsageRatio": number, "objectiveCompletionRatio": number, "notes": string, "recommendedNextStep": string, "mistakes": [{"category": "grammar|vocabulary|context|response|fluency", "evidence": string, "feedback": string}]}',
  ].join("\n");
}

export function hasEnoughSpeakingEvidence(
  transcript: SpeakingTranscriptMessage[],
): boolean {
  const learnerTurns = transcript
    .filter((message) => message.role === "user")
    .map((message) => message.content.trim())
    .filter(Boolean);
  const substantiveTurns = learnerTurns.filter(
    (content) => !/^(?:ni\s*hao|nǐ\s*hǎo|你好|hi|hello|hola)[!,.。！?？\s]*$/iu.test(content),
  );
  const substantiveText = substantiveTurns.join(" ");
  const chineseCharacters = substantiveText.match(/[\p{Script=Han}]/gu)?.length ?? 0;
  const spokenWords = substantiveText.split(/\s+/u).filter(Boolean).length;

  // Semantic VAD may keep a long answer in one transcript chunk. Evidence
  // sufficiency therefore depends on demonstrated language, not an
  // arbitrary number of database rows.
  return (
    substantiveTurns.length >= 2 ||
    chineseCharacters >= 6 ||
    spokenWords >= 6
  );
}

function isRatio(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
}

/**
 * Parses the extended shape buildSpeakingConversationFeedbackPrompt asks
 * for - reuses parseSpeakingFeedback for the shared 5-dimension rubric, then
 * separately validates the two 0-1 ratios. Falls back to
 * DEFAULT_SPEAKING_CONVERSATION_FEEDBACK (ratios 0) whenever either ratio is
 * missing or out of range, same never-throws contract as the rest of this
 * module.
 */
export function parseSpeakingConversationFeedback(
  raw: string,
): SpeakingConversationFeedback {
  const base = parseSpeakingFeedback(raw);
  if (base === DEFAULT_SPEAKING_FEEDBACK) {
    return DEFAULT_SPEAKING_CONVERSATION_FEEDBACK;
  }

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  const candidate = jsonMatch
    ? (JSON.parse(jsonMatch[0]) as Record<string, unknown>)
    : {};

  if (
    !isRatio(candidate.vocabularyUsageRatio) ||
    !isRatio(candidate.objectiveCompletionRatio)
  ) {
    return { ...base, vocabularyUsageRatio: 0, objectiveCompletionRatio: 0 };
  }

  return {
    ...base,
    vocabularyUsageRatio: candidate.vocabularyUsageRatio,
    objectiveCompletionRatio: candidate.objectiveCompletionRatio,
  };
}

export { DEFAULT_SPEAKING_FEEDBACK };
export type { SpeakingFeedback };

export interface ReflectionScores {
  vocabularyCovered: number;
  vocabularyTotal: number;
  vocabularyScore: number | null;
  comprehensionScore: number | null;
  grammarScore: number | null;
  speakingScore: number | null;
}

export interface HanReflectionNarrative {
  narrative: string;
  strengths: string[];
  improvements: string[];
}

export function buildHanReflectionNarrativePrompt(
  lessonTitle: string,
  scores: ReflectionScores,
): string {
  return [
    "You are Han, a friendly, confident, modern Mandarin teacher, writing a short spoken-style note to a learner who just finished a lesson.",
    `Lesson: ${lessonTitle}`,
    `Vocabulary explored: ${scores.vocabularyCovered} of ${scores.vocabularyTotal} words.`,
    scores.vocabularyScore !== null
      ? `Vocabulary quiz accuracy: ${scores.vocabularyScore}/100.`
      : "Vocabulary quiz: not enough data yet.",
    scores.comprehensionScore !== null
      ? `Comprehension score: ${scores.comprehensionScore}/100.`
      : "Comprehension: not enough data yet.",
    scores.grammarScore !== null
      ? `Grammar practice score: ${scores.grammarScore}/100.`
      : "Grammar practice: not enough data yet.",
    scores.speakingScore !== null
      ? `Speaking score: ${scores.speakingScore}/100.`
      : "Speaking: not enough data yet.",
    "",
    "Write every output field in natural English only. Do not write the note, strengths, or improvements in Mandarin, Spanish, pinyin, or another language. Chinese characters may appear only when citing one specific vocabulary example.",
    "Write a warm, specific, 2-4 sentence note in Han's voice - as if talking directly to the learner, not a report. Reference the real numbers above naturally (don't just repeat them as a list). Be honest but encouraging - if a score is low, frame it as normal progress, not failure.",
    "Then list 1-3 short, specific things that went well, and 1-3 short, specific, actionable things to improve - based on the actual scores given (don't invent specifics you have no data for). Keep those lists in English too.",
    "",
    "Respond with ONLY a JSON object, no other text, shaped exactly like this:",
    '{"narrative": string, "strengths": string[], "improvements": string[]}',
  ].join("\n");
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

/** Never throws - returns a safe generic fallback for anything that doesn't parse cleanly. */
export function parseHanReflectionNarrative(
  raw: string,
): HanReflectionNarrative {
  const fallback: HanReflectionNarrative = {
    narrative:
      "Nice work finishing this lesson. Keep practicing a little every day, and it'll keep getting easier.",
    strengths: [],
    improvements: [],
  };

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return fallback;

  try {
    const parsed: unknown = JSON.parse(jsonMatch[0]);
    if (!parsed || typeof parsed !== "object") return fallback;
    const candidate = parsed as Record<string, unknown>;

    if (
      typeof candidate.narrative !== "string" ||
      !candidate.narrative.trim() ||
      !isStringArray(candidate.strengths) ||
      !isStringArray(candidate.improvements)
    ) {
      return fallback;
    }

    return {
      narrative: candidate.narrative,
      strengths: candidate.strengths,
      improvements: candidate.improvements,
    };
  } catch {
    return fallback;
  }
}
