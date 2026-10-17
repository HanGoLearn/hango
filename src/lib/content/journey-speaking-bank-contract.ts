/** Shared voice contract only: no catalogue, database or user-state query. */
export const JOURNEY_BANK_VERSION = "advanced-2026-10-11-v4";

export type BankEvidence = "step-completed-exposure" | "not-observed";
export type BankWord = {
  id: string;
  chineseForm: string;
  pinyin: string;
  meaning: string;
  status: string;
};
export type BankGrammar = {
  id: string;
  name: string;
  structure: string;
  status: string;
};
export type JourneyBankLesson = {
  id: string;
  slug: string;
  vocabulary: readonly BankWord[];
  grammar: readonly BankGrammar[];
  dialoguePhrases: readonly string[];
  studiedSteps: readonly string[];
};
export type JourneyBankEntry = {
  id: string;
  lessonId: string;
  lessonSlug: string;
  text: string;
  /** Exact record meaning/name: do not merge homographs or literal patterns. */
  meaning: string;
  pinyin?: string;
  evidence: BankEvidence;
  characterOnly?: boolean;
};
type BankBucket = {
  vocabulary: JourneyBankEntry[];
  grammar: JourneyBankEntry[];
};
export type JourneySpeakingBanks = {
  version: typeof JOURNEY_BANK_VERSION;
  lessonId: string;
  lessonSlug: string;
  openingLine: string;
  rationale: string;
  core: BankBucket;
  support: BankBucket;
  extension: BankBucket;
  /** Current dialogue is a familiar phrase bank, not a mandatory script. */
  phraseBank: string[];
  reviewIssues: string[];
};

export function renderJourneySpeakingBanks(
  banks: JourneySpeakingBanks,
): string {
  const render = (bucket: BankBucket) =>
    JSON.stringify({
      words: bucket.vocabulary.map(
        ({ text, meaning, evidence, characterOnly }) => ({
          text,
          meaning,
          evidence,
          ...(characterOnly ? { characterOnly: true } : {}),
        }),
      ),
      patterns: bucket.grammar.map(({ text, meaning, evidence }) => ({
        text,
        meaning,
        evidence,
      })),
    });
  return [
    `SERVER-RESOLVED JOURNEY BANKS (${banks.version}) for ${banks.lessonSlug}.`,
    `CORE — communicative priorities, NOT a required quota: ${render(banks.core)}.`,
    `SUPPORT — current support and related previously exposed records: ${render(banks.support)}.`,
    `OPTIONAL EXTENSION — not a new assignment: ${render(banks.extension)}.`,
    `Scene focus: ${banks.rationale}`,
    "Exposure means only that this user's relevant content step was completed. NOT proof of comprehension, independent production or mastery. not-observed items must not be described as previously learned. Never attribute a studied dialogue character's name, possessions or choices to this learner.",
    "Default to core and support. Use an extension only when the learner requests it, introduces that theme, or several appropriate exchanges demonstrate comprehension; never after just one copied advanced sentence or a higher points total. A characterOnly expression is never required learner production. At most one necessary unfamiliar expression per turn, not one every turn. No extension or new target during preparing-close or goodbye.",
    banks.phraseBank.length
      ? `Previously exposed current dialogue phrases, for recombination only: ${JSON.stringify(banks.phraseBank)}. Never replay this as a script.`
      : "Current dialogue exposure is not recorded; do not assume the learner studied its phrases.",
    "These banks are dialogue scaffolding only; they do not change scores, mastery, saved progress or the existing Reflection vocabulary denominator.",
  ].join(" ");
}
