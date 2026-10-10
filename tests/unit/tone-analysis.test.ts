import { describe, expect, it } from "vitest";
import {
  parsePinyinTones,
  applyBasicThirdToneSandhi,
  buildReferenceContour,
  resampleContour,
  scoreToneMatch,
  scoreToneMatchPerSyllable,
  alignCharactersWithPinyin,
  extractPitchContourFromSamples,
  type ToneNumber,
} from "@/lib/tone-analysis";

describe("parsePinyinTones", () => {
  it("reads the tone number from each syllable's marked vowel", () => {
    expect(parsePinyinTones("nǐ hǎo")).toEqual([3, 3]);
    expect(parsePinyinTones("xiè xie")).toEqual([4, 5]);
    expect(parsePinyinTones("māma")).toEqual([1]);
  });

  it("treats an unmarked syllable as neutral tone (5)", () => {
    expect(parsePinyinTones("ma")).toEqual([5]);
  });

  it("returns an empty array for empty input", () => {
    expect(parsePinyinTones("")).toEqual([]);
  });
});

describe("applyBasicThirdToneSandhi", () => {
  it("scores the first of two adjacent third tones as its rising surface tone", () => {
    expect(applyBasicThirdToneSandhi([3, 3])).toEqual([2, 3]);
    expect(applyBasicThirdToneSandhi([1, 3, 4])).toEqual([1, 3, 4]);
  });
});

describe("buildReferenceContour", () => {
  it("produces one 5-point shape per syllable", () => {
    expect(buildReferenceContour([1, 2])).toHaveLength(10);
  });

  it("gives tone 2 a rising shape and tone 4 a falling shape", () => {
    const rising = buildReferenceContour([2]);
    const falling = buildReferenceContour([4]);
    expect(rising.at(-1)!).toBeGreaterThan(rising[0]!);
    expect(falling.at(-1)!).toBeLessThan(falling[0]!);
  });
});

describe("resampleContour", () => {
  it("preserves endpoints and stretches to the target length", () => {
    const result = resampleContour([0, 1], 5);
    expect(result).toHaveLength(5);
    expect(result[0]).toBeCloseTo(0);
    expect(result.at(-1)!).toBeCloseTo(1);
  });

  it("handles a single-point contour by repeating it", () => {
    expect(resampleContour([0.7], 3)).toEqual([0.7, 0.7, 0.7]);
  });
});

// Real recordings (via extractPitchContourFromSamples, ~15ms hop) produce
// far more than 5 frames per syllable; tests upsample each syllable's ideal
// 5-point shape to this many frames so they exercise the same
// enough-voiced-audio-per-syllable gating real audio does.
const FRAMES_PER_TEST_SYLLABLE = 20;

function syllableContourAsHz(toneNumber: ToneNumber): number[] {
  const shape = resampleContour(
    buildReferenceContour([toneNumber]),
    FRAMES_PER_TEST_SYLLABLE,
  );
  return shape.map((v) => 100 + v * 150);
}

describe("scoreToneMatch", () => {
  it("scores a pitch contour shaped exactly like the reference near 100", () => {
    const asHz = [...syllableContourAsHz(3), ...syllableContourAsHz(3)];
    expect(scoreToneMatch(asHz, "nǐ hǎo")).toBeGreaterThanOrEqual(95);
  });

  it("scores a badly mismatched contour low", () => {
    // "mā" expects a flat-high shape; feeding it a falling contour instead should score poorly.
    expect(scoreToneMatch(syllableContourAsHz(4), "mā")).toBeLessThan(50);
  });

  it("returns null instead of a fabricated score when there isn't enough voiced signal", () => {
    expect(scoreToneMatch([0, 0, 0, 0], "nǐ hǎo")).toBeNull();
    expect(scoreToneMatch([120, 130], "nǐ hǎo")).toBeNull();
  });

  it("returns null for an empty pinyin prompt", () => {
    expect(scoreToneMatch([120, 130, 140, 150, 160, 170], "")).toBeNull();
  });
});

describe("scoreToneMatchPerSyllable", () => {
  it("scores each syllable independently, matching some and missing others", () => {
    // First syllable matches "mā" (tone 1, flat-high); second is fed the shape of tone 4 (falling) but labeled tone 2 (rising) in the pinyin.
    const asHz = [...syllableContourAsHz(1), ...syllableContourAsHz(4)];

    const scores = scoreToneMatchPerSyllable(asHz, "mā má");
    expect(scores).toHaveLength(2);
    expect(scores![0]!.toneNumber).toBe(1);
    expect(scores![0]!.score).toBeGreaterThanOrEqual(90);
    expect(scores![1]!.toneNumber).toBe(2);
    expect(scores![1]!.score).toBeLessThan(50);
  });

  it("returns null when there isn't enough voiced signal", () => {
    expect(scoreToneMatchPerSyllable([0, 0, 0], "nǐ hǎo")).toBeNull();
  });

  it("leaves syllables the learner never said unscored instead of marking them correct (bug report, 2026-08-08)", () => {
    // A 6-syllable prompt, but the recording only has ~16 voiced frames -
    // barely enough for 2 syllables at 8 frames/syllable (e.g. the learner
    // said just a couple of words and then stopped).
    const asHz = resampleContour(buildReferenceContour([1, 3]), 16).map(
      (v) => 100 + v * 150,
    );
    const scores = scoreToneMatchPerSyllable(asHz, "mā mā mā mā mā mā");

    expect(scores).toHaveLength(6);
    expect(scores![0]!.score).not.toBeNull();
    expect(scores![1]!.score).not.toBeNull();
    for (const unattempted of scores!.slice(2)) {
      expect(unattempted.score).toBeNull();
    }
  });

  it("caps the estimated syllable count at the prompt's own length even with a lot of voiced audio", () => {
    const asHz = Array<number>(200).fill(180); // a long, flat, very voiced recording
    const scores = scoreToneMatchPerSyllable(asHz, "mā mā");
    expect(scores).toHaveLength(2);
  });
});

describe("alignCharactersWithPinyin", () => {
  it("zips each Chinese character with its pinyin syllable", () => {
    const result = alignCharactersWithPinyin("你好", "nǐ hǎo");
    expect(result).toEqual([
      { char: "你", pinyin: "nǐ", isSyllable: true },
      { char: "好", pinyin: "hǎo", isSyllable: true },
    ]);
  });

  it("passes punctuation through without a pinyin syllable and without consuming one", () => {
    const result = alignCharactersWithPinyin(
      "你好！你好吗？",
      "nǐ hǎo nǐ hǎo ma",
    );
    expect(result.filter((c) => c.isSyllable)).toHaveLength(5);
    expect(result.find((c) => c.char === "！")).toEqual({
      char: "！",
      pinyin: null,
      isSyllable: false,
    });
  });
});

describe("extractPitchContourFromSamples", () => {
  function sineWave(
    frequencyHz: number,
    sampleRate: number,
    durationSeconds: number,
  ): Float32Array {
    const length = Math.round(sampleRate * durationSeconds);
    const samples = new Float32Array(length);
    for (let i = 0; i < length; i++) {
      samples[i] = Math.sin((2 * Math.PI * frequencyHz * i) / sampleRate);
    }
    return samples;
  }

  it("detects the fundamental frequency of a pure tone within a small margin", () => {
    const sampleRate = 16000;
    const samples = sineWave(150, sampleRate, 0.3);
    const contour = extractPitchContourFromSamples(samples, sampleRate);
    const voiced = contour.filter((hz) => hz > 0);
    expect(voiced.length).toBeGreaterThan(0);
    const average = voiced.reduce((sum, v) => sum + v, 0) / voiced.length;
    expect(average).toBeGreaterThan(140);
    expect(average).toBeLessThan(160);
  });

  it("reports silence as unvoiced (0) frames", () => {
    const sampleRate = 16000;
    const silence = new Float32Array(Math.round(sampleRate * 0.2));
    const contour = extractPitchContourFromSamples(silence, sampleRate);
    expect(contour.every((hz) => hz === 0)).toBe(true);
  });
});
