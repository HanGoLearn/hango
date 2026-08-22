/** Rough USD-per-million-token pricing, only for the "Record usage and cost metadata" requirement (8.1) - not billing-accurate. */
const PRICING_PER_MILLION_TOKENS: Record<
  string,
  { input: number; output: number }
> = {
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-5-mini": { input: 0.25, output: 2 },
  "claude-sonnet-5": { input: 3, output: 15 },
  "mock-teacher-v1": { input: 0, output: 0 },
};

const DEFAULT_PRICING = { input: 3, output: 15 };

export function estimateCostUsd(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const pricing = PRICING_PER_MILLION_TOKENS[model] ?? DEFAULT_PRICING;
  return (
    (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000
  );
}
