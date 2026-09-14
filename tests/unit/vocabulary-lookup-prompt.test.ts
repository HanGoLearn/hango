import { describe, expect, it } from "vitest";
import {
  buildVocabularyLookupPrompt,
  parseVocabularyLookupResult,
} from "@/lib/vocabulary-lookup-prompt";

describe("buildVocabularyLookupPrompt", () => {
  it("includes the learner's input and real HSK level", () => {
    const prompt = buildVocabularyLookupPrompt("要", 4, "English");
    expect(prompt).toContain("要");
    expect(prompt).toContain("HSK 4");
  });

  it("keeps every learner-facing result field in the interface language at every level", () => {
    for (const level of [0, 1, 3, 6, 9]) {
      const prompt = buildVocabularyLookupPrompt("要", level, "Spanish");
      expect(prompt).toContain(
        "ALL learner-facing prose is ALWAYS written in Spanish",
      );
      expect(prompt).toContain("every examples[].translation");
      expect(prompt).toContain("every related[].meaning");
      expect(prompt).toContain("mistakes, and curiosity");
      expect(prompt).toContain(
        "Never use English learner-facing prose when the requested language is Spanish",
      );
    }
  });

  it("gives level 0 the simplest, jargon-free instruction and no related words", () => {
    const prompt = buildVocabularyLookupPrompt("你好", 0, "English");
    expect(prompt).toContain("never studied Chinese before");
    expect(prompt).toContain('Do not include "related" words at all');
  });

  it("suppresses mistakes below level 2 and includes them from level 2 up", () => {
    const level0 = buildVocabularyLookupPrompt("要", 0, "English");
    const level1 = buildVocabularyLookupPrompt("要", 1, "English");
    const level2 = buildVocabularyLookupPrompt("要", 2, "English");
    expect(level0).toContain('Set "mistakes" to null');
    expect(level1).toContain('Set "mistakes" to null');
    expect(level2).toContain("Include one real, specific common mistake");
  });

  it("requires vocabulary genuinely typical of the level throughout examples from HSK5 up", () => {
    const level4 = buildVocabularyLookupPrompt("要", 4, "English");
    const level5 = buildVocabularyLookupPrompt("要", 5, "English");
    expect(level4).not.toContain("CRITICAL for this level");
    expect(level5).toContain("CRITICAL for this level");
    expect(level5).toContain(
      "vocabulary genuinely typical of HSK 5 throughout the WHOLE sentence",
    );
  });

  it("allows chengyu only from level 7 up", () => {
    const level6 = buildVocabularyLookupPrompt("要", 6, "English");
    const level7 = buildVocabularyLookupPrompt("要", 7, "English");
    expect(level6).not.toContain("chengyu");
    expect(level7).toContain("chengyu");
  });

  it("makes chineseGloss null below 7, optional at 7, and mandatory from 8", () => {
    const level6 = buildVocabularyLookupPrompt("要", 6, "English");
    const level7 = buildVocabularyLookupPrompt("要", 7, "English");
    const level8 = buildVocabularyLookupPrompt("要", 8, "English");
    expect(level6).toContain('Set "chineseGloss" to null');
    expect(level7).toContain('Include "chineseGloss" as an optional bonus');
    expect(level8).toContain('Always include "chineseGloss"');
  });

  it("asks for frequencyTier as a broad judgment, never a precise rank", () => {
    const prompt = buildVocabularyLookupPrompt("要", 5, "English");
    expect(prompt).toContain('"frequencyTier"');
    expect(prompt).toContain("never state or imply an exact number or rank");
  });

  it("never invents a curiosity just to fill the field", () => {
    const prompt = buildVocabularyLookupPrompt("要", 5, "English");
    expect(prompt).toContain('"curiosity"');
    expect(prompt).toContain(
      "Never invent or force one just to fill the field",
    );
  });

  it("asks for a JSON object shaped with all the vocabulary result fields", () => {
    const prompt = buildVocabularyLookupPrompt("要", 5, "English");
    expect(prompt).toContain('"hero"');
    expect(prompt).toContain('"frequencyTier"');
    expect(prompt).toContain('"explanation"');
    expect(prompt).toContain('"examples"');
    expect(prompt).toContain('"related"');
    expect(prompt).toContain('"mistakes"');
    expect(prompt).toContain('"chineseGloss"');
    expect(prompt).toContain('"curiosity"');
  });
});

describe("parseVocabularyLookupResult", () => {
  const validJson = JSON.stringify({
    hero: { emoji: "🈶", title: "要", subtitle: "yào — to want / need" },
    frequencyTier: "very common",
    explanation: "Used to say you want or need something.",
    examples: [
      {
        emoji: "☕",
        chinese: "我要一杯咖啡。",
        pinyin: "Wǒ yào yì bēi kāfēi.",
        translation: "I want a cup of coffee.",
      },
    ],
    related: [
      { chinese: "想", pinyin: "xiǎng", meaning: "would like to" },
    ],
    mistakes: null,
    chineseGloss: null,
    curiosity: null,
  });

  it("parses a well-formed response", () => {
    const result = parseVocabularyLookupResult(validJson);
    expect(result).toEqual({
      hero: { emoji: "🈶", title: "要", subtitle: "yào — to want / need" },
      frequencyTier: "very common",
      explanation: "Used to say you want or need something.",
      examples: [
        {
          emoji: "☕",
          chinese: "我要一杯咖啡。",
          pinyin: "Wǒ yào yì bēi kāfēi.",
          translation: "I want a cup of coffee.",
        },
      ],
      related: [{ chinese: "想", pinyin: "xiǎng", meaning: "would like to" }],
      mistakes: null,
      chineseGloss: null,
      curiosity: null,
    });
  });

  it("returns null, not throwing, for garbled output", () => {
    expect(parseVocabularyLookupResult("not json at all")).toBeNull();
    expect(parseVocabularyLookupResult("")).toBeNull();
    expect(parseVocabularyLookupResult("{ not valid json")).toBeNull();
  });

  it("returns null when hero is missing or incomplete", () => {
    const parsed = JSON.parse(validJson);
    const missingHero = { ...parsed, hero: { emoji: "🈶", title: "要" } };
    expect(parseVocabularyLookupResult(JSON.stringify(missingHero))).toBeNull();
  });

  it("returns null for an invalid frequencyTier", () => {
    const parsed = JSON.parse(validJson);
    const badTier = { ...parsed, frequencyTier: "extremely common" };
    expect(parseVocabularyLookupResult(JSON.stringify(badTier))).toBeNull();
  });

  it("returns null when examples is missing or empty", () => {
    const parsed = JSON.parse(validJson);
    expect(
      parseVocabularyLookupResult(JSON.stringify({ ...parsed, examples: [] })),
    ).toBeNull();
    const { examples: _examples, ...withoutExamples } = parsed;
    expect(
      parseVocabularyLookupResult(JSON.stringify(withoutExamples)),
    ).toBeNull();
  });

  it("defaults related to an empty array when absent", () => {
    const parsed = JSON.parse(validJson);
    const { related: _related, ...withoutRelated } = parsed;
    const result = parseVocabularyLookupResult(JSON.stringify(withoutRelated));
    expect(result?.related).toEqual([]);
  });

  it("treats blank optional strings as null, not empty strings", () => {
    const parsed = JSON.parse(validJson);
    const blank = {
      ...parsed,
      mistakes: "   ",
      chineseGloss: "",
      curiosity: "   ",
    };
    const result = parseVocabularyLookupResult(JSON.stringify(blank));
    expect(result?.mistakes).toBeNull();
    expect(result?.chineseGloss).toBeNull();
    expect(result?.curiosity).toBeNull();
  });

  it("keeps populated mistakes/chineseGloss/curiosity fields", () => {
    const parsed = JSON.parse(validJson);
    const populated = {
      ...parsed,
      mistakes: "Learners often confuse 要 with 想.",
      chineseGloss: "表示需要或希望得到某物。",
      curiosity: "要 is written with 西 (west) over 女 (woman).",
    };
    const result = parseVocabularyLookupResult(JSON.stringify(populated));
    expect(result?.mistakes).toBe("Learners often confuse 要 with 想.");
    expect(result?.chineseGloss).toBe("表示需要或希望得到某物。");
    expect(result?.curiosity).toBe(
      "要 is written with 西 (west) over 女 (woman).",
    );
  });
});
