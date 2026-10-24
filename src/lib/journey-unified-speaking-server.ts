import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import { prepareJourneyQualityEvidenceReview } from "./journey-speaking-quality-evidence-review";
import { buildJourneyUnifiedView } from "./journey-unified-speaking";
import { JOURNEY_UNIFIED_POLICY } from "./journey-unified-policy";
import { readJourneySessionAudio } from "./journey-session-audio-review";
import type { JourneyEvaluationContext } from "./journey-speaking-evaluation";
import type { JourneyAssessmentSnapshot } from "./journey-lesson-report";
import { journeySpeakingLevelInstructions } from "./journey-speaking-level";

const Stored = z
  .object({
    kind: z.literal("journey_unified_review"),
    version: z.literal(JOURNEY_UNIFIED_POLICY),
    attemptId: z.string().min(1).max(100),
    locale: z.enum(["es", "en"]),
    requestHash: z.string().regex(/^[a-f0-9]{64}$/),
    response: z
      .object({
        status: z.enum(["completed", "refused", "incomplete"]),
        text: z.string().max(150_000),
      })
      .strict(),
  })
  .strict();
export type JourneyUnifiedStored = z.infer<typeof Stored>;

/** Same frozen evidence transport/calibrator, now used by the lesson's ONE judge.
 * Private paid-claim files and previous experiment versions are never reopened. */
export function prepareUnifiedJourneyReview(
  attemptId: string,
  context: JourneyEvaluationContext,
) {
  if (context.snapshot.evaluationPolicy !== JOURNEY_UNIFIED_POLICY)
    throw new Error("Attempt did not opt into unified evaluation");
  const prepared = prepareJourneyQualityEvidenceReview({
    attemptId,
    locale: context.locale,
    snapshot: context.snapshot,
    requiredActIds: context.snapshot.successConditions.map(
      (condition) => condition.id,
    ),
    capture: {
      attemptId,
      lessonId: context.snapshot.lessonId,
      closeReason: context.closeReason,
      turns: context.turns,
      // Audio is independently revalidated below. A missing/rejected sidecar
      // must not discard usable linguistic evidence or influence that judgment.
      ...(context.quality
        ? {
            quality: {
              pendingLearnerTurn: context.quality.pendingLearnerTurn,
              interruptedAssistant: context.quality.interruptedAssistant,
            },
          }
        : {}),
    },
  });
  // Only new snapshots opt in. Never alter the prompt/hash of a paid historical
  // judgment simply because the current profile has accumulated more points.
  const request = context.snapshot.speakingLevel
    ? {
        ...prepared.request,
        instructions: `${prepared.request.instructions}\n${journeySpeakingLevelInstructions(context.snapshot.speakingLevel, "evaluation")}`,
        input: JSON.stringify({
          ...JSON.parse(prepared.request.input),
          speakingLevel: context.snapshot.speakingLevel,
        }),
      }
    : prepared.request;
  const requestHash = createHash("sha256")
    .update(JSON.stringify([JOURNEY_UNIFIED_POLICY, request]))
    .digest("hex");
  return {
    request,
    store(response: JourneyUnifiedStored["response"]): JourneyUnifiedStored {
      return Stored.parse({
        kind: "journey_unified_review",
        version: JOURNEY_UNIFIED_POLICY,
        attemptId,
        locale: context.locale,
        requestHash,
        response,
      });
    },
    inspect(raw: unknown) {
      const saved = Stored.safeParse(raw);
      if (
        !saved.success ||
        saved.data.attemptId !== attemptId ||
        saved.data.locale !== context.locale ||
        saved.data.requestHash !== requestHash
      )
        return null;
      const result = prepared.inspectResponse(saved.data.response);
      if (result.state !== "VALIDATED_CANDIDATE") return result;
      // Only expose reasons after the complete wire/evidence checks. Original
      // private candidates and previously paid prompt versions stay intact.
      const wire = JSON.parse(saved.data.response.text) as {
        findings: Array<{ id: string; reason: string }>;
      };
      return {
        ...result,
        findingReasons: Object.fromEntries(
          wire.findings.map((finding) => [finding.id, finding.reason]),
        ),
      };
    },
  };
}

/** Read only. Revalidates saved provider output and BOTH modalities against the
 * owner capture. Returns only display data, never raw rejected provider text. */
export function readUnifiedJourneyReview(
  attemptId: string,
  context: JourneyEvaluationContext,
  assessment: JourneyAssessmentSnapshot,
  raw: unknown,
  state: string,
  snapshotHash?: string,
) {
  let inspection: ReturnType<
    ReturnType<typeof prepareUnifiedJourneyReview>["inspect"]
  > = null;
  try {
    inspection = prepareUnifiedJourneyReview(attemptId, context).inspect(raw);
  } catch {
    /* Explicit failed/partial view, never paid fallback. */
  }
  const audio =
    context.snapshot.speakingLevel && !snapshotHash
      ? null
      : readJourneySessionAudio(
          context.quality?.sessionAudio,
          attemptId,
          context.locale,
          context.turns,
          context.snapshot.speakingLevel ? snapshotHash : undefined,
        );
  const result = buildJourneyUnifiedView({
    locale: context.locale,
    turns: context.turns,
    assessment,
    state,
    inspection:
      inspection?.state === "VALIDATED_CANDIDATE" ? inspection : undefined,
    findingReasons:
      inspection?.state === "VALIDATED_CANDIDATE"
        ? inspection.findingReasons
        : undefined,
    audio,
    technicallyComplete:
      ["NATURAL", "USER_END"].includes(context.closeReason) &&
      context.quality !== undefined &&
      !context.quality.pendingLearnerTurn,
    level: context.snapshot.speakingLevel,
    textIssues:
      inspection?.state === "REJECTED_CANDIDATE"
        ? inspection.inspection.issues.map((issue) => issue.code)
        : inspection && inspection.state !== "VALIDATED_CANDIDATE"
          ? [inspection.state]
          : raw && !inspection
            ? ["STORED_REVIEW_MISMATCH"]
            : [],
  });
  return result;
}
