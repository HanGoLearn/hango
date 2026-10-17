/** One initial dispatch plus one deliberate recovery, never a refresh retry.
 * Provider calls may have cost even when their output was rejected. */
export const JOURNEY_MAX_EVALUATION_REQUESTS = 2;
const RECOVERABLE_FAILURES = new Set([
  "invalid_evidence",
  "invalid_json",
  "provider_incomplete",
  "provider_timeout",
  "provider_unavailable",
  "provider_rate_limited",
  "processing_expired",
  "budget_blocked",
]);

export function canRecoverJourneyEvaluation(evaluation: {
  status: string;
  requestCount: number;
  failureCode: string | null;
}): boolean {
  return (
    evaluation.status === "FAILED" &&
    evaluation.requestCount < JOURNEY_MAX_EVALUATION_REQUESTS &&
    RECOVERABLE_FAILURES.has(evaluation.failureCode ?? "")
  );
}
