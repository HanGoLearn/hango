import { createHash } from "node:crypto";
import type { AiCompletionRequest, AiCompletionResult } from "./ai/provider";
import { prepareImportedJourneyQualityReview } from "./journey-speaking-quality-import";
import { JOURNEY_QUALITY_CANDIDATE_VERSION } from "./journey-speaking-quality-candidate";

type Prepared = ReturnType<typeof prepareImportedJourneyQualityReview>;
type Store = {
  claim(key: string, metadata: unknown): Promise<boolean>;
  saveResponse(key: string, value: unknown): Promise<void>;
  saveInspection(key: string, value: unknown): Promise<void>;
  saveSummary(key: string, value: unknown): Promise<void>;
  readSummary?(key: string): Promise<unknown | null>;
};
export const PROMPT_V2_ADDITIONAL_AUTHORIZATION =
  "user-confirmed-single-additional-prompt-v2-2026-10-18";
export const EVIDENCE_REVIEW_AUTHORIZATION =
  "user-confirmed-single-evidence-review-2026-10-18";
type Approval = {
  confirmOnePaidReview: true;
  maximumUsd: 0.05;
  /** New explicit human authorization, never inferred from a prompt change. */
  additionalAuthorization?: typeof PROMPT_V2_ADDITIONAL_AUTHORIZATION;
  evidenceAuthorization?: typeof EVIDENCE_REVIEW_AUTHORIZATION;
};
const hash = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");

/** Conservative byte-based allowance for this text-only request plus schema.
 * No cache discount. Output includes reasoning. Refuse above the application's
 * TEXT reservation ($0.02), even though the user's ceiling is $0.05.
 * Rates verified 2026-10-18 against OpenAI's gpt-5-mini model page. */
export function importedReviewBudget(request: Prepared["request"]) {
  const inputTokenAllowance =
    Buffer.byteLength(JSON.stringify(request), "utf8") + 4096;
  const maxOutputTokens = 3500;
  const allowanceUsd = (inputTokenAllowance * 0.25 + maxOutputTokens * 2) / 1e6;
  if (allowanceUsd > 0.02) throw new Error("Request exceeds reserved budget");
  return {
    model: "gpt-5-mini" as const,
    inputTokenAllowance,
    maxOutputTokens,
    allowanceUsd,
  };
}

/** Additional authorization covers changed instructions only, not other speech,
 * banks, an expanded schema or a silent model/workload migration. */
export function verifyAdditionalPromptV2Request(
  previous: Prepared["request"],
  current: Prepared["request"],
) {
  if (
    previous.promptVersion !== "journey-quality-review-2026-10-18-v1" ||
    current.promptVersion !== "journey-quality-review-2026-10-18-v2" ||
    previous.input !== current.input ||
    JSON.stringify(previous.responseFormat) !==
      JSON.stringify(current.responseFormat)
  )
    throw new Error(
      "Additional approval requires the same frozen data and contract",
    );
}

/** No DB/SDK imports and no module-level dispatch. Dependencies must enforce
 * administrator identity, local destination and existing application caps.
 * A durable claim is NEVER removed, including an ambiguous transport failure. */
export async function runImportedReviewOnce(
  prepared: Prepared,
  approval: Approval,
  deps: {
    store: Store;
    authorize: (
      operation: () => Promise<AiCompletionResult>,
    ) => Promise<AiCompletionResult>;
    complete: (request: AiCompletionRequest) => Promise<AiCompletionResult>;
    meter: (result: AiCompletionResult, costUsd: number) => Promise<string>;
  },
) {
  if (approval.confirmOnePaidReview !== true || approval.maximumUsd !== 0.05)
    throw new Error("Explicit one-shot approval required");
  if (approval.additionalAuthorization && approval.evidenceAuthorization)
    throw new Error("Conflicting authorizations");
  const budget = importedReviewBudget(prepared.request);
  const previousReviewKey = hash([
    "production-import-single-review",
    prepared.receipt.attemptId,
    JOURNEY_QUALITY_CANDIDATE_VERSION,
  ]);
  let reviewKey = previousReviewKey;
  if (approval.additionalAuthorization !== undefined) {
    if (
      approval.additionalAuthorization !== PROMPT_V2_ADDITIONAL_AUTHORIZATION ||
      prepared.request.promptVersion !== "journey-quality-review-2026-10-18-v2"
    )
      throw new Error("Unsupported additional authorization");
    const prior = await deps.store.readSummary?.(previousReviewKey);
    if (
      !prior ||
      typeof prior !== "object" ||
      !("reviewKey" in prior) ||
      prior.reviewKey !== previousReviewKey ||
      !("state" in prior) ||
      prior.state !== "REJECTED_CANDIDATE" ||
      !("paidDispatches" in prior) ||
      prior.paidDispatches !== 1
    )
      throw new Error("Completed rejected predecessor required");
    reviewKey = hash([previousReviewKey, approval.additionalAuthorization]);
  }
  if (approval.evidenceAuthorization !== undefined) {
    if (
      approval.evidenceAuthorization !== EVIDENCE_REVIEW_AUTHORIZATION ||
      prepared.request.promptVersion !==
        "journey-quality-evidence-review-2026-10-18-v1" ||
      prepared.request.responseFormat.name !== "journey_evidence_selection"
    )
      throw new Error("Unsupported evidence authorization");
    const precedingKey = hash([
      previousReviewKey,
      PROMPT_V2_ADDITIONAL_AUTHORIZATION,
    ]);
    const prior = await deps.store.readSummary?.(precedingKey);
    if (
      !prior ||
      typeof prior !== "object" ||
      !("reviewKey" in prior) ||
      prior.reviewKey !== precedingKey ||
      !("state" in prior) ||
      prior.state !== "REJECTED_CANDIDATE" ||
      !("paidDispatches" in prior) ||
      prior.paidDispatches !== 1
    )
      throw new Error("Completed rejected prompt-v2 predecessor required");
    reviewKey = hash([previousReviewKey, approval.evidenceAuthorization]);
  }
  if (
    !(await deps.store.claim(reviewKey, {
      source: prepared.receipt.source,
      attemptId: prepared.receipt.attemptId,
      version: JOURNEY_QUALITY_CANDIDATE_VERSION,
      requestHash: hash(prepared.request),
      approval,
      ...(approval.additionalAuthorization ? { previousReviewKey } : {}),
      ...(approval.evidenceAuthorization
        ? {
            precedingReviewKey: hash([
              previousReviewKey,
              PROMPT_V2_ADDITIONAL_AUTHORIZATION,
            ]),
          }
        : {}),
      budget,
      createdAt: new Date().toISOString(),
    }))
  )
    return { reviewKey, state: "ALREADY_CLAIMED", paidDispatches: 0 };

  let paidDispatches = 0;
  let responseSaved = false;
  let usageLogId: string | null = null;
  let costUsd: number | null = null;
  try {
    const result = await deps.authorize(async () => {
      paidDispatches++;
      const result = await deps.complete({
        systemPrompt: prepared.request.instructions,
        messages: [{ role: "user", content: prepared.request.input }],
        structuredOutput: {
          name: prepared.request.responseFormat.name,
          schema: prepared.request.responseFormat.schema,
        },
        maxOutputTokens: budget.maxOutputTokens,
        timeoutMs: approval.evidenceAuthorization ? 60000 : 45000,
        retry: false,
      });
      // Before operation logging, cost accounting or semantic validation.
      await deps.store.saveResponse(reviewKey, {
        request: prepared.request,
        result,
        receivedAt: new Date().toISOString(),
      });
      responseSaved = true;
      return result;
    });
    if (
      result.provider !== "openai" ||
      result.model !== budget.model ||
      !Number.isSafeInteger(result.inputTokens) ||
      result.inputTokens < 0 ||
      !Number.isSafeInteger(result.outputTokens) ||
      result.outputTokens < 0
    )
      throw new Error("Unexpected provider or metering");
    costUsd = (result.inputTokens * 0.25 + result.outputTokens * 2) / 1e6;
    usageLogId = await deps.meter(result, costUsd);
    const inspection = prepared.inspectResponse({
      status:
        result.outputStatus === "complete"
          ? "completed"
          : result.outputStatus === "refused"
            ? "refused"
            : "incomplete",
      text: result.content,
    });
    await deps.store.saveInspection(reviewKey, inspection);
    const summary = {
      reviewKey,
      state: inspection.state,
      paidDispatches,
      usageLogId,
      costUsd,
      budget,
      productionWrites: 0,
      scoreChanged: false,
    };
    await deps.store.saveSummary(reviewKey, summary);
    return summary;
  } catch {
    const summary = {
      reviewKey,
      state: responseSaved
        ? "POST_RESPONSE_FAILURE"
        : paidDispatches
          ? "PROVIDER_OR_STORAGE_FAILURE_NO_RETRY"
          : "CAP_OR_AUTHORIZATION_BLOCKED",
      paidDispatches,
      responseSaved,
      usageLogId,
      costUsd,
    };
    await deps.store.saveSummary(reviewKey, summary);
    return summary;
  }
}
