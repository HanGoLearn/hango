export type FrequencyTier = "very common" | "common" | "less common";

export interface VocabularyExample {
  emoji: string;
  chinese: string;
  pinyin: string;
  translation: string;
}

export interface VocabularyRelatedWord {
  chinese: string;
  pinyin: string;
  meaning: string;
  register?: string;
}

export interface VocabularyLookupResult {
  hero: { emoji: string; title: string; subtitle: string };
  frequencyTier: FrequencyTier;
  explanation: string;
  examples: VocabularyExample[];
  related: VocabularyRelatedWord[];
  mistakes: string | null;
  chineseGloss: string | null;
  curiosity: string | null;
}

/**
 * Per-level ceilings, decided across a long design conversation
 * (2026-08-31) and validated with a live artifact demo before being
 * written here - not guessed. Mirrors the shape of `describeSpeakingDifficulty`
 * (points-system.ts): one parametric function keyed by the real 0-9 level
 * (`hskNumberForPoints`), not 10 duplicated prose blocks.
 */
function exampleCeiling(hskLevel: number): number {
  if (hskLevel <= 1) return 3;
  if (hskLevel <= 5) return 5;
  if (hskLevel === 6) return 6;
  return 7;
}

function relatedCeiling(hskLevel: number): number {
  if (hskLevel === 0) return 0;
  if (hskLevel === 1) return 1;
  if (hskLevel <= 3) return 3;
  if (hskLevel <= 6) return 4;
  if (hskLevel === 7) return 4;
  if (hskLevel === 8) return 5;
  return 6;
}

export function buildVocabularyLookupPrompt(
  input: string,
  hskLevel: number,
  explanationLanguage: string,
): string {
  const allowMistakes = hskLevel >= 2;
  const chengyuAllowed = hskLevel >= 7;
  const glossRule =
    hskLevel >= 8
      ? `Always include "chineseGloss": a short definition written 100% in Chinese (a bonus alongside the clear ${explanationLanguage} explanation, never a replacement for it).`
      : hskLevel >= 7
        ? `Include "chineseGloss" as an optional bonus - a short 100% Chinese definition - if it feels natural; otherwise use null.`
        : `Set "chineseGloss" to null - this learner isn't ready for a Chinese-only definition yet.`;

  return [
    `You are Han, explaining the Mandarin word or phrase "${input}" to a learner.`,
    `The learner's real, earned level is HSK ${hskLevel} (0 = has not studied anything yet, 9 = mastering the language). This is their actual measured progress, not a guess - take it seriously.`,
    "",
    "INPUT HANDLING: the learner may have typed the Chinese characters directly, or typed pinyin (romanized) because they don't have a Chinese keyboard. If the input looks like pinyin, resolve it to the single most likely Mandarin word and explain THAT word - state your interpretation plainly in the hero's subtitle so it's never ambiguous which word you chose. Only ask a brief clarifying question (skip everything else and return a minimal response asking it) if two genuinely different, similarly plausible words could be meant - do not guess wildly or invent a word that doesn't exist.",
    "",
    `THE EXPLANATION ITSELF (the "explanation" field) is ALWAYS written in ${explanationLanguage}, at every level from 0 to 9 - it never switches to Chinese, no matter how advanced the learner is. What changes with level is how much nuance you cover and how many examples/related words you include, never the language the explanation is written in.`,
    "",
    "LEVEL-SPECIFIC RULES:",
    hskLevel === 0
      ? "- This learner has never studied Chinese before. Give ONLY the single most common, direct meaning. Zero grammar jargon (never say \"verb\", \"particle\", \"modal\"). Keep the explanation to 1 short sentence."
      : hskLevel === 1
        ? "- This learner knows greetings, numbers, and fixed phrases but doesn't build free sentences yet. Give the main meaning with at most one brief clarification if genuinely needed. No grammar jargon yet."
        : hskLevel <= 3
          ? "- This learner builds simple sentences on their own. Explain real context (when this word is/isn't used). You may lightly preview a secondary sense if the word has one, but don't dwell on it."
          : hskLevel <= 6
            ? "- This learner is comfortable with everyday conversation. Cover the word's real range of senses directly - don't hide a genuinely common secondary meaning (e.g. an obligation or imminence sense) just because it's less obvious."
            : "- This learner is advanced. Explain the word's full real range, including senses that only show up in formal/written register or set expressions - don't simplify away genuine complexity.",
    `- Examples: include up to ${exampleCeiling(hskLevel)}, each a natural, realistic sentence. Never pad with filler examples just to hit the ceiling - fewer good examples beat more repetitive ones.`,
    hskLevel >= 5
      ? `- CRITICAL for this level: build each example using vocabulary genuinely typical of HSK ${hskLevel} throughout the WHOLE sentence, not just simple/easy words wrapped around the target term. The sentence should read as real HSK ${hskLevel} material, not HSK1 material with one harder word inserted - this is what actually demonstrates the word at this learner's real level.`
      : "- Keep the surrounding vocabulary in each example just as simple as the word being explained - don't introduce unrelated hard words the learner hasn't earned yet.",
    chengyuAllowed
      ? "- You may include the word inside a chengyu (fixed four-character expression) or another set phrase if a genuinely relevant one exists, explained just as clearly as anything else - never forced if none fits."
      : null,
    hskLevel === 0
      ? "- Do not include \"related\" words at all (empty array) - one word at a time is enough for a first contact."
      : `- Related words: up to ${relatedCeiling(hskLevel)}, only genuinely useful ones (never pad the list). ${hskLevel >= 7 ? "Label each with its register (formal / colloquial / written) when it matters." : ""}`,
    allowMistakes
      ? `- Include one real, specific common mistake for a learner at this level - the kind of confusion someone genuinely makes here, never invented or generic. ${hskLevel >= 8 ? "At this level, the mistake should be a native-level distinction, not a basic error." : "Explain briefly why it happens, not just that it's wrong."}`
      : "- Set \"mistakes\" to null - this learner isn't ready for nuance about mistakes yet, it would only confuse them.",
    glossRule,
    "- \"curiosity\": one genuine, specific curious fact about the word - its character etymology or composition, a homophone or wordplay, an interesting compound formation, or real Chinese cultural context - whichever is actually true and relevant for this word. Never invent or force one just to fill the field - if nothing genuine applies (common for very abstract grammatical words), use null.",
    `- "frequencyTier": your own honest judgment of how common this word is in everyday Mandarin - "very common", "common", or "less common". This is a broad category from your own knowledge of the language, not a precise ranking - never state or imply an exact number or rank.`,
    `- "hero.emoji": one emoji that captures the word's core meaning. "hero.title": the Chinese word itself. "hero.subtitle": pinyin plus a very short gloss (and your interpretation, if you resolved this from pinyin input).`,
    "",
    "Respond with ONLY a JSON object, no other text, shaped exactly like this:",
    '{"hero":{"emoji":string,"title":string,"subtitle":string},"frequencyTier":"very common"|"common"|"less common","explanation":string,"examples":[{"emoji":string,"chinese":string,"pinyin":string,"translation":string}],"related":[{"chinese":string,"pinyin":string,"meaning":string,"register":string|null}],"mistakes":string|null,"chineseGloss":string|null,"curiosity":string|null}',
  ]
    .filter(Boolean)
    .join("\n");
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidExample(value: unknown): value is VocabularyExample {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    isNonEmptyString(candidate.chinese) &&
    isNonEmptyString(candidate.pinyin) &&
    isNonEmptyString(candidate.translation) &&
    typeof candidate.emoji === "string"
  );
}

function isValidRelated(value: unknown): value is VocabularyRelatedWord {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  if (
    !isNonEmptyString(candidate.chinese) ||
    !isNonEmptyString(candidate.pinyin) ||
    !isNonEmptyString(candidate.meaning)
  )
    return false;
  return candidate.register === undefined || typeof candidate.register === "string" || candidate.register === null;
}

const VALID_FREQUENCY_TIERS = new Set<FrequencyTier>([
  "very common",
  "common",
  "less common",
]);

/** Never throws - returns null for anything that doesn't parse cleanly (same convention as reflection-prompt.ts). */
export function parseVocabularyLookupResult(
  raw: string,
): VocabularyLookupResult | null {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const parsed: unknown = JSON.parse(jsonMatch[0]);
    if (!parsed || typeof parsed !== "object") return null;
    const candidate = parsed as Record<string, unknown>;

    const hero = candidate.hero as Record<string, unknown> | undefined;
    if (
      !hero ||
      !isNonEmptyString(hero.emoji) ||
      !isNonEmptyString(hero.title) ||
      !isNonEmptyString(hero.subtitle)
    )
      return null;

    if (
      typeof candidate.frequencyTier !== "string" ||
      !VALID_FREQUENCY_TIERS.has(candidate.frequencyTier as FrequencyTier)
    )
      return null;

    if (!isNonEmptyString(candidate.explanation)) return null;

    if (!Array.isArray(candidate.examples)) return null;
    const examples = candidate.examples.filter(isValidExample);
    if (examples.length === 0) return null;

    const related = Array.isArray(candidate.related)
      ? candidate.related.filter(isValidRelated)
      : [];

    const mistakes =
      typeof candidate.mistakes === "string" && candidate.mistakes.trim()
        ? candidate.mistakes
        : null;
    const chineseGloss =
      typeof candidate.chineseGloss === "string" && candidate.chineseGloss.trim()
        ? candidate.chineseGloss
        : null;
    const curiosity =
      typeof candidate.curiosity === "string" && candidate.curiosity.trim()
        ? candidate.curiosity
        : null;

    return {
      hero: {
        emoji: hero.emoji,
        title: hero.title,
        subtitle: hero.subtitle,
      },
      frequencyTier: candidate.frequencyTier as FrequencyTier,
      explanation: candidate.explanation,
      examples,
      related,
      mistakes,
      chineseGloss,
      curiosity,
    };
  } catch {
    return null;
  }
}
