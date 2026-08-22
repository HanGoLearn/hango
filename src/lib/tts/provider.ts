/**
 * TTS Provider Abstraction — mirrors src/lib/speech/provider.ts's shape
 * (the STT counterpart) so the "external voice service" layers in this
 * codebase stay consistent. Business logic never talks to a vendor's
 * speech-synthesis API directly.
 *
 * Deliberately separate from Han's voice (app/api/han/speech/route.ts):
 * this provider speaks scenario dialogue lines as written (a waiter, a
 * hotel clerk, a customer), with no oral-script rewriting or teaching
 * framing — Han's voice logic stays specific to the AI Teacher persona.
 */
export interface TtsResult {
  audio: Buffer;
  contentType: string;
  provider: string;
  model: string;
}

export type TtsProviderErrorCode =
  "timeout" | "rate_limited" | "invalid_input" | "unavailable" | "unknown";

export class TtsProviderError extends Error {
  code: TtsProviderErrorCode;

  constructor(code: TtsProviderErrorCode, message: string) {
    super(message);
    this.name = "TtsProviderError";
    this.code = code;
  }
}

export interface TtsProvider {
  readonly name: string;
  /** `instructions` overrides the provider's default delivery guidance (e.g. pace) when given. */
  synthesize(text: string, voice: string, instructions?: string): Promise<TtsResult>;
}
