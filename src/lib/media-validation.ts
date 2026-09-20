import "server-only";

import { parseBuffer } from "music-metadata";

const ALLOWED_AUDIO_MIME_TYPES = new Set([
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/wav",
  "audio/x-wav",
]);

export class LearnerAudioValidationError extends Error {
  constructor(
    public readonly reason: "EMPTY" | "SIZE" | "FORMAT" | "DURATION",
  ) {
    super(
      reason === "SIZE"
        ? "Recording is too large."
        : reason === "DURATION"
          ? "Recording is too long."
          : "Unsupported recording format.",
    );
  }
}

export interface ValidatedLearnerAudio {
  buffer: Buffer;
  mimeType: "audio/webm" | "audio/ogg" | "audio/mp4" | "audio/wav";
  extension: "webm" | "ogg" | "m4a" | "wav";
  durationSeconds: number;
  sampleRate: number;
  channels: number;
}

/**
 * Fully parses an uploaded learner recording before it reaches STT or storage.
 * The browser-provided MIME and duration are hints only; container signature,
 * duration, sample rate, channel count, and absence of video are server-owned.
 */
export async function validateLearnerAudio(
  buffer: Buffer,
  claimedMimeType: string,
  options: { maxBytes: number; maxDurationSeconds: number },
): Promise<ValidatedLearnerAudio> {
  if (buffer.length === 0) throw new LearnerAudioValidationError("EMPTY");
  if (buffer.length > options.maxBytes) {
    throw new LearnerAudioValidationError("SIZE");
  }

  const normalizedMime = normalizeAudioMimeType(claimedMimeType);
  if (!ALLOWED_AUDIO_MIME_TYPES.has(normalizedMime)) {
    throw new LearnerAudioValidationError("FORMAT");
  }
  const detected = detectAudioContainer(buffer);
  if (!detected || !detected.claimedTypes.has(normalizedMime)) {
    throw new LearnerAudioValidationError("FORMAT");
  }

  try {
    const metadata = await parseBuffer(
      buffer,
      { mimeType: normalizedMime, size: buffer.length },
      { duration: true, skipCovers: true },
    );
    const duration = metadata.format.duration;
    const sampleRate = metadata.format.sampleRate;
    const channels = metadata.format.numberOfChannels;
    if (
      metadata.format.hasVideo === true ||
      !Number.isFinite(duration) ||
      duration === undefined ||
      duration <= 0 ||
      !Number.isFinite(sampleRate) ||
      sampleRate === undefined ||
      sampleRate < 8_000 ||
      sampleRate > 96_000 ||
      !Number.isInteger(channels) ||
      channels === undefined ||
      channels < 1 ||
      channels > 2
    ) {
      throw new LearnerAudioValidationError("FORMAT");
    }
    if (duration > options.maxDurationSeconds) {
      throw new LearnerAudioValidationError("DURATION");
    }

    return {
      buffer,
      mimeType: detected.mimeType,
      extension: detected.extension,
      durationSeconds: duration,
      sampleRate,
      channels,
    };
  } catch (error) {
    if (error instanceof LearnerAudioValidationError) throw error;
    throw new LearnerAudioValidationError("FORMAT");
  }
}

function normalizeAudioMimeType(value: string): string {
  const normalized = value.split(";", 1)[0]?.trim().toLowerCase() ?? "";
  return normalized === "audio/wave" ? "audio/wav" : normalized;
}

function detectAudioContainer(buffer: Buffer): {
  claimedTypes: Set<string>;
  mimeType: ValidatedLearnerAudio["mimeType"];
  extension: ValidatedLearnerAudio["extension"];
} | null {
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).equals(Buffer.from([0x52, 0x49, 0x46, 0x46])) &&
    buffer.subarray(8, 12).toString("ascii") === "WAVE"
  ) {
    return {
      claimedTypes: new Set(["audio/wav", "audio/x-wav"]),
      mimeType: "audio/wav",
      extension: "wav",
    };
  }
  if (
    buffer.length >= 4 &&
    buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))
  ) {
    return {
      claimedTypes: new Set(["audio/webm"]),
      mimeType: "audio/webm",
      extension: "webm",
    };
  }
  if (
    buffer.length >= 4 &&
    buffer.subarray(0, 4).toString("ascii") === "OggS"
  ) {
    return {
      claimedTypes: new Set(["audio/ogg"]),
      mimeType: "audio/ogg",
      extension: "ogg",
    };
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(4, 8).toString("ascii") === "ftyp"
  ) {
    return {
      claimedTypes: new Set(["audio/mp4"]),
      mimeType: "audio/mp4",
      extension: "m4a",
    };
  }
  return null;
}
