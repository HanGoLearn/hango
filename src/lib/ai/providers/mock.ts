import type {
  AiCompletionRequest,
  AiCompletionResult,
  AiProvider,
} from "@/lib/ai/provider";

/**
 * Used whenever `ANTHROPIC_API_KEY` is unset (src/lib/ai/index.ts) - no
 * network calls, no cost, so the app (and its tests) work without an API
 * key. Responses are canned but read the request so the UI/context wiring
 * can be exercised meaningfully during development.
 */
export class MockAiProvider implements AiProvider {
  readonly name = "mock";

  async complete(request: AiCompletionRequest): Promise<AiCompletionResult> {
    // Simulate real latency so loading states are actually visible in dev.
    await new Promise((resolve) => setTimeout(resolve, 400));

    const lastUserMessage =
      [...request.messages].reverse().find((m) => m.role === "user")?.content ??
      "";

    const content = buildMockReply(lastUserMessage);

    return {
      content,
      provider: this.name,
      model: "mock-teacher-v1",
      inputTokens:
        estimateTokens(request.systemPrompt) +
        request.messages.reduce((sum, m) => sum + estimateTokens(m.content), 0),
      outputTokens: estimateTokens(content),
    };
  }
}

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

function buildMockReply(userMessage: string): string {
  const lower = userMessage.toLowerCase();

  if (lower.includes("grammar") || lower.includes("gramática")) {
    return "[Mock AI Teacher] Here's how that grammar point works: it follows a consistent pattern you'll see again in later lessons. Try building one example sentence of your own with it.";
  }
  if (
    lower.includes("vocab") ||
    lower.includes("word") ||
    lower.includes("meaning")
  ) {
    return "[Mock AI Teacher] That word is commonly used in this kind of situation. Notice its tone and how it pairs with nearby words in the example sentence.";
  }
  if (lower.includes("example")) {
    return "[Mock AI Teacher] Sure — here's an example sentence using that pattern in a similar everyday context.";
  }
  if (
    lower.includes("why") ||
    lower.includes("mistake") ||
    lower.includes("wrong")
  ) {
    return "[Mock AI Teacher] That answer wasn't quite right because of how the sentence structure changes meaning here. Compare it with the correct option and see the difference.";
  }

  return `[Mock AI Teacher] This is a simulated response (no ANTHROPIC_API_KEY is configured yet). You asked: "${userMessage.slice(0, 140)}" — once a real key is added, this will be a genuine, context-aware answer.`;
}
