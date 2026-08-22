/**
 * Real tone-contour scoring, computed entirely client-side from the
 * learner's own recording - no AI call, no tokens spent (project/TASKS.md
 * Speaking Lab redesign, 2026-08-08). Unlike the AI feedback in
 * speaking-feedback.ts (which infers "pronunciation" by reading a Whisper
 * transcript, never the audio itself), this measures the actual pitch
 * contour of the recording and compares its shape against the tone pattern
 * every Mandarin syllable is expected to carry.
 *
 * Everything here is pure and DOM-free so it's unit-testable; the only
 * browser-only step (decoding a recorded Blob into PCM samples) lives in
 * the component that calls extractPitchContourFromSamples.
 */

/** One of Mandarin's 4 tones, or 5 for a neutral/toneless syllable. */
export type ToneNumber = 1 | 2 | 3 | 4 | 5;

const TONE_MARK_TO_BASE_AND_TONE: Record<string, [string, ToneNumber]> = {
  ā: ["a", 1], á: ["a", 2], ǎ: ["a", 3], à: ["a", 4],
  ē: ["e", 1], é: ["e", 2], ě: ["e", 3], è: ["e", 4],
  ī: ["i", 1], í: ["i", 2], ǐ: ["i", 3], ì: ["i", 4],
  ō: ["o", 1], ó: ["o", 2], ǒ: ["o", 3], ò: ["o", 4],
  ū: ["u", 1], ú: ["u", 2], ǔ: ["u", 3], ù: ["u", 4],
  ǖ: ["v", 1], ǘ: ["v", 2], ǚ: ["v", 3], ǜ: ["v", 4],
};

/** A pinyin syllable's tone is the tone borne by its (single) marked vowel; unmarked = neutral (5). */
function syllableTone(syllable: string): ToneNumber {
  for (const char of syllable) {
    const marked = TONE_MARK_TO_BASE_AND_TONE[char];
    if (marked) return marked[1];
  }
  return 5;
}

/** Splits a pinyin string (e.g. "nǐ hǎo" or "xiè xie") into per-syllable tone numbers. */
export function parsePinyinTones(pinyin: string): ToneNumber[] {
  return pinyin
    .trim()
    .split(/\s+/u)
    .filter(Boolean)
    .map(syllableTone);
}

/**
 * Idealized normalized (0-1) pitch shape per tone, 5 points each:
 * tone 1 high-flat, tone 2 rising, tone 3 dipping, tone 4 falling,
 * tone 5 (neutral) short and flat-mid.
 */
const TONE_SHAPES: Record<ToneNumber, number[]> = {
  1: [0.82, 0.85, 0.85, 0.85, 0.82],
  2: [0.25, 0.4, 0.58, 0.78, 0.92],
  3: [0.55, 0.3, 0.15, 0.35, 0.6],
  4: [0.95, 0.8, 0.6, 0.4, 0.22],
  5: [0.5, 0.5, 0.5, 0.5, 0.5],
};

/** Concatenates each syllable's idealized tone shape into one reference contour. */
export function buildReferenceContour(tones: ToneNumber[]): number[] {
  return tones.flatMap((tone) => TONE_SHAPES[tone]);
}

/** Linear-interpolation resample to a fixed number of points, for comparing contours of different lengths. */
export function resampleContour(contour: number[], targetLength: number): number[] {
  if (contour.length === 0 || targetLength <= 0) return [];
  if (contour.length === 1) return new Array<number>(targetLength).fill(contour[0]!);

  const result: number[] = [];
  for (let i = 0; i < targetLength; i++) {
    const position = (i / (targetLength - 1)) * (contour.length - 1);
    const lower = Math.floor(position);
    const upper = Math.min(contour.length - 1, lower + 1);
    const fraction = position - lower;
    result.push(contour[lower]! * (1 - fraction) + contour[upper]! * fraction);
  }
  return result;
}

function normalize(contour: number[]): number[] {
  const min = Math.min(...contour);
  const max = Math.max(...contour);
  const range = max - min;
  if (range < 1e-6) return contour.map(() => 0.5);
  return contour.map((value) => (value - min) / range);
}

/** Pearson correlation between two equal-length series, in [-1, 1]. */
function correlation(a: number[], b: number[]): number {
  const n = a.length;
  const meanA = a.reduce((sum, v) => sum + v, 0) / n;
  const meanB = b.reduce((sum, v) => sum + v, 0) / n;
  let covariance = 0;
  let varianceA = 0;
  let varianceB = 0;
  for (let i = 0; i < n; i++) {
    const da = a[i]! - meanA;
    const db = b[i]! - meanB;
    covariance += da * db;
    varianceA += da * da;
    varianceB += db * db;
  }
  const denominator = Math.sqrt(varianceA * varianceB);
  return denominator < 1e-9 ? 0 : covariance / denominator;
}

const MIN_VOICED_FRAMES = 6;

// A syllable needs at least this many voiced frames (at extractPitchContour-
// FromSamples's ~15ms hop, ~120ms) to plausibly have been spoken at all -
// deliberately low so fast/fluent speech isn't penalized. Without this, a
// short/partial recording (e.g. the learner only said the first few words)
// got its whole voiced contour uniformly time-stretched to cover *every*
// syllable in the prompt, which could make later syllables the learner
// never said line up well enough with the reference shape to score as
// "correct" (bug report, 2026-08-08). Syllables beyond the estimated count
// are left unscored (null → shown neutral, not green or red) instead.
const MIN_VOICED_FRAMES_PER_SYLLABLE = 8;

export interface SyllableScore {
  toneNumber: ToneNumber;
  /** 0-100, or null when there wasn't enough voiced audio for this syllable specifically. */
  score: number | null;
}

const POINTS_PER_SYLLABLE = 5;

/**
 * Scores how well a recorded pitch contour (Hz per frame, 0 for
 * unvoiced/silent frames) matches the tone pattern implied by `pinyin`, one
 * score per syllable - lets the UI shade each character green/red after the
 * learner finishes a recording (Speaking Lab Shadowing redesign,
 * 2026-08-08). Only scores as many *leading* syllables as the recording's
 * voiced duration can plausibly cover (see MIN_VOICED_FRAMES_PER_SYLLABLE);
 * the rest get `score: null` rather than a fabricated match. Within the
 * scored range, this assumes roughly even pacing (the contour is
 * time-stretched to line up with the reference) - an approximation, not
 * forced phonetic alignment.
 */
export function scoreToneMatchPerSyllable(
  pitchHz: number[],
  pinyin: string,
): SyllableScore[] | null {
  const tones = parsePinyinTones(pinyin);
  if (tones.length === 0) return null;

  const voiced = pitchHz.filter((hz) => hz > 0);
  if (voiced.length < MIN_VOICED_FRAMES) return null;

  const estimatedSyllableCount = Math.max(
    1,
    Math.min(
      tones.length,
      Math.floor(voiced.length / MIN_VOICED_FRAMES_PER_SYLLABLE),
    ),
  );
  const scoredTones = tones.slice(0, estimatedSyllableCount);

  const totalPoints = estimatedSyllableCount * POINTS_PER_SYLLABLE;
  const reference = normalize(buildReferenceContour(scoredTones));
  const userContour = normalize(resampleContour(voiced, totalPoints));

  const scored = scoredTones.map((toneNumber, index) => {
    const start = index * POINTS_PER_SYLLABLE;
    const end = start + POINTS_PER_SYLLABLE;
    const match = correlation(
      userContour.slice(start, end),
      reference.slice(start, end),
    );
    return { toneNumber, score: Math.round(Math.max(0, match) * 100) };
  });
  const unscored = tones
    .slice(estimatedSyllableCount)
    .map((toneNumber) => ({ toneNumber, score: null }));

  return [...scored, ...unscored];
}

/**
 * Same idea as scoreToneMatchPerSyllable, but a single overall number -
 * the average of whichever leading syllables actually got scored. Returns
 * null - not a fabricated score - when there isn't enough voiced signal to
 * judge even the first syllable (same "honest 0/null over a guess"
 * principle used in reflection-prompt.ts for text-only evaluation).
 */
export function scoreToneMatch(
  pitchHz: number[],
  pinyin: string,
): number | null {
  const perSyllable = scoreToneMatchPerSyllable(pitchHz, pinyin);
  if (!perSyllable) return null;

  const scores = perSyllable
    .map((syllable) => syllable.score)
    .filter((score): score is number => score !== null);
  if (scores.length === 0) return null;

  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

export interface ShadowingCharacter {
  char: string;
  /** null for punctuation/whitespace - those aren't syllables and never get a tone score. */
  pinyin: string | null;
  isSyllable: boolean;
}

const CHINESE_CHARACTER = /[㐀-鿿]/u;

/**
 * Zips a Chinese text's characters 1:1 with its space-separated pinyin
 * syllables (DialogueLine.pinyin's existing format), skipping punctuation -
 * lets the UI show per-character pinyin and per-character tone-score
 * shading (CharacterToneFeedback) without a forced-alignment step.
 */
export function alignCharactersWithPinyin(
  text: string,
  pinyin: string,
): ShadowingCharacter[] {
  const syllables = pinyin.trim().split(/\s+/u).filter(Boolean);
  let syllableIndex = 0;
  return Array.from(text).map((char) => {
    if (CHINESE_CHARACTER.test(char)) {
      const syllablePinyin = syllables[syllableIndex] ?? null;
      syllableIndex++;
      return { char, pinyin: syllablePinyin, isSyllable: true };
    }
    return { char, pinyin: null, isSyllable: false };
  });
}

const SAMPLE_RATE_FRAME_MS = 40;
const FRAME_HOP_MS = 15;
const MIN_PITCH_HZ = 75;
const MAX_PITCH_HZ = 450;

/**
 * Frame-by-frame fundamental frequency (F0) estimate via autocorrelation -
 * a standard, dependency-free pitch detection technique. Runs on raw PCM
 * samples so it works in tests and in the browser alike; only decoding the
 * recorded audio Blob into `samples` needs the DOM (done by the caller).
 */
export function extractPitchContourFromSamples(
  samples: Float32Array,
  sampleRate: number,
): number[] {
  const frameSize = Math.round((sampleRate * SAMPLE_RATE_FRAME_MS) / 1000);
  const hopSize = Math.round((sampleRate * FRAME_HOP_MS) / 1000);
  const minLag = Math.floor(sampleRate / MAX_PITCH_HZ);
  const maxLag = Math.ceil(sampleRate / MIN_PITCH_HZ);
  const contour: number[] = [];

  for (let start = 0; start + frameSize <= samples.length; start += hopSize) {
    const frame = samples.subarray(start, start + frameSize);

    let energy = 0;
    for (let i = 0; i < frame.length; i++) energy += frame[i]! * frame[i]!;
    if (energy / frame.length < 1e-5) {
      contour.push(0);
      continue;
    }

    let bestLag = -1;
    let bestCorrelation = 0;
    for (let lag = minLag; lag <= maxLag && lag < frame.length; lag++) {
      let sum = 0;
      for (let i = 0; i < frame.length - lag; i++) {
        sum += frame[i]! * frame[i + lag]!;
      }
      if (sum > bestCorrelation) {
        bestCorrelation = sum;
        bestLag = lag;
      }
    }

    contour.push(bestLag > 0 ? sampleRate / bestLag : 0);
  }

  return contour;
}
