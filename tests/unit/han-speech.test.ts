import { describe, expect, it } from "vitest";
import {
  fluidConversationSpeechInstructions,
  mergeWavAudio,
  oralScriptPrompt,
  removePinyinForSpeech,
  segmentSpeechInstructions,
  selectUsefulOralScript,
  speechInstructions,
  splitSpeechByLanguage,
} from "@/lib/han-speech";

describe("speechInstructions", () => {
  it("keeps Spanish natural while slowing only Mandarin portions", () => {
    const instructions = speechInstructions("Spanish");
    expect(instructions).toContain(
      "native speaker of neutral Latin American Spanish",
    );
    expect(instructions).toContain("absolutely no Chinese or foreign accent");
    expect(instructions).toContain("Only while saying Chinese characters");
    expect(instructions).toContain(
      "Accent-neutral does not mean emotionally neutral",
    );
    expect(instructions).toContain("audible smile");
    expect(instructions).not.toContain("Mandarin teacher");
  });

  it("uses a slow native Mandarin teaching pace for Chinese replies", () => {
    const instructions = speechInstructions("Chinese");
    expect(instructions).toContain("native Mandarin pronunciation");
    expect(instructions).toContain("clear teaching pace");
  });

  it("creates a shorter conversational oral script without pinyin", () => {
    const prompt = oralScriptPrompt("Spanish");
    expect(prompt).toContain("Latin American Spanish");
    expect(prompt).toContain("never reduce it to just the Chinese words");
    expect(prompt).toContain("NEVER say or include pinyin");
    expect(prompt).toContain("charismatic young-adult tutor");
    expect(prompt).toContain("emotionally responsive");
  });

  it("gives live conversation a natural contextual opening", () => {
    const prompt = oralScriptPrompt("Spanish", true);
    expect(prompt).toContain("live voice conversation");
    expect(prompt).toContain("depende un poco del contexto");
    expect(prompt).toContain("Never begin with a textbook formula");
  });

  it("defines a fluent native Spanish delivery without changing narrator identity", () => {
    const instructions = fluidConversationSpeechInstructions("Spanish");
    expect(instructions).toContain("normal conversational pace");
    expect(instructions).toContain("natural connected speech");
    expect(instructions).toContain("without adding a long pause");
  });

  it("removes parenthetical and standalone pinyin before synthesis", () => {
    const written = `**你好** (nǐ hǎo)\n\nnǐ hǎo\n\nSignifica hola.`;
    expect(removePinyinForSpeech(written)).toBe("你好\n\nSignifica hola.");
  });

  it("isolates Spanish and Mandarin into different speech requests", () => {
    expect(
      splitSpeechByLanguage("Se dice 你好, así de simple.", "Spanish"),
    ).toEqual([
      { language: "Spanish", text: "Se dice" },
      { language: "Chinese", text: "你好" },
      { language: "Spanish", text: ", así de simple." },
    ]);
  });

  it("does not mention Mandarin in instructions for a Spanish segment", () => {
    const instructions = segmentSpeechInstructions("Spanish");
    expect(instructions).toContain("accent-neutral Latin American Spanish");
    expect(instructions).not.toMatch(/Chinese|Mandarin/u);
  });

  it("gives Tutor expressive delivery without changing Companion's existing voice style", () => {
    const tutor = segmentSpeechInstructions("Spanish", "tutor");
    const companion = segmentSpeechInstructions("Spanish", "companion");

    expect(tutor).toContain("Accent-neutral does NOT mean emotionally neutral");
    expect(tutor).toContain("charismatic young-adult tutor");
    expect(tutor).toContain("focused clarity for a correction");
    expect(tutor).toContain("Never sound like an announcer");
    expect(companion).toContain("confident, spontaneous, warm");
    expect(companion).not.toContain("charismatic young-adult tutor");
  });

  it("merges streaming WAV chunks whose data size is unknown", () => {
    const makeStreamingWav = (sample: number): ArrayBuffer => {
      const bytes = new Uint8Array(46);
      const view = new DataView(bytes.buffer);
      bytes.set(
        [..."RIFF"].map((letter) => letter.charCodeAt(0)),
        0,
      );
      view.setUint32(4, 0xffffffff, true);
      bytes.set(
        [..."WAVEfmt "].map((letter) => letter.charCodeAt(0)),
        8,
      );
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 1, true);
      view.setUint32(24, 24000, true);
      view.setUint32(28, 48000, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      bytes.set(
        [..."data"].map((letter) => letter.charCodeAt(0)),
        36,
      );
      view.setUint32(40, 0xffffffff, true);
      view.setInt16(44, sample, true);
      return bytes.buffer;
    };

    const merged = mergeWavAudio([makeStreamingWav(10), makeStreamingWav(20)]);
    const view = new DataView(merged.buffer);
    expect(view.getUint32(40, true)).toBe(4);
    expect(view.getInt16(44, true)).toBe(10);
    expect(view.getInt16(46, true)).toBe(20);
  });

  it("inserts a silence gap of the requested duration between clips", () => {
    const sampleRate = 8000;
    const makeFixedWav = (dataBytes: number): ArrayBuffer => {
      const buffer = new Uint8Array(44 + dataBytes);
      const view = new DataView(buffer.buffer);
      buffer.set(
        [..."RIFF"].map((c) => c.charCodeAt(0)),
        0,
      );
      view.setUint32(4, 36 + dataBytes, true);
      buffer.set(
        [..."WAVEfmt "].map((c) => c.charCodeAt(0)),
        8,
      );
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 1, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      buffer.set(
        [..."data"].map((c) => c.charCodeAt(0)),
        36,
      );
      view.setUint32(40, dataBytes, true);
      buffer.fill(50, 44); // non-silent, so trimWavSilence keeps it whole
      return buffer.buffer;
    };

    const noGap = mergeWavAudio([makeFixedWav(200), makeFixedWav(200)]);
    expect(new DataView(noGap.buffer).getUint32(40, true)).toBe(400);

    const withGap = mergeWavAudio([makeFixedWav(200), makeFixedWav(200)], 250);
    // 250ms at 8000Hz, 16-bit mono = 2000 frames * 2 bytes = 4000 silent bytes.
    expect(new DataView(withGap.buffer).getUint32(40, true)).toBe(
      200 + 200 + 4000,
    );
  });

  it("rejects an oral rewrite that drops most of the teaching content", () => {
    const written =
      "你好 significa hola y es el saludo estándar para hablar en persona. 喂 se usa únicamente al contestar el teléfono. ¿Quieres practicar una frase completa?";
    expect(selectUsefulOralScript(written, "Hola. 你好. 喂.")).toBe(written);
  });
});
