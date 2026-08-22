/**
 * STT Provider Abstraction (10.4) - mirrors src/lib/ai/provider.ts's shape
 * so the two "external AI-ish service" layers in this codebase stay
 * consistent. Business logic never talks to a vendor's transcription API
 * directly.
 */
export interface SttTranscriptionResult {
  transcript: string;
  /** 0-1, or null when the provider doesn't report one. */
  confidence: number | null;
  provider: string;
  model: string;
}

export type SttTranscriptionMode = "mandarin" | "han-multilingual";

export type SttProviderErrorCode =
  "timeout" | "rate_limited" | "invalid_audio" | "unavailable" | "unknown";

export class SttProviderError extends Error {
  code: SttProviderErrorCode;

  constructor(code: SttProviderErrorCode, message: string) {
    super(message);
    this.name = "SttProviderError";
    this.code = code;
  }
}

export interface SttProvider {
  readonly name: string;
  transcribe(
    audio: Buffer,
    mimeType: string,
    mode: SttTranscriptionMode,
  ): Promise<SttTranscriptionResult>;
}
