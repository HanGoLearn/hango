import type { SttTranscriptionMode } from "@/lib/speech/provider";
import type { AiTeacherContext } from "@/lib/ai-context";

export const HAN_STT_REPEAT_MESSAGE =
  "I couldn't recognize that as Spanish, English, or Mandarin. Please say it again.";

export const MIN_HAN_STT_CONFIDENCE = 0.15;

const MULTILINGUAL_PROMPT =
  "HanGo Mandarin-learning conversation. The learner speaks only Spanish, English, or Standard Mainland Mandarin Chinese (普通话), and may switch between them. Write clearly spoken Mandarin in Simplified Chinese characters, never as an English/Spanish homophone or raw pinyin. Preserve clearly spoken Spanish or English normally. Transcribe only words supported by the audio: never infer a common beginner phrase from silence, background noise, a cough, or an indistinct sound. Never transcribe the speech as Thai or Korean.";

const MANDARIN_PROMPT =
  "简体中文普通话学习练习。只转写音频中清楚说出的普通话，并写成简体汉字；不要用拼音、英语或西班牙语近音词。不要根据静音、背景噪音、咳嗽或模糊声音猜测常见初学者词语，也不要转写成韩语、泰语或其他语言。";

export interface MandarinTranscriptHint {
  hanzi: string;
  pinyin: string;
}

export type TranscriptLogprob = { logprob?: number };

export type HanTranscriptAssessment =
  | { ok: true; transcript: string }
  | {
      ok: false;
      reason: "empty" | "low_confidence" | "unsupported_language";
    };

export function buildHanSttPrompt(
  mode: SttTranscriptionMode,
  vocabulary: readonly string[] = [],
): string {
  const lessonTerms = vocabulary
    .map((term) => term.trim())
    .filter(Boolean)
    .slice(0, 12)
    .join("、")
    .slice(0, 300);

  if (mode === "han-multilingual") {
    return lessonTerms
      ? `${MULTILINGUAL_PROMPT} Possible contextual terms: ${lessonTerms}. Use them only when the acoustic evidence clearly supports them; context is never evidence by itself.`
      : MULTILINGUAL_PROMPT;
  }

  return lessonTerms
    ? `${MANDARIN_PROMPT} 本次练习可能会用到：${lessonTerms}。这些词只用于辅助辨认，不能作为音频中出现了该词的证据。`
    : MANDARIN_PROMPT;
}

export function buildRealtimeSttConfig(
  mode: SttTranscriptionMode,
  vocabulary: readonly string[] = [],
) {
  return {
    model: "gpt-4o-mini-transcribe",
    ...(mode === "mandarin" ? { language: "zh" } : {}),
    prompt: buildHanSttPrompt(mode, vocabulary),
  };
}

export function confidenceFromLogprobs(
  logprobs: readonly TranscriptLogprob[] | null | undefined,
): number | null {
  const values = (logprobs ?? [])
    .map((item) => item.logprob)
    .filter((value): value is number => Number.isFinite(value));
  if (values.length === 0) return null;

  const meanLogprob =
    values.reduce((total, value) => total + value, 0) / values.length;
  return Math.max(0, Math.min(1, Math.exp(meanLogprob)));
}

export function transcriptHintsFromContext(
  context: AiTeacherContext,
): MandarinTranscriptHint[] {
  const hints: MandarinTranscriptHint[] = [];
  if (context.selectedVocabulary) {
    hints.push({
      hanzi: context.selectedVocabulary.chineseForm,
      pinyin: context.selectedVocabulary.pinyin,
    });
  }
  if (context.selectedDialogueLine) {
    hints.push({
      hanzi: context.selectedDialogueLine.chineseText,
      pinyin: context.selectedDialogueLine.pinyin,
    });
  }
  return hints.filter(
    (hint) => hint.hanzi.trim().length > 0 && hint.pinyin.trim().length > 0,
  );
}

export function normalizeHanTranscript(
  transcript: string,
  hints: readonly MandarinTranscriptHint[] = [],
): string {
  let normalized = transcript.trim();

  // Common beginner expressions are frequently rendered as Latin-language
  // homophones. Correct only recognizable Mandarin-learning patterns; keep
  // the learner's surrounding Spanish or English untouched.
  normalized = normalized
    .replace(
      /(?<![\p{Letter}\p{Number}])(?:[aāáǎà]i|ay|ah[ií]|hay|eye)[\s,.;:!?¿¡-]*(?:q[iīíǐì]ng|ching|chin)(?![\p{Letter}\p{Number}])/giu,
      "爱情",
    )
    .replace(
      /(?<![\p{Letter}\p{Number}])(?:ni|n[iǐ])[-\s,]+hao(?![\p{Letter}\p{Number}])/giu,
      "你好",
    )
    .replace(
      /(?<![\p{Letter}\p{Number}])(?:xie|xi[eè])[-\s,]+(?:xie|xi[eè])(?![\p{Letter}\p{Number}])/giu,
      "谢谢",
    );

  // In the reported failure, the first attempt was guessed as "IT" and the
  // clarification as "ahí, chin". Once 爱情 is present, the earlier explicit
  // "word/palabra IT" reference is unambiguously the same learning target.
  if (normalized.includes("爱情")) {
    normalized = normalized.replace(
      /\b(palabra|word)\s+(?:it|i\s*t)\b/giu,
      "$1 爱情",
    );
  }

  for (const hint of hints.slice(0, 8)) {
    normalized = replaceExpectedPinyin(normalized, hint);
  }

  const bareUtterance = normalized
    .toLocaleLowerCase("es")
    .replace(/[.!?¿¡,;:]+$/u, "")
    .trim();

  // A standalone Mandarin "ai" attempt is often guessed as one of these
  // Spanish homophones. Show the intended sinogram so the learner does not
  // mistake the speech recognizer's spelling for pronunciation feedback.
  if (/^(?:[aāáǎà]i|ay|ah[ií]|hay)$/u.test(bareUtterance)) return "爱";

  return normalized;
}

export function assessHanTranscript(
  transcript: string,
  confidence: number | null = null,
  hints: readonly MandarinTranscriptHint[] = [],
): HanTranscriptAssessment {
  const normalized = normalizeHanTranscript(transcript, hints);
  if (!normalized || !/[\p{Letter}\p{Number}]/u.test(normalized)) {
    return { ok: false, reason: "empty" };
  }

  if (confidence !== null && confidence < MIN_HAN_STT_CONFIDENCE) {
    return { ok: false, reason: "low_confidence" };
  }

  for (const character of normalized) {
    if (
      /\p{Letter}/u.test(character) &&
      !/[\p{Script=Latin}\p{Script=Han}]/u.test(character)
    ) {
      return { ok: false, reason: "unsupported_language" };
    }
  }

  return { ok: true, transcript: normalized };
}

function replaceExpectedPinyin(
  transcript: string,
  hint: MandarinTranscriptHint,
): string {
  const hanzi = hint.hanzi.trim();
  const pinyin = hint.pinyin.trim();
  if (!hanzi || !pinyin) return transcript;

  const variants = new Set([pinyin, removePinyinMarks(pinyin)]);
  let result = transcript;
  for (const variant of variants) {
    const pieces = variant
      .split(/[\s'-]+/u)
      .map((piece) => escapeRegExp(piece))
      .filter(Boolean);
    if (pieces.length === 0) continue;

    const source = pieces.join("[\\s,.;:!?¿¡'-]+");
    const pattern = new RegExp(
      `(?<![\\p{Letter}\\p{Number}])${source}(?![\\p{Letter}\\p{Number}])`,
      "giu",
    );
    if (pieces.length > 1) {
      result = result.replace(pattern, hanzi);
      continue;
    }

    const bare = result
      .replace(/[.!?¿¡,;:]+$/u, "")
      .trim()
      .toLocaleLowerCase("es");
    if (bare === variant.toLocaleLowerCase("es")) return hanzi;
  }
  return result;
}

function removePinyinMarks(value: string): string {
  return value.normalize("NFD").replace(/\p{Mark}/gu, "");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
