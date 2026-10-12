import "server-only";
import { randomUUID } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { getAiProvider, AiProviderError } from "@/lib/ai";
import {
  DailyUsageCapExceededError,
  estimateCostUsd,
  recordAiUsage,
  trackAiOperation,
} from "@/lib/ai-usage";
import {
  getJourneySpeakingAttempt,
  JourneyAttemptConflictError,
} from "@/lib/journey-speaking-attempts";
import {
  JOURNEY_RUBRIC_VERSION,
  JourneyRecognitionSchema,
  JourneyCaptureQualitySchema,
  type JourneyAttemptSnapshot,
} from "@/lib/journey-speaking-attempt-contract";
import {
  buildJourneyEvaluationPrompt,
  hasSubstantiveJourneyTurn,
  journeyJudgmentOutputSchema,
  validateJourneyJudgment,
  type JourneyEvaluationContext,
} from "@/lib/journey-speaking-evaluation";

export const JOURNEY_PROCESSING_DEADLINE_MS = 120_000;

/** Prepared backend, not yet called by legacy Reflection. One dispatch maximum
 * per sealed attempt, including failures. A refresh is never a paid retry.
 * A process crash/ambiguous timeout stays explicitly failed; recovering it will
 * require a separate, deliberate policy rather than an automatic second call.
 */
export async function evaluateJourneySpeakingAttempt(
  userId: string,
  attemptId: string,
  lessonId: string,
) {
  const attempt = await getJourneySpeakingAttempt(userId, attemptId, lessonId);
  if (attempt.status === "ACTIVE" || !attempt.closeReason)
    throw new JourneyAttemptConflictError("Seal the attempt before evaluation");
  const snapshot = attempt.snapshot as unknown as JourneyAttemptSnapshot;
  if (
    attempt.rubricVersion !== JOURNEY_RUBRIC_VERSION ||
    snapshot.lessonId !== lessonId ||
    snapshot.banks.version !== attempt.bankVersion ||
    !["es", "en"].includes(attempt.locale)
  )
    throw new JourneyAttemptConflictError(
      "Attempt evaluation version mismatch",
    );

  await db.journeySpeakingEvaluation.createMany({
    data: [
      {
        attemptId,
        rubricVersion: attempt.rubricVersion,
        locale: attempt.locale,
      },
    ],
    skipDuplicates: true,
  });
  const evaluation = await db.journeySpeakingEvaluation.findUniqueOrThrow({
    where: { attemptId },
  });
  if (evaluation.status !== "PENDING") {
    if (
      evaluation.status === "PROCESSING" &&
      evaluation.processingStartedAt &&
      Date.now() - evaluation.processingStartedAt.getTime() >
        JOURNEY_PROCESSING_DEADLINE_MS
    ) {
      await db.journeySpeakingEvaluation.updateMany({
        where: {
          id: evaluation.id,
          status: "PROCESSING",
          leaseToken: evaluation.leaseToken,
        },
        data: {
          status: "FAILED",
          failureCode: "processing_expired",
          score: null,
        },
      });
    }
    return db.journeySpeakingEvaluation.findUniqueOrThrow({
      where: { attemptId },
    });
  }
  const context: JourneyEvaluationContext = {
    snapshot,
    locale: attempt.locale as "es" | "en",
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
  };
  const leaseToken = randomUUID();
  const claim = await db.journeySpeakingEvaluation.updateMany({
    where: { id: evaluation.id, status: "PENDING", requestCount: 0 },
    data: {
      status: "PROCESSING",
      processingStartedAt: new Date(),
      leaseToken,
    },
  });
  if (claim.count !== 1)
    return db.journeySpeakingEvaluation.findUniqueOrThrow({
      where: { attemptId },
    });

  const claimWhere = {
    id: evaluation.id,
    status: "PROCESSING" as const,
    leaseToken,
  };
  async function fail(code: string) {
    await db.journeySpeakingEvaluation.updateMany({
      where: claimWhere,
      data: { status: "FAILED", failureCode: code, score: null },
    });
  }
  try {
    // No paid call for an abandoned attempt or merely greeting/empty capture.
    if (
      attempt.status === "CANCELLED" ||
      !hasSubstantiveJourneyTurn(context.turns)
    ) {
      await db.journeySpeakingEvaluation.updateMany({
        where: claimWhere,
        data: {
          status: "INSUFFICIENT",
          score: null,
          failureCode:
            attempt.status === "CANCELLED"
              ? "attempt_abandoned"
              : "no_substantive_evidence",
        },
      });
    } else {
      const provider = getAiProvider();
      // Mock responses must never masquerade as judgments of a real learner.
      if (provider.name === "mock" || !provider.supportsStructuredOutput) {
        await fail("structured_provider_unavailable");
      } else {
        const result = await trackAiOperation(
          {
            userId,
            feature: "lesson-reflection",
            experience: "LESSON_REFLECTION",
            provider: provider.name,
          },
          async () => {
            const dispatch = await db.journeySpeakingEvaluation.updateMany({
              where: { ...claimWhere, requestCount: 0 },
              data: { requestCount: { increment: 1 } },
            });
            if (dispatch.count !== 1)
              throw new JourneyAttemptConflictError(
                "Evaluation dispatch unavailable",
              );
            return provider.complete({
              systemPrompt: buildJourneyEvaluationPrompt(context),
              messages: [
                {
                  role: "user",
                  content:
                    "Evaluate the sealed attempt data using the supplied rubric. Return the single structured judgment and feedback.",
                },
              ],
              structuredOutput: {
                name: "journey_evidence_judgment",
                schema: journeyJudgmentOutputSchema(),
              },
              maxOutputTokens: 3_500,
              timeoutMs: 45_000,
              retry: false,
            });
          },
        );
        // Refused/truncated/invalid judgments can still incur provider usage.
        // Meter before validation; never hide the expense by calling it zero.
        const usageLogId = await recordAiUsage({
          userId,
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
        await db.journeySpeakingEvaluation.updateMany({
          where: { id: evaluation.id, leaseToken },
          data: { usageLogId, provider: result.provider, model: result.model },
        });
        if (
          result.outputStatus === "refused" ||
          result.outputStatus === "incomplete"
        ) {
          await fail(
            result.outputStatus === "refused"
              ? "provider_refused"
              : "provider_incomplete",
          );
        } else {
          let raw: unknown;
          try {
            raw = JSON.parse(result.content);
          } catch {
            await fail("invalid_json");
          }
          if (raw !== undefined) {
            const checked = validateJourneyJudgment(raw, context);
            if (!checked.ok) await fail("invalid_evidence");
            else
              await db.journeySpeakingEvaluation.updateMany({
                where: claimWhere,
                data: {
                  status: checked.report.status,
                  score: checked.report.score,
                  report: checked.report as unknown as Prisma.InputJsonValue,
                  failureCode: null,
                },
              });
          }
        }
      }
    }
  } catch (error) {
    await fail(
      error instanceof DailyUsageCapExceededError
        ? "budget_blocked"
        : error instanceof AiProviderError
          ? `provider_${error.code}`
          : "evaluation_failed",
    );
  }
  return db.journeySpeakingEvaluation.findUniqueOrThrow({
    where: { attemptId },
  });
}
