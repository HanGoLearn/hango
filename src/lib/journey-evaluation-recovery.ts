import { JOURNEY_EVALUATION_POLICY } from "@/lib/journey-evaluation-policy";

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
  report?: unknown;
}): boolean {
  // One explicit compatibility recovery for the exact pre-fix rejection.
  // No counter reset and no retry for new-policy failures or unrelated errors.
  const report = evaluation.report as
    | {
        kind?: unknown;
        evaluationPolicy?: unknown;
        errors?: unknown;
      }
    | null
    | undefined;
  const legacyRecognitionFailure =
    evaluation.requestCount === JOURNEY_MAX_EVALUATION_REQUESTS &&
    evaluation.failureCode === "invalid_evidence" &&
    report?.kind === "validation_failure" &&
    report.evaluationPolicy === undefined &&
    Array.isArray(report.errors) &&
    report.errors.length === 1 &&
    report.errors[0] ===
      "Uncertain recognition cannot certify production or an error";
  // Owner authorized one further explicit recovery after this distinct, known
  // pre-fix optional-comprehension failure. Never reopen arbitrary third calls.
  const legacyComprehensionFailure =
    evaluation.requestCount === JOURNEY_MAX_EVALUATION_REQUESTS + 1 &&
    evaluation.failureCode === "invalid_evidence" &&
    report?.kind === "validation_failure" &&
    report.evaluationPolicy === JOURNEY_EVALUATION_POLICY &&
    Array.isArray(report.errors) &&
    report.errors.length === 2 &&
    report.errors.includes(
      "Generic assent cannot certify item comprehension",
    ) &&
    report.errors.some(
      (error) =>
        typeof error === "string" &&
        /^Missing learner evidence: vocabulary:[a-z0-9_-]{1,100}$/iu.test(
          error,
        ),
    );
  return (
    evaluation.status === "FAILED" &&
    (evaluation.requestCount < JOURNEY_MAX_EVALUATION_REQUESTS ||
      legacyRecognitionFailure ||
      legacyComprehensionFailure) &&
    RECOVERABLE_FAILURES.has(evaluation.failureCode ?? "")
  );
}
