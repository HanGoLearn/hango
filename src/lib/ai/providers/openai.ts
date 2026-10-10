import {
  AiProviderError,
  type AiCompletionRequest,
  type AiCompletionResult,
  type AiProvider,
} from "@/lib/ai/provider";

const API_URL = "https://api.openai.com/v1/chat/completions";
// Verified for this project's OpenAI organization; balances response quality
// with the small beta budget better than the larger frontier models.
const DEFAULT_MODEL = "gpt-5-mini";
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_RETRIES = 1;

/**
 * The project's chosen provider (chat now; OpenAI's Realtime API is also
 * the intended fit for FASE 10's Speaking Lab, which is why it won over
 * Anthropic here). Talks to the Chat Completions API directly over
 * `fetch` rather than the `openai` SDK - same reasoning as the Anthropic
 * adapter (still built, still selectable via ANTHROPIC_API_KEY): swapping
 * providers should be a one-file change, not a dependency change.
 */
export class OpenAiProvider implements AiProvider {
  readonly name = "openai";

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
          authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          max_completion_tokens: request.maxOutputTokens ?? 500,
          // Han is an interactive tutor, not a long-form reasoning task. A
          // higher effort can consume the whole completion budget in hidden
          // reasoning and return an empty visible reply.
          ...(this.model.startsWith("gpt-5")
            ? { reasoning_effort: "minimal" }
            : {}),
          messages: [
            { role: "system", content: request.systemPrompt },
            ...request.messages.map((message) => ({
              role: message.role,
              content: message.content,
            })),
          ],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new HttpStatusError(response.status, await safeText(response));
      }

      const data = (await response.json()) as OpenAiResponse;
      const content = data.choices[0]?.message.content ?? "";

      if (!content.trim()) {
        throw new AiProviderError(
          "unavailable",
          "Han couldn't finish that response. Please try again.",
        );
      }

      return {
        content,
        provider: this.name,
        model: this.model,
        inputTokens: data.usage.prompt_tokens,
        outputTokens: data.usage.completion_tokens,
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

interface OpenAiResponse {
  choices: { message: { role: string; content: string } }[];
  usage: { prompt_tokens: number; completion_tokens: number };
}

class HttpStatusError extends Error {
  constructor(
    public status: number,
    body: string,
  ) {
    super(`OpenAI API responded ${status}: ${body}`);
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
