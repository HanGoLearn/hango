import { describe, expect, it } from "vitest";
import {
  analyzeHanPronunciationRhythm,
  classifyHanPronunciationRequestLength,
  extractHanPronunciationTarget,
  isPronunciationDetailRequest,
  sanitizeHanPronunciationAttempt,
} from "@/lib/speech/han-pronunciation";

describe("Han Tutor pronunciation coaching", () => {
  it("extracts the single target only when Han explicitly asks for repetition", () => {
    expect(
      extractHanPronunciationTarget(
        "El objetivo es:\n你好 (nǐ hǎo)\nRepítelo una vez.",
      ),
    ).toEqual({ hanzi: "你好", pinyin: "nǐ hǎo" });

    expect(
      extractHanPronunciationTarget(
        "你好 (nǐ hǎo) significa hola. Es una expresión muy común.",
      ),
    ).toBeNull();
  });

  it("classifies short, medium, and long pronunciation requests", () => {
    expect(classifyHanPronunciationRequestLength("Pronuncia 你好")).toBe(
      "short",
    );
    expect(
      classifyHanPronunciationRequestLength("Pronuncia 我明天想去看电影"),
    ).toBe("medium");
    expect(
      classifyHanPronunciationRequestLength(
        "Pronuncia 我明天想和朋友一起去电影院看一部新的中文电影",
      ),
    ).toBe("long");
  });

  it("extracts a medium phrase with rhythm separators", () => {
    expect(
      extractHanPronunciationTarget(
        "我明天想去看电影 (wǒ míng tiān xiǎng | qù kàn diàn yǐng)\nRepítelo una vez.",
      ),
    ).toEqual({
      hanzi: "我明天想去看电影",
      pinyin: "wǒ míng tiān xiǎng qù kàn diàn yǐng",
    });
  });

  it("selects the current safe chunk instead of scoring a whole long phrase", () => {
    expect(
      extractHanPronunciationTarget(
        [
          "我明天想和朋友一起去电影院看一部新的中文电影 (wǒ míng tiān xiǎng hé péng you yì qǐ qù diàn yǐng yuàn kàn yí bù xīn de zhōng wén diàn yǐng)",
          "Primero practica:",
          "我明天想 (wǒ míng tiān xiǎng)",
          "Repítelo una vez.",
        ].join("\n"),
      ),
    ).toEqual({ hanzi: "我明天想", pinyin: "wǒ míng tiān xiǎng" });

    expect(
      extractHanPronunciationTarget(
        "我明天想和朋友一起去电影院看一部新的中文电影 (wǒ míng tiān xiǎng hé péng you yì qǐ qù diàn yǐng yuàn kàn yí bù xīn de zhōng wén diàn yǐng)\nRepítelo.",
      ),
    ).toBeNull();
  });

  it("recognizes acceptance of Han's optional detailed explanation", () => {
    expect(
      isPronunciationDetailRequest("Sí, explícame por qué cambia el tono."),
    ).toBe(true);
    expect(isPronunciationDetailRequest("Why does the tone change?")).toBe(
      true,
    );
    expect(
      isPronunciationDetailRequest("Explícame en profundidad la gramática 把"),
    ).toBe(false);
  });

  it("reports only a conservative long-pause rhythm observation", () => {
    const evidence = analyzeHanPronunciationRhythm(
      [
        ...new Array<number>(10).fill(180),
        ...new Array<number>(45).fill(0),
        ...new Array<number>(10).fill(190),
      ],
      1.4,
      2,
    );

    expect(evidence.observation).toBe("long_pause");
    expect(evidence.longestInternalPauseMs).toBe(675);
    expect(evidence.syllablesPerSecond).toBe(1.43);
  });

  it("sanitizes browser evidence before it reaches a prompt", () => {
    const evidence = sanitizeHanPronunciationAttempt({
      targetHanzi: "你好",
      targetPinyin: "nǐ hǎo",
      attempt: 99,
      overallToneScore: 180,
      syllables: [{ pinyin: "nǐ", toneNumber: 2, score: -8 }],
      rhythm: {
        durationSeconds: 999,
        syllablesPerSecond: 999,
        longestInternalPauseMs: 999999,
        observation: "invented",
        confidence: "high",
      },
    });

    expect(evidence).toMatchObject({
      attempt: 4,
      overallToneScore: 100,
      syllables: [{ pinyin: "nǐ", toneNumber: 2, score: 0 }],
      rhythm: {
        durationSeconds: 60,
        syllablesPerSecond: 20,
        longestInternalPauseMs: 60_000,
        observation: "insufficient",
        confidence: "limited",
      },
    });
  });
});
