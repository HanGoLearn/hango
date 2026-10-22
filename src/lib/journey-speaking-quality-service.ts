import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import { serverEnv } from "@/lib/env/server";
import { requireAdministrator } from "@/lib/admin-auth";
import { getJourneySpeakingAttempt } from "@/lib/journey-speaking-attempts";
import { getAiProvider } from "@/lib/ai";
import {
  DailyUsageCapExceededError,
  estimateCostUsd,
  recordAiUsage,
  trackAiOperation,
} from "@/lib/ai-usage";
import {
  JourneyCaptureQualitySchema,
  JourneyRecognitionSchema,
  JOURNEY_RUBRIC_VERSION,
  type JourneyAttemptSnapshot,
} from "@/lib/journey-speaking-attempt-contract";
import { hasSubstantiveJourneyTurn } from "@/lib/journey-speaking-evaluation";
import { JOURNEY_QUALITY_CANDIDATE_VERSION } from "@/lib/journey-speaking-quality-candidate";
import { prepareJourneyQualityEvidenceReview as prepareJourneyQualityReview } from "@/lib/journey-speaking-quality-evidence-review";
import { localJourneyQualityStore as store } from "@/lib/journey-speaking-quality-store";

const Input = z
  .object({
    attemptId: z.string().trim().min(1).max(100),
    lessonId: z.string().trim().min(1).max(100),
    confirmPaidReview: z.literal(true),
  })
  .strict();
const PilotLessons = new Set([
  "foundations-greetings-and-introductions",
  "restaurant-entering-and-ordering",
  "negotiating-job-contract-reviewing-contract-terms",
]);
const Summary = z
  .object({
    reviewKey: z.string().regex(/^[a-f0-9]{64}$/),
    state: z.enum([
      "VALIDATED_CANDIDATE",
      "REJECTED_CANDIDATE",
      "REFUSED",
      "INCOMPLETE",
      "INVALID_OUTPUT",
      "BUDGET_BLOCKED",
      "PROVIDER_FAILED",
      "STORAGE_OR_METERING_FAILED",
    ]),
    usageLogId: z.string().nullable(),
  })
  .strict();
const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");

/** Admin's OWN sealed pilot attempt only. Not a server action/route: no UI
 * caller yet. Disabled by default and always disabled outside development.
 * New ledger, not the live evaluation row; cannot grant or rewrite a grade. */
export async function runLocalJourneyQualityReview(raw: unknown) {
  if (
    serverEnv.NODE_ENV !== "development" ||
    serverEnv.HANGO_JOURNEY_QUALITY_REVIEW !== "local"
  )
    throw new Error("Local quality review is disabled");
  const input = Input.parse(raw);
  const administrator = await requireAdministrator();
  // Existing reader verifies ownership, snapshot hash, and sealed capture hash.
  const attempt = await getJourneySpeakingAttempt(
    administrator.id,
    input.attemptId,
    input.lessonId,
  );
  if (
    attempt.status === "ACTIVE" ||
    attempt.status === "CANCELLED" ||
    !attempt.closeReason ||
    !["es", "en"].includes(attempt.locale) ||
    attempt.rubricVersion !== JOURNEY_RUBRIC_VERSION
  )
    throw new Error("Quality review requires a compatible sealed attempt");
  const snapshot = attempt.snapshot as unknown as JourneyAttemptSnapshot;
  if (
    !PilotLessons.has(snapshot.lessonSlug) ||
    snapshot.banks.version !== attempt.bankVersion
  )
    throw new Error("Quality review is limited to the frozen pilot lessons");
  const prepared = prepareJourneyQualityReview({
    attemptId: attempt.id,
    locale: attempt.locale as "es" | "en",
    snapshot,
    capture: {
      attemptId: attempt.id,
      lessonId: attempt.lessonId,
      closeReason: attempt.closeReason,
      turns: attempt.turns.map((turn) => ({
        id: turn.id,
        sequence: turn.sequence,
        role: turn.role === "USER" ? "user" : "assistant",
        content: turn.content,
        ...(turn.recognition
          ? { recognition: JourneyRecognitionSchema.parse(turn.recognition) }
          : {}),
      })),
      ...(attempt.captureQuality
        ? { quality: JourneyCaptureQualitySchema.parse(attempt.captureQuality) }
        : {}),
    },
  });
  const payload = JSON.parse(prepared.request.input);
  if (!hasSubstantiveJourneyTurn(payload.turns))
    throw new Error("Insufficient clear speech for a paid review");
  const provider = getAiProvider();
  if (provider.name === "mock" || !provider.supportsStructuredOutput)
    throw new Error("Structured provider unavailable");
  const reviewKey = digest(
    JSON.stringify([
      administrator.id,
      attempt.id,
      JOURNEY_QUALITY_CANDIDATE_VERSION,
    ]),
  );
  const claimed = await store.claim(reviewKey, {
    version: JOURNEY_QUALITY_CANDIDATE_VERSION,
    promptVersion: prepared.request.promptVersion,
    attemptId: attempt.id,
    userId: administrator.id,
    requestHash: digest(prepared.request.input),
    createdAt: new Date().toISOString(),
  });
  if (!claimed) {
    const prior = Summary.safeParse(await store.readSummary(reviewKey));
    return prior.success
      ? prior.data
      : { reviewKey, state: "ALREADY_CLAIMED" as const, usageLogId: null };
  }
  let usageLogId: string | null = null;
  let providerReturned = false;
  try {
    const result = await trackAiOperation(
      {
        userId: administrator.id,
        feature: "lesson-reflection",
        experience: "LESSON_REFLECTION",
        provider: provider.name,
      },
      () =>
        provider.complete({
          systemPrompt: prepared.request.instructions,
          messages: [{ role: "user", content: prepared.request.input }],
          structuredOutput: {
            name: prepared.request.responseFormat.name,
            schema: prepared.request.responseFormat.schema,
          },
          maxOutputTokens: 3500,
          timeoutMs: 45000,
          retry: false,
        }),
    );
    providerReturned = true;
    // Persist before metering/semantic validation. A rejected answer can then
    // be inspected offline, never purchased again automatically.
    await store.saveResponse(reviewKey, {
      request: prepared.request,
      result,
      receivedAt: new Date().toISOString(),
    });
    usageLogId = await recordAiUsage({
      userId: administrator.id,
      feature: "lesson-reflection",
      experience: "LESSON_REFLECTION",
      provider: result.provider,
      model: result.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      estimatedCostUsd: estimateCostUsd(
        result.model,
        result.inputTokens,
        result.outputTokens,
      ),
    });
    const reviewed = prepared.inspectResponse({
      status:
        result.outputStatus === "complete"
          ? "completed"
          : result.outputStatus === "refused"
            ? "refused"
            : "incomplete",
      text: result.content,
    });
    await store.saveInspection(reviewKey, reviewed);
    const summary = Summary.parse({
      reviewKey,
      state: reviewed.state,
      usageLogId,
    });
    await store.saveSummary(reviewKey, summary);
    return summary;
  } catch (error) {
    const state = providerReturned
      ? "STORAGE_OR_METERING_FAILED"
      : error instanceof DailyUsageCapExceededError
        ? "BUDGET_BLOCKED"
        : "PROVIDER_FAILED";
    const summary = Summary.parse({ reviewKey, state, usageLogId });
    // Generic code only: no transcripts, keys, provider bodies or raw errors.
    await store.saveSummary(reviewKey, { ...summary });
    return summary;
  }
}
