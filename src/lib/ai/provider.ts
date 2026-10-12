/**
 * AI Provider Abstraction (8.1) - business logic (src/lib/ai-teacher-data.ts)
 * only ever talks to this interface, never to a specific vendor SDK/API
 * directly (ai_architecture.md "External AI providers should never be
 * accessed directly by business logic").
 */
export interface AiMessageInput {
  role: "user" | "assistant";
  content: string;
}

export interface AiCompletionRequest {
  systemPrompt: string;
  messages: AiMessageInput[];
  maxOutputTokens?: number;
  /** Override for slower, non-interactive jobs such as lesson evaluation. */
  timeoutMs?: number;
  /** Opt-in structured output; ordinary chat requests remain unchanged. */
  structuredOutput?: { name: string; schema: Record<string, unknown> };
  /** Disable transport retries for operations that must not silently rebill. */
  retry?: false;
}

export interface AiCompletionResult {
  content: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  /** Preserve metering even when a structured completion cannot be consumed. */
  outputStatus?: "complete" | "refused" | "incomplete";
}

export type AiProviderErrorCode =
  "timeout" | "rate_limited" | "invalid_request" | "unavailable" | "unknown";

export class AiProviderError extends Error {
  code: AiProviderErrorCode;

  constructor(code: AiProviderErrorCode, message: string) {
    super(message);
    this.name = "AiProviderError";
    this.code = code;
  }
}

export interface AiProvider {
  readonly name: string;
  readonly supportsStructuredOutput?: boolean;
  complete(request: AiCompletionRequest): Promise<AiCompletionResult>;
}
