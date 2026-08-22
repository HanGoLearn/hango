import {
  TtsProviderError,
  type TtsProvider,
  type TtsResult,
} from "@/lib/tts/provider";

const API_URL = "https://api.openai.com/v1/audio/speech";
const MODEL = "gpt-4o-mini-tts";
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 1;

/**
 * Real adapter, used whenever `OPENAI_API_KEY` is set. Speaks the given
 * text as-is (no oral-script rewriting) — used for scenario dialogue
 * lines, not Han's persona-shaped speech.
 */
export class OpenAiTtsProvider implements TtsProvider {
  readonly name = "openai";

  constructor(private readonly apiKey: string) {}

  async synthesize(
    text: string,
    voice: string,
    instructions?: string,
  ): Promise<TtsResult> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await this.synthesizeOnce(text, voice, instructions);
      } catch (error) {
        lastError = error;
        if (!shouldRetry(error) || attempt === MAX_RETRIES) break;
      }
    }

    throw normalizeError(lastError);
  }

  private async synthesizeOnce(
    text: string,
    voice: string,
    instructions?: string,
  ): Promise<TtsResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          authorization: `Bearer ${this.apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          voice,
          input: text,
          // WAV, not mp3: dialogue lines get concatenated into one
          // full-conversation clip (src/lib/dialogue-audio.ts) via the same
          // WAV merge utility Han's voice already uses - naive byte-level
          // mp3 concatenation isn't reliably seekable/gapless.
          response_format: "wav",
          instructions:
            instructions ??
            "Speak this line naturally, at a normal conversational pace, as the character would say it in the scene. Do not add anything else.",
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new HttpStatusError(response.status, await safeText(response));
      }

      const audio = Buffer.from(await response.arrayBuffer());

      return {
        audio,
        contentType: "audio/wav",
        provider: this.name,
        model: MODEL,
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

class HttpStatusError extends Error {
  constructor(
    public status: number,
    body: string,
  ) {
    super(`OpenAI speech API responded ${status}: ${body}`);
  }
}

async function safeText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return "";
  }
}

function shouldRetry(error: unknown): boolean {
  if (error instanceof HttpStatusError) return error.status >= 500;
  if (error instanceof DOMException && error.name === "AbortError") return true;
  return error instanceof TypeError;
}

function normalizeError(error: unknown): TtsProviderError {
  if (error instanceof DOMException && error.name === "AbortError") {
    return new TtsProviderError("timeout", "Speech generation took too long.");
  }
  if (error instanceof HttpStatusError) {
    if (error.status === 429) {
      return new TtsProviderError(
        "rate_limited",
        "Too many speech generation requests.",
      );
    }
    if (error.status >= 500) {
      return new TtsProviderError(
        "unavailable",
        "Speech generation is temporarily unavailable.",
      );
    }
    if (error.status === 400 || error.status === 422) {
      return new TtsProviderError(
        "invalid_input",
        "That text couldn't be spoken.",
      );
    }
    return new TtsProviderError("unknown", error.message);
  }
  if (error instanceof TypeError) {
    return new TtsProviderError(
      "unavailable",
      "Couldn't reach the speech generation service.",
    );
  }
  return new TtsProviderError(
    "unknown",
    error instanceof Error ? error.message : "Unknown speech generation error.",
  );
}
