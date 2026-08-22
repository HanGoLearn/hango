import type { TtsProvider, TtsResult } from "@/lib/tts/provider";

/**
 * Used whenever no TTS provider key is configured (src/lib/tts/index.ts) -
 * no network calls, so dialogue-audio flows are fully exercisable without
 * an API key. Returns a short real (silent) WAV file so `<audio>` playback
 * doesn't error, rather than throwing.
 */
export class MockTtsProvider implements TtsProvider {
  readonly name = "mock";

  async synthesize(
    _text: string,
    _voice: string,
    _instructions?: string,
  ): Promise<TtsResult> {
    void _text;
    void _voice;
    void _instructions;
    await new Promise((resolve) => setTimeout(resolve, 300));

    return {
      audio: buildSilentWav(),
      contentType: "audio/wav",
      provider: this.name,
      model: "mock-tts-v1",
    };
  }
}

function buildSilentWav(): Buffer {
  const sampleRate = 8000;
  const durationSeconds = 0.3;
  const sampleCount = Math.round(sampleRate * durationSeconds);
  const dataLength = sampleCount * 2; // 16-bit mono
  const buffer = Buffer.alloc(44 + dataLength);

  buffer.write("RIFF", 0, "ascii");
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write("WAVE", 8, "ascii");
  buffer.write("fmt ", 12, "ascii");
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28); // byte rate
  buffer.writeUInt16LE(2, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample
  buffer.write("data", 36, "ascii");
  buffer.writeUInt32LE(dataLength, 40);
  // Remaining bytes are already zeroed by Buffer.alloc — silence.

  return buffer;
}
