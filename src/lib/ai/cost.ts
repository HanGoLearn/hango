/** Rough USD-per-million-token pricing, only for the "Record usage and cost metadata" requirement (8.1) - not billing-accurate. */
export interface TokenPricingUsdPerMillion {
  input: number;
  output: number;
}

const PRICING_PER_MILLION_TOKENS: Record<string, TokenPricingUsdPerMillion> = {
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-5-mini": { input: 0.25, output: 2 },
  "claude-sonnet-5": { input: 3, output: 15 },
  "mock-teacher-v1": { input: 0, output: 0 },
};

const DEFAULT_PRICING = { input: 3, output: 15 };

/**
 * Returns the rate snapshot used by the internal cost estimate. Persisting
 * this beside every usage row keeps historical reports stable if the table
 * above changes later.
 */
export function getTokenPricingUsdPerMillion(
  model: string,
): TokenPricingUsdPerMillion {
  return PRICING_PER_MILLION_TOKENS[model] ?? DEFAULT_PRICING;
}

export function estimateCostUsd(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const pricing = getTokenPricingUsdPerMillion(model);
  return (
    (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000
  );
}
