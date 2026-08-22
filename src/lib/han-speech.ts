import type { HanResponseLanguage } from "@/lib/ai-context";

const PINYIN_TONE_MARK = /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]/iu;
const CHINESE_CHARACTER = /[\u3400-\u9fff]/u;

export interface HanSpeechSegment {
  language: HanResponseLanguage;
  text: string;
}

export function splitSpeechByLanguage(
  text: string,
  responseLanguage: HanResponseLanguage,
): HanSpeechSegment[] {
  if (responseLanguage === "Chinese") {
    return text.trim() ? [{ language: "Chinese", text: text.trim() }] : [];
  }

  const parts = text.split(/([\u3400-\u9fff，。！？、；：”“‘’…]+)/gu);
  const segments: HanSpeechSegment[] = [];

  for (const part of parts) {
    const clean = part.trim();
    if (!clean) continue;
    const language: HanResponseLanguage = CHINESE_CHARACTER.test(clean)
      ? "Chinese"
      : responseLanguage;
    const previous = segments.at(-1);
    if (previous?.language === language) previous.text += ` ${clean}`;
    else segments.push({ language, text: clean });
  }

  return segments;
}

export function segmentSpeechInstructions(
  language: HanResponseLanguage,
): string {
  if (language === "Chinese") {
    return "Speak only the supplied Mandarin Chinese text. Use natural native Mandarin pronunciation, slightly slower than normal conversation, with clear tones. Do not add, translate, or explain anything.";
  }
  if (language === "Spanish") {
    return "Speak only the supplied Spanish text as a native speaker of neutral Latin American Spanish at a normal conversational pace. Use completely natural Latin American rhythm, connected speech, vowels, and varied intonation. Sound confident, spontaneous, warm, and conversational, never like a formal presentation. Start speaking promptly and finish without a long trailing pause. Do not use any foreign accent and do not add anything.";
  }
  return "Speak only the supplied English text as a native speaker of neutral English at a normal conversational pace. Use completely natural English rhythm, connected speech, vowels, and varied intonation. Sound confident, spontaneous, warm, and conversational, never like a formal presentation. Start speaking promptly and finish without a long trailing pause. Do not use any foreign accent and do not add anything.";
}

export function fluidConversationSpeechInstructions(
  language: HanResponseLanguage,
): string {
  if (language === "Spanish") {
    return "Speak in fluent, natural, neutral Latin American Spanish at a normal conversational pace. Sound confident, spontaneous, warm, and engaged, like a cool teacher talking with one student whom you already know. Use natural connected speech and varied intonation, never a presentation voice or a slow instructional cadence. Keep the same native Spanish voice throughout. Pronounce any embedded Chinese characters accurately but smoothly within the sentence, without adding a long pause and without giving the surrounding Spanish a Chinese accent. Do not read pinyin or add words.";
  }
  if (language === "English") {
    return "Speak in fluent, natural, neutral English at a normal conversational pace. Sound confident, spontaneous, warm, and engaged, like a cool teacher talking with one student whom you already know. Use natural connected speech and varied intonation, never a presentation voice or a slow instructional cadence. Keep the same native English voice throughout. Pronounce any embedded Chinese characters accurately but smoothly within the sentence, without adding a long pause and without giving the surrounding English a Chinese accent. Do not read pinyin or add words.";
  }
  return "Speak in fluent, natural native Mandarin at a normal conversational pace. Sound confident, spontaneous, warm, and engaged, like a cool teacher talking with one student. Use varied intonation and connected speech rather than a slow presentation voice. Do not read pinyin or add words.";
}

/**
 * `gapMs` inserts silence between consecutive clips (default 0, unchanged
 * for existing callers e.g. Han's own multi-segment replies, where
 * language-switch segments of one answer should stay tight). Dialogue
 * playback passes a real gap - back-to-back speaker turns with zero pause
 * between them read as an unnaturally abrupt handoff (user feedback,
 * 2026-08-08).
 */
export function mergeWavAudio(wavs: ArrayBuffer[], gapMs = 0): Uint8Array {
  const parsed = wavs.map(parseWav).map(trimWavSilence);
  const first = parsed[0];
  if (!first) throw new Error("No WAV audio to merge");
  if (parsed.some((wav) => !sameBytes(wav.format, first.format))) {
    throw new Error("Incompatible WAV formats");
  }

  const gap = buildSilenceGap(first.format, gapMs);
  const dataLength =
    parsed.reduce((total, wav) => total + wav.data.length, 0) +
    gap.length * Math.max(0, parsed.length - 1);

  const output = new Uint8Array(12 + 8 + first.format.length + 8 + dataLength);
  const view = new DataView(output.buffer);
  writeAscii(output, 0, "RIFF");
  view.setUint32(4, output.length - 8, true);
  writeAscii(output, 8, "WAVE");
  writeAscii(output, 12, "fmt ");
  view.setUint32(16, first.format.length, true);
  output.set(first.format, 20);
  const dataHeader = 20 + first.format.length;
  writeAscii(output, dataHeader, "data");
  view.setUint32(dataHeader + 4, dataLength, true);
  let offset = dataHeader + 8;
  parsed.forEach((wav, index) => {
    output.set(wav.data, offset);
    offset += wav.data.length;
    // Gap bytes are already zero (silence) - Uint8Array is zero-initialized.
    if (index < parsed.length - 1) offset += gap.length;
  });
  return output;
}

/** A zero-filled (silent) buffer of `gapMs` at the given WAV format's rate/depth. */
function buildSilenceGap(format: Uint8Array, gapMs: number): Uint8Array {
  if (gapMs <= 0 || format.length < 16) return new Uint8Array(0);
  const view = new DataView(
    format.buffer,
    format.byteOffset,
    format.byteLength,
  );
  const channels = view.getUint16(2, true);
  const sampleRate = view.getUint32(4, true);
  const bitsPerSample = view.getUint16(14, true);
  const blockAlign = channels * (bitsPerSample / 8);
  const frames = Math.round((sampleRate * gapMs) / 1000);
  return new Uint8Array(frames * blockAlign);
}

function trimWavSilence(wav: { format: Uint8Array; data: Uint8Array }): {
  format: Uint8Array;
  data: Uint8Array;
} {
  if (wav.format.length < 16) return wav;
  const format = new DataView(
    wav.format.buffer,
    wav.format.byteOffset,
    wav.format.byteLength,
  );
  const audioFormat = format.getUint16(0, true);
  const channels = format.getUint16(2, true);
  const sampleRate = format.getUint32(4, true);
  const bitsPerSample = format.getUint16(14, true);
  if (audioFormat !== 1 || bitsPerSample !== 16 || channels < 1) return wav;

  const frameBytes = channels * 2;
  const samples = new DataView(
    wav.data.buffer,
    wav.data.byteOffset,
    wav.data.byteLength,
  );
  const frameCount = Math.floor(wav.data.length / frameBytes);
  const threshold = 280;
  let firstVoiceFrame = -1;
  let lastVoiceFrame = -1;

  for (let frame = 0; frame < frameCount; frame++) {
    let voiced = false;
    for (let channel = 0; channel < channels; channel++) {
      if (
        Math.abs(samples.getInt16(frame * frameBytes + channel * 2, true)) >=
        threshold
      ) {
        voiced = true;
        break;
      }
    }
    if (voiced) {
      if (firstVoiceFrame < 0) firstVoiceFrame = frame;
      lastVoiceFrame = frame;
    }
  }

  if (firstVoiceFrame < 0) return wav;
  const paddingFrames = Math.floor(sampleRate * 0.012);
  const startFrame = Math.max(0, firstVoiceFrame - paddingFrames);
  const endFrame = Math.min(frameCount, lastVoiceFrame + paddingFrames + 1);
  return {
    format: wav.format,
    data: wav.data.slice(startFrame * frameBytes, endFrame * frameBytes),
  };
}

function parseWav(buffer: ArrayBuffer): {
  format: Uint8Array;
  data: Uint8Array;
} {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  if (readAscii(bytes, 0, 4) !== "RIFF" || readAscii(bytes, 8, 4) !== "WAVE") {
    throw new Error("Invalid WAV audio");
  }
  let format: Uint8Array | undefined;
  let data: Uint8Array | undefined;
  for (let offset = 12; offset + 8 <= bytes.length;) {
    const id = readAscii(bytes, offset, 4);
    const size = view.getUint32(offset + 4, true);
    const start = offset + 8;
    if (id === "data" && (size === 0xffffffff || start + size > bytes.length)) {
      data = bytes.slice(start);
      break;
    }
    if (start + size > bytes.length) break;
    if (id === "fmt ") format = bytes.slice(start, start + size);
    if (id === "data") data = bytes.slice(start, start + size);
    offset = start + size + (size % 2);
  }
  if (!format || !data) throw new Error("Incomplete WAV audio");
  return { format, data };
}

function readAscii(bytes: Uint8Array, offset: number, length: number): string {
  return String.fromCharCode(...bytes.slice(offset, offset + length));
}

function writeAscii(bytes: Uint8Array, offset: number, value: string): void {
  for (let index = 0; index < value.length; index++) {
    bytes[offset + index] = value.charCodeAt(index);
  }
}

function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
  return (
    left.length === right.length &&
    left.every((byte, index) => byte === right[index])
  );
}

export function removePinyinForSpeech(text: string): string {
  return text
    .replace(/\(([^()]*)\)/gu, (match, contents: string) =>
      PINYIN_TONE_MARK.test(contents) ? "" : match,
    )
    .split(/\r?\n/u)
    .filter((line) => {
      const plainLine = line.replace(/[*_#>`•-]/gu, "").trim();
      return !(
        plainLine &&
        PINYIN_TONE_MARK.test(plainLine) &&
        !CHINESE_CHARACTER.test(plainLine)
      );
    })
    .join("\n")
    .replace(/[*_#>`•]/gu, "")
    .replace(/[ \t]+$/gmu, "")
    .replace(/\n{3,}/gu, "\n\n")
    .trim();
}

export function selectUsefulOralScript(
  writtenText: string,
  candidateText: string,
): string {
  const written = removePinyinForSpeech(writtenText);
  const candidate = removePinyinForSpeech(candidateText);
  const minimumUsefulLength = Math.min(80, Math.floor(written.length * 0.35));
  return candidate.length >= minimumUsefulLength ? candidate : written;
}

export function oralScriptPrompt(
  responseLanguage: HanResponseLanguage,
  conversational = false,
): string {
  const language =
    responseLanguage === "Spanish"
      ? "natural, neutral Latin American Spanish"
      : responseLanguage === "English"
        ? "natural, neutral English"
        : "natural native Mandarin Chinese";

  return `Turn Han's written teaching response into a separate script meant to be heard aloud.
- Return only the words Han should say. No commentary about your work.
- Speak in ${language}.
- The speaker must sound native in the main response language. Teaching Mandarin must never give the Spanish or English narration a Chinese accent.
- Sound like a friendly, confident, modern teacher having a real conversation: warm and relaxed, but not childish or full of slang.
${conversational ? '- This is a live voice conversation. React naturally before teaching: acknowledge what the learner asked, mention context or nuance when it matters, and connect ideas with everyday phrases instead of sounding like a prepared lesson. Never begin with a textbook formula such as "Para saludar en persona, di..." when a more human opening is possible.\n- Prefer a flow such as: natural reaction; key nuance; first/common option; useful alternative; brief invitation to try it. Do not announce numbered sections.' : ""}
- Make the answer comfortable to hear, but never reduce it to just the Chinese words or a list of examples. Preserve the main answer, the meaning of every distinct Chinese example, the important difference in when each example is used, and the final practice question when present. Trim formatting, repeated pinyin, repeated translations, and secondary detail first.
- NEVER say or include pinyin or any romanized Chinese pronunciation. If the written response shows Chinese characters followed by pinyin, say the Chinese characters once and completely omit the pinyin.
- Do not repeat a Chinese word or sentence merely because its pinyin or translation also appears in the written response.
- Keep essential Chinese characters so the speech model can pronounce them naturally and a little more slowly.
- Usually use 3 to 5 short conversational sentences. If the written answer compares two Chinese expressions, mention both and explain the practical difference between them.
- Example: for a written answer that gives 你好 as the standard in-person greeting and 喂 as a telephone-only greeting, a good Spanish script is: "Para saludar en persona, di 你好. Es el saludo estándar y funciona en casi cualquier situación. Al contestar el teléfono puedes decir 喂, pero solo en ese contexto. ¿Quieres practicar una frase completa?"
${conversational ? '- In live conversation, make that example more natural: "Hola. Pues depende un poco del contexto, porque en mandarín tienes varias opciones. La más común es 你好, que te sirve para saludar en persona casi siempre. Si contestas el teléfono, normalmente dices 喂. ¿Quieres que probemos las dos?"' : ""}
- Do not introduce the script with phrases like "oral version".`;
}

export function speechInstructions(
  responseLanguage: HanResponseLanguage,
): string {
  if (responseLanguage === "Chinese") {
    return "Speak as Han, a friendly, confident, modern Mandarin teacher. Sound relaxed and conversational, not like you are reading a document. Use natural native Mandarin pronunciation at a deliberately slow, clear teaching pace, with short pauses between examples. Do not read pinyin or romanized pronunciation aloud.";
  }

  const proseInstruction =
    responseLanguage === "Spanish"
      ? "Your base voice is a native speaker of neutral Latin American Spanish. Every Spanish word must have completely natural Latin American rhythm, vowels, and intonation, with absolutely no Chinese or foreign accent."
      : "Your base voice is a native speaker of neutral English. Every English word must have completely natural English rhythm, vowels, and intonation, with absolutely no Chinese or foreign accent.";
  return `Speak as Han, a friendly, confident, modern teacher. Sound relaxed and conversational, as if you are talking directly to one student rather than reading a document. ${proseInstruction} Do not imitate the accent of a native Chinese person speaking ${responseLanguage}; Han is fully native in the main language. Only while saying Chinese characters, briefly switch pronunciation to natural Mandarin and use a slightly slower teaching pace. Then return immediately to the native ${responseLanguage} voice. Do not let the Mandarin pronunciation affect the sentence before or after it. Do not read pinyin or romanized pronunciation aloud.`;
}
