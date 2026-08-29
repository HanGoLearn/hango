import type { SttTranscriptionMode } from "@/lib/speech/provider";
import type { AiTeacherContext } from "@/lib/ai-context";

export const HAN_STT_REPEAT_MESSAGE =
  "I couldn't recognize that as Spanish, English, or Mandarin. Please say it again.";

export const MIN_HAN_STT_CONFIDENCE = 0.15;

const MULTILINGUAL_PROMPT =
  "HanGo Mandarin-learning conversation. The learner speaks only Spanish, English, or Standard Mainland Mandarin Chinese (普通话), and may switch languages inside one sentence. A Spanish or English carrier sentence may quote, ask about, or practice a Mandarin word. Write every clearly spoken Mandarin fragment in Simplified Chinese characters, even when the rest of that same sentence is Spanish or English; never render that Mandarin fragment as an English/Spanish homophone or raw pinyin. Preserve clearly spoken Spanish or English normally. Transcribe only words supported by the audio: never infer a common beginner phrase from silence, background noise, a cough, or an indistinct sound. Never transcribe the speech as Thai or Korean.";

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
  for (const vocabulary of context.lessonVocabulary ?? []) {
    hints.push({ hanzi: vocabulary.chineseForm, pinyin: vocabulary.pinyin });
  }
  return hints
    .filter(
      (hint) => hint.hanzi.trim().length > 0 && hint.pinyin.trim().length > 0,
    )
    .filter(
      (hint, index, all) =>
        all.findIndex(
          (candidate) =>
            candidate.hanzi === hint.hanzi && candidate.pinyin === hint.pinyin,
        ) === index,
    )
    .slice(0, 12);
}

export function normalizeHanTranscript(
  transcript: string,
  hints: readonly MandarinTranscriptHint[] = [],
): string {
  let normalized = transcript.trim();
  const discussesMandarin =
    /(?:diferencia|compar|palabra|pronunci|decir|dice|digo|practic|mandar[ií]n|chino|difference|compare|word|pronounc|say|saying|practice|mandarin|chinese)/iu.test(
      normalized,
    );

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

  if (discussesMandarin) {
    // Spanish-biased STT commonly hears yìbiān...yìbiān... as
    // "y bien, y bien". Restrict this repair to an explicit Mandarin or
    // comparison question so ordinary Spanish "bien" remains untouched.
    normalized = normalized.replace(
      /(?<![\p{Letter}\p{Number}])(?:yi|y|i)[-\s]+bi[ae]n\s*[,;]?\s*(?:yi|y|i)[-\s]+bi[ae]n(?![\p{Letter}\p{Number}])/giu,
      "一边…一边…",
    );

    // Exact field regression: the final isolated 着 (zhe) disappeared into
    // the Spanish carrier phrase "y el otro es" after the first grammar
    // pattern. Recover it only in this narrow comparison shape.
    if (normalized.includes("一边…一边…")) {
      normalized = normalized.replace(
        /\s+y\s+el\s+otro\s+es\s*[.]?$/iu,
        " y 着?",
      );
    }
  }

  // In the reported failure, the first attempt was guessed as "IT" and the
  // clarification as "ahí, chin". Once 爱情 is present, the earlier explicit
  // "word/palabra IT" reference is unambiguously the same learning target.
  if (normalized.includes("爱情")) {
    normalized = normalized.replace(
      /\b(palabra|word)\s+(?:it|i\s*t)\b/giu,
      "$1 爱情",
    );
  }

  const plainSingleSyllableCounts = new Map<string, number>();
  for (const hint of hints.slice(0, 12)) {
    const pieces = hint.pinyin.trim().split(/[\s'-]+/u).filter(Boolean);
    if (pieces.length !== 1) continue;
    const plain = removePinyinMarks(pieces[0]!).toLocaleLowerCase("es");
    plainSingleSyllableCounts.set(
      plain,
      (plainSingleSyllableCounts.get(plain) ?? 0) + 1,
    );
  }
  for (const hint of hints.slice(0, 12)) {
    normalized = replaceExpectedPinyin(
      normalized,
      hint,
      plainSingleSyllableCounts,
    );
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

/**
 * Role-play Speaking is Mandarin immersion. Its recognizer is already pinned
 * to `zh`, but an acoustically ambiguous result can still occasionally arrive
 * as Spanish/English text. Reject that result instead of showing it as if the
 * learner had spoken another language. Han's general side-panel chat keeps
 * using the multilingual assessment above.
 */
export function assessMandarinRolePlayTranscript(
  transcript: string,
  confidence: number | null = null,
  hints: readonly MandarinTranscriptHint[] = [],
): HanTranscriptAssessment {
  const assessment = assessHanTranscript(transcript, confidence, hints);
  if (!assessment.ok) return assessment;

  if (
    !/\p{Script=Han}/u.test(assessment.transcript) ||
    /\p{Script=Latin}/u.test(assessment.transcript)
  ) {
    return { ok: false, reason: "unsupported_language" };
  }

  return assessment;
}

function replaceExpectedPinyin(
  transcript: string,
  hint: MandarinTranscriptHint,
  plainSingleSyllableCounts: ReadonlyMap<string, number>,
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
    const isUnmarkedSingleSyllable =
      pieces.length === 1 && variant === removePinyinMarks(pinyin);
    if (
      isUnmarkedSingleSyllable &&
      (plainSingleSyllableCounts.get(variant.toLocaleLowerCase("es")) ?? 0) > 1
    ) {
      continue;
    }

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

    // A one-syllable pinyin spelling is too ambiguous to replace globally
    // (for example, "mai" could be ordinary Latin-language text). Replace
    // it inside a longer sentence only when the nearby words explicitly say
    // the learner is quoting or practising Chinese.
    const learningCue =
      /(?:palabra|pronunci|decir|dice|digo|practic|mandar[ií]n|chino|word|pronounc|say|saying|practice|mandarin|chinese)/iu;
    result = result.replace(pattern, (match, offset: number, whole: string) => {
      const before = whole.slice(Math.max(0, offset - 60), offset);
      const after = whole.slice(offset + match.length, offset + match.length + 60);
      return learningCue.test(before) || learningCue.test(after) ? hanzi : match;
    });
  }
  return result;
}

function removePinyinMarks(value: string): string {
  return value.normalize("NFD").replace(/\p{Mark}/gu, "");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
