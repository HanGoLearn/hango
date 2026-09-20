import { describe, expect, it } from "vitest";
import {
  LearnerAudioValidationError,
  validateLearnerAudio,
} from "@/lib/media-validation";

function pcmWav(
  options: {
    durationSeconds?: number;
    sampleRate?: number;
    channels?: number;
  } = {},
): Buffer {
  const durationSeconds = options.durationSeconds ?? 0.25;
  const sampleRate = options.sampleRate ?? 16_000;
  const channels = options.channels ?? 1;
  const bitsPerSample = 16;
  const dataBytes = Math.floor(
    durationSeconds * sampleRate * channels * (bitsPerSample / 8),
  );
  const buffer = Buffer.alloc(44 + dataBytes);
  buffer.write("RIFF", 0, "ascii");
  buffer.writeUInt32LE(36 + dataBytes, 4);
  buffer.write("WAVE", 8, "ascii");
  buffer.write("fmt ", 12, "ascii");
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * channels * 2, 28);
  buffer.writeUInt16LE(channels * 2, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write("data", 36, "ascii");
  buffer.writeUInt32LE(dataBytes, 40);
  return buffer;
}

describe("learner audio validation", () => {
  it("derives duration, sample rate, channels, and canonical format from decoded audio", async () => {
    const result = await validateLearnerAudio(pcmWav(), "audio/x-wav", {
      maxBytes: 1_000_000,
      maxDurationSeconds: 5,
    });

    expect(result.mimeType).toBe("audio/wav");
    expect(result.extension).toBe("wav");
    expect(result.durationSeconds).toBeCloseTo(0.25, 2);
    expect(result.sampleRate).toBe(16_000);
    expect(result.channels).toBe(1);
  });

  it("rejects a claimed MIME that does not match the actual container", async () => {
    await expect(
      validateLearnerAudio(pcmWav(), "audio/webm", {
        maxBytes: 1_000_000,
        maxDurationSeconds: 5,
      }),
    ).rejects.toMatchObject({ reason: "FORMAT" });
  });

  it("rejects malformed, overlong, high-rate, and multi-channel input", async () => {
    const options = { maxBytes: 1_000_000, maxDurationSeconds: 0.1 };
    await expect(
      validateLearnerAudio(Buffer.from("not audio"), "audio/webm", options),
    ).rejects.toBeInstanceOf(LearnerAudioValidationError);
    await expect(
      validateLearnerAudio(pcmWav(), "audio/wav", options),
    ).rejects.toMatchObject({ reason: "DURATION" });
    await expect(
      validateLearnerAudio(pcmWav({ sampleRate: 192_000 }), "audio/wav", {
        ...options,
        maxDurationSeconds: 5,
      }),
    ).rejects.toMatchObject({ reason: "FORMAT" });
    await expect(
      validateLearnerAudio(pcmWav({ channels: 3 }), "audio/wav", {
        ...options,
        maxDurationSeconds: 5,
      }),
    ).rejects.toMatchObject({ reason: "FORMAT" });
  });
});
