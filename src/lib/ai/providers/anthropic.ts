import {
  AiProviderError,
  type AiCompletionRequest,
  type AiCompletionResult,
  type AiProvider,
} from "@/lib/ai/provider";

const API_URL = "https://api.anthropic.com/v1/messages";
const API_VERSION = "2023-06-01";
const DEFAULT_MODEL = "claude-sonnet-5";
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_RETRIES = 1;

/**
 * Real adapter, used whenever `ANTHROPIC_API_KEY` is set (src/lib/ai/index.ts).
 * Talks to the Messages API directly over `fetch` rather than pulling in the
 * `@anthropic-ai/sdk` package - this is the only method this class exposes,
 * so swapping to the SDK later (or to a different provider entirely) is a
 * one-file change.
 */
export class AnthropicAiProvider implements AiProvider {
  readonly name = "anthropic";

  constructor(
    private readonly apiKey: string,
    private readonly model: string = DEFAULT_MODEL,
  ) {}

  async complete(request: AiCompletionRequest): Promise<AiCompletionResult> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await this.completeOnce(request);
      } catch (error) {
        lastError = error;
        if (!shouldRetry(error) || attempt === MAX_RETRIES) break;
      }
    }

    throw normalizeError(lastError);
  }

  private async completeOnce(
    request: AiCompletionRequest,
  ): Promise<AiCompletionResult> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      request.timeoutMs ?? REQUEST_TIMEOUT_MS,
    );

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": API_VERSION,
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: request.maxOutputTokens ?? 500,
          system: request.systemPrompt,
          messages: request.messages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new HttpStatusError(response.status, await safeText(response));
      }

      const data = (await response.json()) as AnthropicResponse;
      const content = data.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("");

      return {
        content,
        provider: this.name,
        model: this.model,
        inputTokens: data.usage.input_tokens,
        outputTokens: data.usage.output_tokens,
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

interface AnthropicResponse {
  content: { type: string; text: string }[];
  usage: { input_tokens: number; output_tokens: number };
}

class HttpStatusError extends Error {
  constructor(
    public status: number,
    body: string,
  ) {
    super(`Anthropic API responded ${status}: ${body}`);
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
  return error instanceof TypeError; // network failure
}

function normalizeError(error: unknown): AiProviderError {
  if (error instanceof DOMException && error.name === "AbortError") {
    return new AiProviderError("timeout", "Han took too long to respond.");
  }
  if (error instanceof HttpStatusError) {
    if (error.status === 429) {
      return new AiProviderError(
        "rate_limited",
        "Han is receiving too many requests.",
      );
    }
    if (error.status >= 500) {
      return new AiProviderError(
        "unavailable",
        "Han is temporarily unavailable.",
      );
    }
    if (error.status === 400 || error.status === 422) {
      return new AiProviderError(
        "invalid_request",
        "That message couldn't be processed.",
      );
    }
    return new AiProviderError("unknown", error.message);
  }
  if (error instanceof TypeError) {
    return new AiProviderError("unavailable", "Couldn't reach Han.");
  }
  return new AiProviderError(
    "unknown",
    error instanceof Error ? error.message : "Unknown AI provider error.",
  );
}
