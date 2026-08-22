export interface VocabularyQuizItem {
  id: string;
  meaning: string;
  pinyin: string;
  chineseForm: string;
}

export interface VocabularyQuizOption {
  id: string;
  label: string;
  isCorrect: boolean;
}

export type VocabularyQuizField = "meaning" | "pinyin" | "chineseForm";

/**
 * Deterministic seeded PRNG (splitmix32-style hash + mulberry32 mix) - pass
 * this instead of the default `Math.random` to any `build*Question` below
 * when the result renders during SSR. Plain `Math.random()` produces a
 * different shuffle order on the server than during the client's hydration
 * pass, which was causing a real, reproducible hydration mismatch (2026-08-19
 * - React discarding and regenerating the whole Vocabulary Step tree every
 * time a quiz question rendered). The same seed always produces the same
 * shuffle, so server and client agree; different seeds (e.g. per word,
 * per question) still look independently shuffled.
 */
export function seededRandom(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

/**
 * Builds a multiple-choice question from the lesson's own vocabulary list —
 * no AI call, so no token cost (user request, 2026-08-10: the redesigned
 * Vocabulary step needed checks between words, but generating them via AI
 * per word per learner would be needless spend for something this
 * mechanical). `field` picks what's being quizzed: the word's meaning
 * ("what does this mean?"), its pinyin ("which pinyin matches?"), or its
 * characters ("which word means...?" — a reverse-translation question,
 * added 2026-08-11 for the Intermediate/Advanced tiers, harder because it
 * asks the learner to produce the character from the English gloss rather
 * than just recognize it). Distractors are other words in the same lesson
 * with a different value for that field, so there's never a
 * duplicate-looking option.
 */
export function buildVocabularyQuizOptions(
  allItems: VocabularyQuizItem[],
  currentItemId: string,
  field: VocabularyQuizField,
  optionCount = 3,
  random: () => number = Math.random,
): VocabularyQuizOption[] {
  const current = allItems.find((item) => item.id === currentItemId);
  if (!current) return [];

  const currentLabel = current[field];
  const distractorPool = allItems.filter(
    (item) => item.id !== currentItemId && item[field] !== currentLabel,
  );
  const shuffledPool = shuffle(distractorPool, random);
  const distractors = shuffledPool.slice(0, Math.max(optionCount - 1, 0));

  const options: VocabularyQuizOption[] = [
    { id: current.id, label: currentLabel, isCorrect: true },
    ...distractors.map((item) => ({
      id: item.id,
      label: item[field],
      isCorrect: false,
    })),
  ];

  return shuffle(options, random);
}

export interface VocabularyFillBlankQuestion {
  sentenceWithBlank: string;
  options: VocabularyQuizOption[];
}

/**
 * Builds a "complete the sentence" question from one of the word's own
 * example sentences (Intermediate/Advanced tiers, 2026-08-11 — a harder
 * check than plain meaning/pinyin recognition since it tests the word in
 * context). The target word's first occurrence in `exampleText` is blanked
 * out; options are other lesson words' characters. Still zero AI cost —
 * the example sentence is real content authored ahead of time, this
 * function only rearranges it.
 */
export function buildFillBlankQuestion(
  allItems: VocabularyQuizItem[],
  currentItemId: string,
  exampleText: string,
  optionCount = 3,
  random: () => number = Math.random,
): VocabularyFillBlankQuestion | null {
  const current = allItems.find((item) => item.id === currentItemId);
  if (!current) return null;
  if (!exampleText.includes(current.chineseForm)) return null;

  const sentenceWithBlank = exampleText.replace(current.chineseForm, "___");
  const options = buildVocabularyQuizOptions(
    allItems,
    currentItemId,
    "chineseForm",
    optionCount,
    random,
  );
  if (options.length < 2) return null;

  return { sentenceWithBlank, options };
}

export interface VocabularySentenceOrderQuestion {
  translation: string;
  correctOrder: string[];
  shuffledTokens: string[];
}

/**
 * Builds a "put the sentence in order" question from one of the word's own
 * example sentences (2026-08-16, replacing the pinyin-recognition question —
 * user feedback that 3 of Vocabulary's 4 questions tested the same
 * character<->meaning/sound association back to back, with no question
 * requiring the learner to actually construct anything). Same zero-AI-cost
 * philosophy as buildFillBlankQuestion: the sentence is real authored
 * content, this only tokenizes and shuffles it. Reuses the lesson's own
 * vocabulary as a tiny segmentation dictionary (greedy longest-match, single
 * characters as a fallback) — good enough for the short, controlled
 * sentences this app authors, without needing a full Chinese
 * word-segmentation library.
 */
export function buildSentenceOrderQuestion(
  allItems: VocabularyQuizItem[],
  currentItemId: string,
  exampleText: string,
  exampleTranslation: string,
  random: () => number = Math.random,
): VocabularySentenceOrderQuestion | null {
  const current = allItems.find((item) => item.id === currentItemId);
  if (!current) return null;
  if (!exampleText.includes(current.chineseForm)) return null;

  const tokens = tokenizeWithDictionary(
    exampleText,
    allItems.map((item) => item.chineseForm),
  );
  if (tokens.length < 3) return null;

  return {
    translation: exampleTranslation,
    correctOrder: tokens,
    shuffledTokens: shuffle(tokens, random),
  };
}

const SENTENCE_FINAL_PUNCTUATION = /[。！？，,.!?]+$/u;

/**
 * Greedy longest-match tokenizer against a known-word dictionary, falling
 * back to one character at a time for anything not in it. Trailing
 * punctuation is stripped before tokenizing and reattached to the last
 * token, so it never appears as its own draggable tile.
 */
function tokenizeWithDictionary(text: string, knownWords: string[]): string[] {
  const trailingPunctuation = text.match(SENTENCE_FINAL_PUNCTUATION)?.[0] ?? "";
  const body = trailingPunctuation
    ? text.slice(0, -trailingPunctuation.length)
    : text;
  const dictionary = [...new Set(knownWords)]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  const tokens: string[] = [];
  let position = 0;
  while (position < body.length) {
    const match = dictionary.find((word) => body.startsWith(word, position));
    if (match) {
      tokens.push(match);
      position += match.length;
    } else {
      tokens.push(body[position]!);
      position += 1;
    }
  }

  if (trailingPunctuation && tokens.length > 0) {
    tokens[tokens.length - 1] += trailingPunctuation;
  }
  return tokens;
}

/**
 * Which example index to use for the sentence-order question, avoiding the
 * indices already claimed by fill-blank so the two questions never quiz the
 * exact same sentence when more than one example is available.
 */
export function pickOrderExampleIndex(
  exampleCount: number,
  claimedIndices: number[],
): number {
  const claimed = new Set(claimedIndices);
  for (let index = 0; index < exampleCount; index++) {
    if (!claimed.has(index)) return index;
  }
  return 0;
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}
