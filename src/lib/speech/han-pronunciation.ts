import type { SyllableScore, ToneNumber } from "@/lib/tone-analysis";

export interface HanPronunciationTarget {
  hanzi: string;
  pinyin: string;
}

export type HanPronunciationRequestLength =
  "unknown" | "short" | "medium" | "long";

export interface HanPronunciationSyllableEvidence {
  pinyin: string;
  toneNumber: ToneNumber;
  score: number | null;
}

export interface HanPronunciationRhythmEvidence {
  durationSeconds: number;
  syllablesPerSecond: number | null;
  longestInternalPauseMs: number | null;
  observation: "insufficient" | "single_syllable" | "connected" | "long_pause";
  confidence: "limited" | "useful";
}

/**
 * Ephemeral evidence from Han Tutor's small hold-to-talk recorder. It is
 * coaching support, never a grade or progress record: the existing F0 engine
 * has no forced phonetic alignment and cannot prove initials/finals by itself.
 */
export interface HanPronunciationAttemptEvidence {
  targetHanzi: string;
  targetPinyin: string;
  attempt: number;
  overallToneScore: number | null;
  syllables: HanPronunciationSyllableEvidence[];
  rhythm: HanPronunciationRhythmEvidence;
}

const PRACTICE_CUE =
  /\b(?:repeat|try|say|pronounce|again|repite|repítelo|repítela|repita|intenta|inténtalo|di|dilo|pronuncia|otra vez)\b|(?:再说|再试|跟我|试着说|读一遍|再来一次)/iu;
const PINYIN_SYLLABLE = /^[a-züvāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜêếềê̌ệńňǹḿm̀]+[1-5]?$/iu;

export function isExplicitPronunciationRequest(message?: string): boolean {
  if (!message?.trim()) return false;
  return /(?:pronunciaci[oó]n|pronuncia|pronunciar|tonos?|s[ií]labas?|ritmo|c[oó]mo\s+(?:se\s+)?pronuncia|how\s+(?:do\s+(?:i|you)\s+)?pronounce|pronunciation|tones?|syllables?|rhythm|发音|声调|音节|语调)/iu.test(
    message,
  );
}

/**
 * A learner can accept Han's optional "why does the tone change?" offer
 * without starting the short listen-first drill again. Keep this narrower
 * than the general pronunciation detector so grammar explanations are never
 * pulled into pronunciation mode.
 */
export function isPronunciationDetailRequest(message?: string): boolean {
  if (!message?.trim()) return false;
  return /(?:por\s+qu[eé]\s+cambia(?:\s+el\s+tono)?|expl[ií]ca(?:me)?\s+(?:con\s+)?(?:m[aá]s\s+detalle|por\s+qu[eé].*(?:tono|pronunciaci[oó]n|cambia))|explicaci[oó]n\s+(?:completa|detallada).*(?:tono|pronunciaci[oó]n)|why\s+(?:does\s+)?(?:the\s+)?tone\s+change|explain\s+(?:in\s+)?(?:more\s+detail|why).*(?:tone|pronunciation|change)|为什么.*(?:变调|声调)|详细.*(?:发音|声调|变调))/iu.test(
    message,
  );
}

export function classifyHanPronunciationRequestLength(
  message?: string,
): HanPronunciationRequestLength {
  if (!message?.trim()) return "unknown";
  const syllableCount = chineseSyllableCount(message);
  if (syllableCount === 0) return "unknown";
  if (syllableCount <= 4) return "short";
  if (syllableCount <= 12) return "medium";
  return "long";
}

function chineseSyllableCount(value: string): number {
  return (value.match(/\p{Script=Han}/gu) ?? []).length;
}

function pinyinTokens(value: string, expectedCount: number): string[] | null {
  const tokens = value
    .replace(/[()[\]{}“”"'`，。！？、:：;；|/／]/gu, " ")
    .trim()
    .split(/\s+/u)
    .filter(Boolean);
  if (
    tokens.length !== expectedCount ||
    tokens.some((token) => !PINYIN_SYLLABLE.test(token))
  )
    return null;
  return tokens;
}

const MAX_DISPLAY_TARGET_SYLLABLES = 48;
const MAX_LOCAL_ANALYSIS_SYLLABLES = 12;

function normalizeHanziTarget(value: string): string {
  return value
    .trim()
    .replace(/^[，。！？、；：\s]+|[，。！？、；：\s]+$/gu, "")
    .replace(/\s+/gu, " ");
}

function targetCandidatesFromLines(lines: string[]): HanPronunciationTarget[] {
  const candidates: HanPronunciationTarget[] = [];

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]!;
    const fragments = [line, ...line.split(/[：:]/u).slice(1)];

    for (const fragment of fragments) {
      const inlinePattern =
        /([\p{Script=Han}](?:[\p{Script=Han}\s，。！？、；：]{0,94}?[\p{Script=Han}])?)\s*\(([^)]+)\)/gu;
      for (const match of fragment.matchAll(inlinePattern)) {
        const hanzi = normalizeHanziTarget(match[1] ?? "");
        const count = chineseSyllableCount(hanzi);
        if (count < 1 || count > MAX_DISPLAY_TARGET_SYLLABLES) continue;
        const tokens = pinyinTokens(match[2] ?? "", count);
        if (tokens) candidates.push({ hanzi, pinyin: tokens.join(" ") });
      }
    }

    const hanziLine = normalizeHanziTarget(
      line
        .split(/[：:]/u)
        .at(-1)
        ?.match(
          /[\p{Script=Han}][\p{Script=Han}\s，。！？、；：]{0,94}/u,
        )?.[0] ?? "",
    );
    const count = chineseSyllableCount(hanziLine);
    if (count < 1 || count > MAX_DISPLAY_TARGET_SYLLABLES) continue;
    const nextLine = lines[index + 1];
    const nextTokens = nextLine ? pinyinTokens(nextLine, count) : null;
    if (nextTokens) {
      candidates.push({ hanzi: hanziLine, pinyin: nextTokens.join(" ") });
    }
  }

  return candidates;
}

/**
 * Finds the latest explicit target Han wrote as `汉字 (hàn zì)` before asking
 * for a repetition. Requiring both the practice cue and 1:1 syllable count
 * prevents an ordinary explanation containing Chinese examples from silently
 * turning the next voice message into a pronunciation test.
 */
export function extractHanPronunciationTarget(
  assistantMessage?: string,
): HanPronunciationTarget | null {
  if (!assistantMessage || !PRACTICE_CUE.test(assistantMessage)) return null;

  const lines = assistantMessage
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);

  const candidates = targetCandidatesFromLines(lines);
  return (
    [...candidates]
      .reverse()
      .find(
        (candidate) =>
          chineseSyllableCount(candidate.hanzi) <= MAX_LOCAL_ANALYSIS_SYLLABLES,
      ) ?? null
  );
}

const PITCH_FRAME_HOP_MS = 15;

export function analyzeHanPronunciationRhythm(
  pitchHz: number[],
  durationSeconds: number,
  syllableCount: number,
): HanPronunciationRhythmEvidence {
  const voicedIndexes = pitchHz
    .map((hz, index) => (hz > 0 ? index : -1))
    .filter((index) => index >= 0);
  const roundedDuration = Math.round(Math.max(0, durationSeconds) * 100) / 100;
  if (voicedIndexes.length < 6 || syllableCount <= 0) {
    return {
      durationSeconds: roundedDuration,
      syllablesPerSecond: null,
      longestInternalPauseMs: null,
      observation: "insufficient",
      confidence: "limited",
    };
  }

  const first = voicedIndexes[0]!;
  const last = voicedIndexes.at(-1)!;
  let longestGapFrames = 0;
  let currentGapFrames = 0;
  for (let index = first; index <= last; index++) {
    if ((pitchHz[index] ?? 0) > 0) {
      longestGapFrames = Math.max(longestGapFrames, currentGapFrames);
      currentGapFrames = 0;
    } else {
      currentGapFrames += 1;
    }
  }
  const longestInternalPauseMs = longestGapFrames * PITCH_FRAME_HOP_MS;
  const syllablesPerSecond =
    roundedDuration > 0
      ? Math.round((syllableCount / roundedDuration) * 100) / 100
      : null;
  const useful = voicedIndexes.length >= syllableCount * 8;

  return {
    durationSeconds: roundedDuration,
    syllablesPerSecond,
    longestInternalPauseMs,
    observation:
      syllableCount === 1
        ? "single_syllable"
        : longestInternalPauseMs >= 600
          ? "long_pause"
          : "connected",
    confidence: useful ? "useful" : "limited",
  };
}

export function combineHanPronunciationEvidence(
  target: HanPronunciationTarget,
  overallToneScore: number | null,
  scores: SyllableScore[] | null,
  rhythm: HanPronunciationRhythmEvidence,
): HanPronunciationAttemptEvidence {
  const pinyin = target.pinyin.split(/\s+/u).filter(Boolean);
  return {
    targetHanzi: target.hanzi,
    targetPinyin: target.pinyin,
    attempt: 1,
    overallToneScore,
    syllables: (scores ?? []).map((syllable, index) => ({
      pinyin: pinyin[index] ?? "",
      toneNumber: syllable.toneNumber,
      score: syllable.score,
    })),
    rhythm,
  };
}

function clampNullableScore(value: unknown): number | null {
  if (value === null) return null;
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.round(Math.max(0, Math.min(100, value)));
}

/** Treat all browser evidence as untrusted and keep only the bounded shape. */
export function sanitizeHanPronunciationAttempt(
  value: unknown,
): HanPronunciationAttemptEvidence | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.targetHanzi !== "string" ||
    !/\p{Script=Han}/u.test(candidate.targetHanzi) ||
    typeof candidate.targetPinyin !== "string" ||
    candidate.targetHanzi.length > 24 ||
    candidate.targetPinyin.length > 120
  )
    return null;

  const attemptValue =
    typeof candidate.attempt === "number" && Number.isFinite(candidate.attempt)
      ? Math.round(candidate.attempt)
      : 1;
  const rawSyllables = Array.isArray(candidate.syllables)
    ? candidate.syllables.slice(0, 24)
    : [];
  const syllables: HanPronunciationSyllableEvidence[] = [];
  for (const item of rawSyllables) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    if (
      typeof row.pinyin !== "string" ||
      row.pinyin.length > 24 ||
      (row.toneNumber !== 1 &&
        row.toneNumber !== 2 &&
        row.toneNumber !== 3 &&
        row.toneNumber !== 4 &&
        row.toneNumber !== 5)
    )
      continue;
    syllables.push({
      pinyin: row.pinyin,
      toneNumber: row.toneNumber,
      score: clampNullableScore(row.score),
    });
  }

  const rawRhythm =
    candidate.rhythm && typeof candidate.rhythm === "object"
      ? (candidate.rhythm as Record<string, unknown>)
      : {};
  const observation = rawRhythm.observation;
  const safeObservation =
    observation === "single_syllable" ||
    observation === "connected" ||
    observation === "long_pause"
      ? observation
      : "insufficient";
  const finiteOrNull = (input: unknown, maximum: number): number | null =>
    typeof input === "number" && Number.isFinite(input)
      ? Math.max(0, Math.min(maximum, input))
      : null;

  return {
    targetHanzi: candidate.targetHanzi.trim(),
    targetPinyin: candidate.targetPinyin.trim(),
    attempt: Math.max(1, Math.min(4, attemptValue)),
    overallToneScore: clampNullableScore(candidate.overallToneScore),
    syllables,
    rhythm: {
      durationSeconds: finiteOrNull(rawRhythm.durationSeconds, 60) ?? 0,
      syllablesPerSecond: finiteOrNull(rawRhythm.syllablesPerSecond, 20),
      longestInternalPauseMs: finiteOrNull(
        rawRhythm.longestInternalPauseMs,
        60_000,
      ),
      observation: safeObservation,
      confidence: rawRhythm.confidence === "useful" ? "useful" : "limited",
    },
  };
}
