export type LearnerFactCategory =
  | "JOB"
  | "GOAL"
  | "TRIP"
  | "FAMILY"
  | "HOBBY"
  | "OTHER";

export interface LearnerFactExtraction {
  category: LearnerFactCategory;
  fact: string;
}

export interface LearnerFactTranscriptMessage {
  role: "user" | "assistant";
  content: string;
}

export function buildLearnerFactsExtractionPrompt(
  transcript: LearnerFactTranscriptMessage[],
): string {
  const conversationText = transcript
    .map((m) => `${m.role === "user" ? "Learner" : "Han"}: ${m.content}`)
    .join("\n");

  return [
    "You are reviewing a conversation between a learner and Han, their Mandarin Chinese tutor, to extract genuinely personal facts worth remembering for future conversations - the kind a real friend would remember, not lesson progress (that's already tracked elsewhere).",
    "",
    "Conversation:",
    conversationText,
    "",
    "Extract only facts the learner stated about their own real life - their job, why they're learning Chinese, an upcoming trip, family, a hobby, or something similar. Never invent a fact that wasn't actually stated. Skip anything about Chinese vocabulary, grammar, or lesson content itself - that's not what this is for.",
    'Each fact should be a short, natural sentence (max ~15 words) written in English, plain and factual, e.g. "Works as a nurse" or "Learning Chinese for an upcoming trip to Shanghai".',
    "If there is nothing genuinely worth remembering, return an empty list - do not force a fact that isn't really there.",
    "",
    "Respond with ONLY a JSON object, no other text, shaped exactly like this:",
    '{"facts": [{"category": "JOB"|"GOAL"|"TRIP"|"FAMILY"|"HOBBY"|"OTHER", "fact": string}]}',
  ].join("\n");
}

const VALID_CATEGORIES = new Set<LearnerFactCategory>([
  "JOB",
  "GOAL",
  "TRIP",
  "FAMILY",
  "HOBBY",
  "OTHER",
]);

function isValidFact(value: unknown): value is LearnerFactExtraction {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.category === "string" &&
    VALID_CATEGORIES.has(candidate.category as LearnerFactCategory) &&
    typeof candidate.fact === "string" &&
    candidate.fact.trim().length > 0
  );
}

/** Never throws - returns an empty list for anything that doesn't parse cleanly (same convention as reflection-prompt.ts's parseHanReflectionNarrative). */
export function parseLearnerFacts(raw: string): LearnerFactExtraction[] {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return [];

  try {
    const parsed: unknown = JSON.parse(jsonMatch[0]);
    if (!parsed || typeof parsed !== "object") return [];
    const candidate = parsed as Record<string, unknown>;
    if (!Array.isArray(candidate.facts)) return [];
    return candidate.facts.filter(isValidFact);
  } catch {
    return [];
  }
}
