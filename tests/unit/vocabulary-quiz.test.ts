import { describe, expect, it } from "vitest";
import {
  buildVocabularyQuizOptions,
  buildFillBlankQuestion,
  buildSentenceOrderQuestion,
  pickOrderExampleIndex,
  seededRandom,
  planVocabularyQuestions,
} from "@/lib/content/vocabulary-quiz";

const items = [
  { id: "1", meaning: "hello", pinyin: "nǐ hǎo", chineseForm: "你好" },
  { id: "2", meaning: "goodbye", pinyin: "zài jiàn", chineseForm: "再见" },
  { id: "3", meaning: "thank you", pinyin: "xiè xiè", chineseForm: "谢谢" },
  { id: "4", meaning: "please", pinyin: "qǐng", chineseForm: "请" },
  { id: "5", meaning: "sorry", pinyin: "duì bù qǐ", chineseForm: "对不起" },
];

describe("buildVocabularyQuizOptions", () => {
  it("includes exactly one correct option, for the current item", () => {
    const options = buildVocabularyQuizOptions(items, "1", "meaning");
    const correct = options.filter((o) => o.isCorrect);
    expect(correct).toHaveLength(1);
    expect(correct[0]!.id).toBe("1");
    expect(correct[0]!.label).toBe("hello");
  });

  it("returns the requested number of options when enough items exist", () => {
    const options = buildVocabularyQuizOptions(items, "1", "meaning", 3);
    expect(options).toHaveLength(3);
  });

  it("never duplicates a label across options", () => {
    const options = buildVocabularyQuizOptions(items, "1", "meaning", 4);
    const labels = options.map((o) => o.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("degrades gracefully when fewer distractors exist than requested", () => {
    const small = items.slice(0, 2); // hello, goodbye
    const options = buildVocabularyQuizOptions(small, "1", "meaning", 3);
    expect(options.length).toBe(2);
    expect(options.some((o) => o.isCorrect)).toBe(true);
  });

  it("returns an empty array if the current item isn't in the list", () => {
    expect(buildVocabularyQuizOptions(items, "missing", "meaning")).toEqual(
      [],
    );
  });

  it("is deterministic given an injected random function", () => {
    const fixedRandom = () => 0; // always picks index 0 while shuffling
    const a = buildVocabularyQuizOptions(items, "1", "meaning", 3, fixedRandom);
    const b = buildVocabularyQuizOptions(items, "1", "meaning", 3, fixedRandom);
    expect(a).toEqual(b);
  });

  it("quizzes pinyin instead of meaning when asked", () => {
    const options = buildVocabularyQuizOptions(items, "1", "pinyin", 3);
    const correct = options.find((o) => o.isCorrect);
    expect(correct?.label).toBe("nǐ hǎo");
    expect(options.every((o) => o.label !== "hello")).toBe(true);
  });

  it("quizzes the character (reverse translation) when asked", () => {
    const options = buildVocabularyQuizOptions(items, "1", "chineseForm", 3);
    const correct = options.find((o) => o.isCorrect);
    expect(correct?.label).toBe("你好");
  });
});

describe("buildFillBlankQuestion", () => {
  it("blanks out the target word's own character in the sentence", () => {
    const question = buildFillBlankQuestion(
      items,
      "1",
      "你好，我叫汉。",
      3,
    );
    expect(question?.sentenceWithBlank).toBe("___，我叫汉。");
  });

  it("includes exactly one correct option matching the blanked word", () => {
    const question = buildFillBlankQuestion(items, "1", "你好，我叫汉。", 3);
    const correct = question?.options.filter((o) => o.isCorrect);
    expect(correct).toHaveLength(1);
    expect(correct?.[0]?.label).toBe("你好");
  });

  it("returns null when the sentence doesn't contain the word's characters", () => {
    expect(
      buildFillBlankQuestion(items, "1", "这句话没有那个词。", 3),
    ).toBeNull();
  });

  it("returns null when the current item isn't in the list", () => {
    expect(
      buildFillBlankQuestion(items, "missing", "你好，我叫汉。", 3),
    ).toBeNull();
  });
});

describe("buildSentenceOrderQuestion", () => {
  it("tokenizes using the lesson's own vocabulary, keeping multi-character words intact", () => {
    const question = buildSentenceOrderQuestion(
      items,
      "3",
      "你好，谢谢你。",
      "Hello, thank you.",
    );
    // Trailing punctuation attaches to the last token rather than its own tile.
    expect(question?.correctOrder).toEqual(["你好", "，", "谢谢", "你。"]);
  });

  it("attaches trailing punctuation to the last token instead of its own tile", () => {
    const question = buildSentenceOrderQuestion(
      items,
      "1",
      "你好，我叫汉。",
      "Hello, my name is Han.",
    );
    expect(question?.correctOrder.at(-1)).toMatch(/。$/);
    expect(question?.correctOrder).not.toContain("。");
  });

  it("falls back to single characters for words outside the lesson's vocabulary", () => {
    const question = buildSentenceOrderQuestion(
      items,
      "1",
      "你好，我叫汉。",
      "Hello, my name is Han.",
    );
    // 我叫汉 has no matching multi-character vocabulary entry, so each
    // character becomes its own token.
    expect(question?.correctOrder).toEqual(
      expect.arrayContaining(["你好", "，", "我", "叫", "汉。"]),
    );
  });

  it("shuffles a copy without mutating the correct order", () => {
    const fixedRandom = () => 0;
    const question = buildSentenceOrderQuestion(
      items,
      "1",
      "你好，我叫汉。",
      "Hello, my name is Han.",
      fixedRandom,
    );
    expect(question?.shuffledTokens.slice().sort()).toEqual(
      question?.correctOrder.slice().sort(),
    );
  });

  it("returns null when the sentence doesn't contain the word's characters", () => {
    expect(
      buildSentenceOrderQuestion(items, "1", "这句话没有那个词。", "No match."),
    ).toBeNull();
  });

  it("returns null when the current item isn't in the list", () => {
    expect(
      buildSentenceOrderQuestion(
        items,
        "missing",
        "你好，我叫汉。",
        "Hello, my name is Han.",
      ),
    ).toBeNull();
  });

  it("returns null when fewer than 3 tokens would result", () => {
    expect(buildSentenceOrderQuestion(items, "1", "你好", "Hello")).toBeNull();
  });
});

describe("pickOrderExampleIndex", () => {
  it("picks the first unclaimed index", () => {
    expect(pickOrderExampleIndex(3, [0])).toBe(1);
  });

  it("skips every claimed index", () => {
    expect(pickOrderExampleIndex(3, [0, 1])).toBe(2);
  });

  it("falls back to 0 when every index is claimed", () => {
    expect(pickOrderExampleIndex(2, [0, 1])).toBe(0);
  });

  it("returns 0 when nothing is claimed", () => {
    expect(pickOrderExampleIndex(3, [])).toBe(0);
  });
});

describe("seededRandom (2026-08-19 hydration-mismatch fix)", () => {
  it("produces the exact same sequence for the same seed - the whole point: server and client compute identical shuffles", () => {
    const sequenceA = Array.from({ length: 10 }, seededRandom("word-1:meaning"));
    const sequenceB = Array.from({ length: 10 }, seededRandom("word-1:meaning"));
    expect(sequenceA).toEqual(sequenceB);
  });

  it("produces a different sequence for a different seed", () => {
    const a = seededRandom("word-1:meaning");
    const b = seededRandom("word-2:meaning");
    const sequenceA = [a(), a(), a()];
    const sequenceB = [b(), b(), b()];
    expect(sequenceA).not.toEqual(sequenceB);
  });

  it("stays within [0, 1), same contract as Math.random", () => {
    const random = seededRandom("any-seed");
    for (let i = 0; i < 100; i++) {
      const value = random();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("shuffling with it is actually deterministic end to end through buildVocabularyQuizOptions", () => {
    const optionsA = buildVocabularyQuizOptions(
      items,
      "1",
      "meaning",
      3,
      seededRandom("1:meaning"),
    );
    const optionsB = buildVocabularyQuizOptions(
      items,
      "1",
      "meaning",
      3,
      seededRandom("1:meaning"),
    );
    expect(optionsA.map((o) => o.id)).toEqual(optionsB.map((o) => o.id));
  });
});

describe("planVocabularyQuestions (2026-08-31, vocabulary rhythm variation)", () => {
  it("is fully deterministic given the same 4 inputs - the property both the walkthrough render and reflection.ts's scoring depend on", () => {
    const a = planVocabularyQuestions("1", "lesson-1", "INTERMEDIATE", 3);
    const b = planVocabularyQuestions("1", "lesson-1", "INTERMEDIATE", 3);
    expect(a).toEqual(b);
  });

  it("produces a different plan for a different lessonId, same word", () => {
    const a = planVocabularyQuestions("1", "lesson-1", "INTERMEDIATE", 3);
    const b = planVocabularyQuestions("1", "lesson-2", "INTERMEDIATE", 3);
    expect(a).not.toEqual(b);
  });

  it("never plans more questions than vocabularyQuestionsPerWord(difficulty) allows", () => {
    for (const difficulty of ["BEGINNER", "INTERMEDIATE", "ADVANCED"]) {
      for (const lessonId of ["a", "b", "c", "d", "e"]) {
        const plan = planVocabularyQuestions("1", lessonId, difficulty, 3);
        // 4/5/6 ceiling by difficulty (points-system.ts's own numbers).
        const ceiling =
          difficulty === "BEGINNER" ? 4 : difficulty === "ADVANCED" ? 6 : 5;
        expect(plan.length).toBeLessThanOrEqual(ceiling);
        expect(plan.length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it("clamps to the real candidate count for a sparse-example word instead of the difficulty ceiling", () => {
    // 0 examples: only meaning + chineseForm are ever viable (no fill-blank,
    // no order) - ADVANCED's nominal ceiling of 6 must never be reached.
    for (const lessonId of ["a", "b", "c", "d", "e", "f", "g", "h"]) {
      const plan = planVocabularyQuestions("1", lessonId, "ADVANCED", 0);
      expect(plan.length).toBeLessThanOrEqual(2);
      expect(plan.every((q) => q.type === "meaning" || q.type === "chineseForm")).toBe(
        true,
      );
    }
  });

  it("never emits a pinyin-type question - retired from the walkthrough on 2026-08-16", () => {
    for (const lessonId of ["a", "b", "c", "d", "e"]) {
      const plan = planVocabularyQuestions("1", lessonId, "ADVANCED", 3);
      expect(plan.every((q) => (q.type as string) !== "pinyin")).toBe(true);
    }
  });

  it("keys match the exact convention the app already records attempts under", () => {
    const plan = planVocabularyQuestions("word-1", "lesson-1", "ADVANCED", 3);
    for (const entry of plan) {
      if (entry.type === "meaning") expect(entry.key).toBe("word-1:meaning");
      if (entry.type === "chineseForm")
        expect(entry.key).toBe("word-1:chineseForm");
      if (entry.type === "blank")
        expect(entry.key).toBe(`word-1:blank:${entry.exampleIndex}`);
      if (entry.type === "order") expect(entry.key).toBe("word-1:order");
    }
  });

  it("always has at least meaning + chineseForm to draw from, even with zero examples", () => {
    // Fill-blank and order both require examples; meaning/chineseForm never
    // do, so a word's candidate pool - and therefore its plan - can never
    // actually be empty through the real code path.
    for (const lessonId of ["a", "b", "c"]) {
      const plan = planVocabularyQuestions("1", lessonId, "BEGINNER", 0);
      expect(plan.length).toBeGreaterThanOrEqual(1);
    }
  });
});
