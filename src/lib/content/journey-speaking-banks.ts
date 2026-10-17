import { JOURNEY_FOUNDATIONS_ADDITIONAL_PLANS } from "./journey-speaking-foundations";
import { JOURNEY_EVERYDAY_BANK_PLANS } from "./journey-speaking-everyday";
import { JOURNEY_ADVANCED_BANK_PLANS } from "./journey-speaking-advanced";

import {
  JOURNEY_BANK_VERSION,
  type BankWord,
  type BankGrammar,
  type JourneyBankLesson,
  type JourneyBankEntry,
  type JourneySpeakingBanks,
} from "./journey-speaking-bank-contract";
export {
  JOURNEY_BANK_VERSION,
  renderJourneySpeakingBanks,
} from "./journey-speaking-bank-contract";
export type {
  BankEvidence,
  BankWord,
  BankGrammar,
  JourneyBankLesson,
  JourneyBankEntry,
  JourneySpeakingBanks,
} from "./journey-speaking-bank-contract";

type Selection = { lessonSlug: string; words: readonly string[] };
export type LessonBankPlan = {
  coreWords: readonly string[];
  coreGrammar: readonly string[];
  optionalWords?: readonly string[];
  optionalGrammar?: readonly string[];
  extension?: readonly Selection[];
  relatedLessons: readonly string[];
  openingLine: string;
  rationale: string;
};

const GREETINGS = "foundations-greetings-and-introductions";
const NUMBERS = "foundations-numbers-time-and-dates";
const COLORS = "basic-shopping-colors-and-simple-items";
const SIZES = "basic-shopping-sizes-and-preferences";
const PRICE = "basic-shopping-asking-the-price";
const RETURNS = "basic-shopping-returning-an-item";

export const JOURNEY_PILOT_BANK_PLANS: Readonly<
  Record<string, LessonBankPlan>
> = {
  [GREETINGS]: {
    coreWords: ["你好", "叫", "名字", "认识", "哪", "国"],
    coreGrammar: ["Subject + 叫 + Name", "Noun/Pronoun + 呢？"],
    relatedLessons: [NUMBERS],
    extension: [{ lessonSlug: NUMBERS, words: ["喝", "咖啡"] }],
    openingLine: "你好。",
    rationale:
      "Names and origin first; occupation is optional and never forced. Meeting for coffee is a learner-led extension, not a compulsory new topic.",
  },
  [NUMBERS]: {
    coreWords: ["现在", "点", "今天", "明天", "号", "想"],
    coreGrammar: [
      "Subject + Time word + Verb Phrase",
      "几 + Measure word (点/号)",
    ],
    relatedLessons: [GREETINGS],
    openingLine: "现在几点？",
    rationale:
      "One time/date or meeting decision at a time; no compulsory recitation of every number, date and time. The day-of-month sense of 号 is not a clothing size.",
  },
  [COLORS]: {
    coreWords: ["买", "件", "颜色", "蓝色", "红色", "试"],
    coreGrammar: [
      "Number + 件 + Clothing item",
      "有没有 + Adjective/Color + 的？",
    ],
    optionalWords: ["流行"],
    relatedLessons: [GREETINGS, NUMBERS, SIZES],
    extension: [{ lessonSlug: SIZES, words: ["合适", "中号"] }],
    openingLine: "你喜欢什么颜色？",
    rationale:
      "Let the shopper choose an item/color and optionally try it; never make their choice for them or force fashion commentary.",
  },
  [SIZES]: {
    coreWords: ["衣服", "小", "大", "中号", "合适", "大小"],
    coreGrammar: ["Adjective + 一点儿"],
    optionalGrammar: ["Verb + 着", "比较 + Adjective"],
    relatedLessons: [GREETINGS, NUMBERS, COLORS, PRICE],
    extension: [{ lessonSlug: PRICE, words: ["多少钱"] }],
    openingLine: "大小合适吗？",
    rationale:
      "Resolve size and fit with simple familiar language before optional preference/aspect patterns; price is a learner-led detour.",
  },
  [PRICE]: {
    coreWords: ["多少钱", "块", "贵", "便宜", "付钱"],
    coreGrammar: ["Item + 多少钱？", "能 + Verb Phrase + 吗？"],
    optionalWords: ["惠顾"],
    relatedLessons: [GREETINGS, NUMBERS, COLORS, SIZES],
    openingLine: "欢迎光临。",
    rationale:
      "Price, optional negotiation and one payment choice. 惠顾 is formal shopkeeper wording, never a required learner production target or a default beginner goodbye.",
  },
  [RETURNS]: {
    coreWords: ["退", "问题", "尺寸", "收据", "退款", "换货"],
    coreGrammar: ["Subject + 想 + Verb Phrase", "大/小 + Number + 号"],
    relatedLessons: [GREETINGS, NUMBERS, COLORS, SIZES, PRICE],
    openingLine: "请问是什么问题？",
    rationale:
      "Understand the actual problem and desired resolution; do not assume a refund/exchange was agreed. Size-number 号 remains distinct from day-of-month 号.",
  },
};

/** Reviewed chapter selections, preserving earlier batches unchanged. */
export const JOURNEY_BANK_PLANS: Readonly<Record<string, LessonBankPlan>> = {
  ...JOURNEY_PILOT_BANK_PLANS,
  ...JOURNEY_FOUNDATIONS_ADDITIONAL_PLANS,
  ...JOURNEY_EVERYDAY_BANK_PLANS,
  ...JOURNEY_ADVANCED_BANK_PLANS,
};

export function journeyBankCandidateSlugs(slug: string): string[] {
  if (!Object.hasOwn(JOURNEY_BANK_PLANS, slug)) return [];
  const plan = JOURNEY_BANK_PLANS[slug];
  if (!plan) return [];
  return [
    ...new Set([
      ...plan.relatedLessons,
      ...(plan.extension ?? []).map((selection) => selection.lessonSlug),
    ]),
  ]
    .filter(
      (candidate) =>
        candidate !== slug && Object.hasOwn(JOURNEY_BANK_PLANS, candidate),
    )
    .slice(0, 8);
}

function entry(
  lesson: JourneyBankLesson,
  item: BankWord | BankGrammar,
): JourneyBankEntry {
  const isWord = "chineseForm" in item;
  return {
    id: item.id,
    lessonId: lesson.id,
    lessonSlug: lesson.slug,
    text: isWord ? item.chineseForm : item.structure,
    meaning: isWord ? item.meaning : item.name,
    ...(isWord ? { pinyin: item.pinyin } : {}),
    evidence: lesson.studiedSteps.includes(isWord ? "VOCABULARY" : "GRAMMAR")
      ? "step-completed-exposure"
      : "not-observed",
    ...(isWord && item.chineseForm === "惠顾" ? { characterOnly: true } : {}),
  };
}

export function buildJourneySpeakingBanks(
  current: JourneyBankLesson,
  availableLessons: readonly JourneyBankLesson[],
): JourneySpeakingBanks | null {
  if (!Object.hasOwn(JOURNEY_BANK_PLANS, current.slug)) return null;
  const plan = JOURNEY_BANK_PLANS[current.slug];
  if (!plan) return null;
  const banks: JourneySpeakingBanks = {
    version: JOURNEY_BANK_VERSION,
    lessonId: current.id,
    lessonSlug: current.slug,
    openingLine: plan.openingLine,
    rationale: plan.rationale,
    core: { vocabulary: [], grammar: [] },
    support: { vocabulary: [], grammar: [] },
    extension: { vocabulary: [], grammar: [] },
    // Reference words do not constitute knowledge or a learner fact.
    phraseBank: current.studiedSteps.includes("DIALOGUE")
      ? [...current.dialoguePhrases].slice(0, 12)
      : [],
    reviewIssues: [],
  };
  const seen = { vocabulary: new Set<string>(), grammar: new Set<string>() };
  for (const word of current.vocabulary.filter(
    (item) => item.status === "PUBLISHED",
  )) {
    const bucket = plan.coreWords.includes(word.chineseForm)
      ? banks.core
      : plan.optionalWords?.includes(word.chineseForm)
        ? banks.extension
        : banks.support;
    if (!seen.vocabulary.has(word.id))
      bucket.vocabulary.push(entry(current, word));
    seen.vocabulary.add(word.id);
  }
  for (const grammar of current.grammar.filter(
    (item) => item.status === "PUBLISHED",
  )) {
    const bucket = plan.coreGrammar.includes(grammar.structure)
      ? banks.core
      : plan.optionalGrammar?.includes(grammar.structure)
        ? banks.extension
        : banks.support;
    if (!seen.grammar.has(grammar.id))
      bucket.grammar.push(entry(current, grammar));
    seen.grammar.add(grammar.id);
  }
  // Missing reviewed core content is visible for audit, never synthesized.
  for (const text of plan.coreWords) {
    if (!banks.core.vocabulary.some((item) => item.text === text))
      banks.reviewIssues.push(`Missing core vocabulary: ${text}`);
  }
  for (const text of plan.coreGrammar) {
    if (!banks.core.grammar.some((item) => item.text === text))
      banks.reviewIssues.push(`Missing core grammar: ${text}`);
  }
  const bySlug = new Map(
    availableLessons.map((lesson) => [lesson.slug, lesson]),
  );
  // Bounded, relevant support only from actual completed content steps. Neither
  // catalogue order, lesson availability, points nor mastery guesses are inputs.
  for (const slug of plan.relatedLessons) {
    const previous = bySlug.get(slug);
    if (!previous || previous.id === current.id) continue;
    const previousPlan = JOURNEY_BANK_PLANS[slug];
    if (!previousPlan) continue;
    if (previous.studiedSteps.includes("VOCABULARY")) {
      for (const word of previous.vocabulary.filter(
        (item) =>
          item.status === "PUBLISHED" &&
          previousPlan.coreWords.includes(item.chineseForm),
      )) {
        if (banks.support.vocabulary.length >= 16) break;
        if (seen.vocabulary.has(word.id)) continue;
        banks.support.vocabulary.push(entry(previous, word));
        seen.vocabulary.add(word.id);
      }
    }
    if (previous.studiedSteps.includes("GRAMMAR")) {
      for (const grammar of previous.grammar.filter(
        (item) =>
          item.status === "PUBLISHED" &&
          !previousPlan.optionalGrammar?.includes(item.structure),
      )) {
        if (banks.support.grammar.length >= 6) break;
        if (seen.grammar.has(grammar.id)) continue;
        banks.support.grammar.push(entry(previous, grammar));
        seen.grammar.add(grammar.id);
      }
    }
  }
  for (const selection of plan.extension ?? []) {
    const source = bySlug.get(selection.lessonSlug);
    if (!source) continue;
    for (const text of selection.words) {
      if (banks.extension.vocabulary.length >= 4) break;
      const word = source.vocabulary.find(
        (item) => item.status === "PUBLISHED" && item.chineseForm === text,
      );
      if (!word || seen.vocabulary.has(word.id)) continue;
      // If already exposed and selected as support, it was excluded above;
      // otherwise preserve its real evidence label, not an invented novelty.
      banks.extension.vocabulary.push(entry(source, word));
      seen.vocabulary.add(word.id);
    }
  }
  return banks;
}
