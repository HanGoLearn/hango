/**
 * Han's Dashboard tip - a small rotating fact about Mandarin (grammar,
 * characters, tones, culture), attributed to the mascot for warmth
 * ("acompañado de aprendizaje", 2026-08-21 design brief). Static content,
 * no database read - the Dashboard is intentionally query-frugal, and a
 * daily rotation needs nothing more than the current date.
 */
export interface HanTip {
  id: string;
  text: string;
}

export const HAN_TIPS: HanTip[] = [
  {
    id: "measure-words-default",
    text: "Nouns need a measure word before a number in Mandarin — 一个人 (yí gè rén), not 一人. When you're unsure which one, 个 (gè) is the safest default.",
  },
  {
    id: "tone-minimal-pairs",
    text: "Same sound, four different words: 妈 (mā, mother), 麻 (má, hemp), 马 (mǎ, horse), 骂 (mà, to scold). Tones aren't decoration — they're part of the word.",
  },
  {
    id: "no-verb-conjugation",
    text: "Mandarin verbs never conjugate. 我吃, 你吃, 他吃 all use the same 吃 (chī) — tense comes from context or time words like 昨天 (yesterday), not the verb itself.",
  },
  {
    id: "hao-etymology",
    text: "好 (hǎo, \"good\") combines 女 (woman) and 子 (child) — many characters are built by pairing two simpler characters for meaning or sound.",
  },
  {
    id: "le-not-past-tense",
    text: "了 (le) is one of the trickiest words to place — it doesn't mean \"past tense.\" It marks a completed action or a change of state.",
  },
  {
    id: "third-tone-sandhi",
    text: "你好 is written with two third tones but spoken as ní hǎo, not nǐ hǎo — when two third tones meet, the first one rises to a second tone.",
  },
  {
    id: "ta-homophones",
    text: "他 (he), 她 (she), and 它 (it) are all pronounced tā — spoken Mandarin doesn't distinguish gender here at all, only the written characters do.",
  },
  {
    id: "number-construction",
    text: "Numbers above 10 are built logically, not memorized: 十一 (11) is \"ten-one,\" 二十 (20) is \"two-ten,\" 三十五 (35) is \"three-ten-five.\"",
  },
  {
    id: "qingwen-polite-opener",
    text: "请问 (qǐngwèn, \"may I ask\") is how you politely open a question to a stranger — the closest Mandarin equivalent to \"excuse me.\"",
  },
  {
    id: "water-radical",
    text: "Characters sharing the 氵radical (a compressed 水, \"water\") usually relate to liquids: 河 (river), 海 (sea), 汗 (sweat).",
  },
  {
    id: "no-articles",
    text: "Mandarin has no words for \"a\" or \"the.\" 猫 alone can mean \"a cat,\" \"the cat,\" or \"cats\" — context carries the meaning English puts in articles.",
  },
  {
    id: "ma-question-particle",
    text: "Adding 吗 (ma) to the end of any statement turns it into a yes/no question: 你是学生 (you're a student) becomes 你是学生吗? (are you a student?).",
  },
  {
    id: "ye-dou-before-verb",
    text: "也 (yě, \"also\") and 都 (dōu, \"all/both\") always sit before the verb in Mandarin, not after it like their English equivalents.",
  },
  {
    id: "number-four-taboo",
    text: "四 (sì, \"four\") sounds close to 死 (sǐ, \"death\"), so it's avoided in many Chinese-speaking contexts — some buildings skip a 4th floor entirely.",
  },
  {
    id: "chi-le-ma-greeting",
    text: "你吃了吗? (\"have you eaten?\") is often just a casual greeting between friends, not a real question about your last meal.",
  },
  {
    id: "yixia-softener",
    text: "Adding 一下 (yíxià) softens a request — 等一下 (\"wait a moment\") reads gentler than the bare command 等 (\"wait\").",
  },
  {
    id: "xie-radical",
    text: "The 讠radical (a compressed 言, \"speech\") marks characters about talking: 说 (speak), 谢 (thank), 请 (invite/please).",
  },
  {
    id: "svo-word-order",
    text: "Basic Mandarin word order is closer to English than you'd expect: Subject-Verb-Object. 我喜欢猫 is literally \"I like cats,\" in that order.",
  },
];

/** Deterministic day index, not day-of-year, so leap years and timezones can't skip or repeat a day. */
function daysSinceEpoch(date: Date): number {
  return Math.floor(date.getTime() / 86_400_000);
}

/** Same calendar day always returns the same tip - a page reload shouldn't shuffle it mid-visit. */
export function getDailyHanTip(date: Date = new Date()): HanTip {
  const index = daysSinceEpoch(date) % HAN_TIPS.length;
  // HAN_TIPS is a non-empty compile-time literal - index is always in
  // bounds, but TS's noUncheckedIndexedAccess can't know that statically.
  return HAN_TIPS[index]!;
}
