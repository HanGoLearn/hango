import {
  SttProviderError,
  type SttProvider,
  type SttTranscriptionMode,
  type SttTranscriptionResult,
} from "@/lib/speech/provider";
import {
  buildHanSttPrompt,
  confidenceFromLogprobs,
  type TranscriptLogprob,
} from "@/lib/speech/transcript-quality";

const API_URL = "https://api.openai.com/v1/audio/transcriptions";
const MODEL = "gpt-4o-transcribe";
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 1;

/**
 * Real adapter, used whenever `OPENAI_API_KEY` is set. Han's multilingual
 * chat supplies a three-language context prompt; Mandarin exercises also pin
 * the input language to `zh`.
 */
export class OpenAiSttProvider implements SttProvider {
  readonly name = "openai";

  constructor(private readonly apiKey: string) {}

  async transcribe(
    audio: Buffer,
    mimeType: string,
    mode: SttTranscriptionMode,
  ): Promise<SttTranscriptionResult> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await this.transcribeOnce(audio, mimeType, mode);
      } catch (error) {
        lastError = error;
        if (!shouldRetry(error) || attempt === MAX_RETRIES) break;
      }
    }

    throw normalizeError(lastError);
  }

  private async transcribeOnce(
    audio: Buffer,
    mimeType: string,
    mode: SttTranscriptionMode,
  ): Promise<SttTranscriptionResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const formData = new FormData();
      formData.append(
        "file",
        new Blob([new Uint8Array(audio)], { type: mimeType }),
        `recording.${audioExtension(mimeType)}`,
      );
      formData.append("model", MODEL);
      formData.append("response_format", "json");
      formData.append("include[]", "logprobs");
      formData.append("prompt", buildHanSttPrompt(mode));
      if (mode === "mandarin") formData.append("language", "zh");

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { authorization: `Bearer ${this.apiKey}` },
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new HttpStatusError(response.status, await safeText(response));
      }

      const data = (await response.json()) as {
        text: string;
        logprobs?: TranscriptLogprob[];
      };

      return {
        transcript: data.text,
        confidence: confidenceFromLogprobs(data.logprobs),
        provider: this.name,
        model: MODEL,
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

function audioExtension(mimeType: string): string {
  const normalized = mimeType.toLowerCase();
  if (normalized.includes("wav")) return "wav";
  if (normalized.includes("mpeg") || normalized.includes("mp3")) return "mp3";
  if (normalized.includes("mp4") || normalized.includes("m4a")) return "m4a";
  if (normalized.includes("ogg")) return "ogg";
  return "webm";
}

class HttpStatusError extends Error {
  constructor(
    public status: number,
    body: string,
  ) {
    super(`OpenAI transcription API responded ${status}: ${body}`);
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

function normalizeError(error: unknown): SttProviderError {
  if (error instanceof DOMException && error.name === "AbortError") {
    return new SttProviderError("timeout", "Transcription took too long.");
  }
  if (error instanceof HttpStatusError) {
    if (error.status === 429) {
      return new SttProviderError(
        "rate_limited",
        "Too many transcription requests.",
      );
    }
    if (error.status >= 500) {
      return new SttProviderError(
        "unavailable",
        "Transcription is temporarily unavailable.",
      );
    }
    if (error.status === 400 || error.status === 422) {
      return new SttProviderError(
        "invalid_audio",
        "That recording couldn't be processed.",
      );
    }
    return new SttProviderError("unknown", error.message);
  }
  if (error instanceof TypeError) {
    return new SttProviderError(
      "unavailable",
      "Couldn't reach the transcription service.",
    );
  }
  return new SttProviderError(
    "unknown",
    error instanceof Error ? error.message : "Unknown transcription error.",
  );
}
