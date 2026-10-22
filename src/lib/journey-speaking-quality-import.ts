import { createHash } from "node:crypto";
import { z } from "zod";
import { prepareJourneyQualityReview } from "./journey-speaking-quality-review";
import { prepareJourneyQualityEvidenceReview } from "./journey-speaking-quality-evidence-review";
import {
  JourneyCaptureQualitySchema,
  JourneyRecognitionSchema,
  JOURNEY_RUBRIC_VERSION,
  type JourneyAttemptSnapshot,
} from "./journey-speaking-attempt-contract";

const Pins = z
  .object({
    attemptId: z.string().min(1).max(100),
    captureHash: z.string().regex(/^[a-f0-9]{64}$/),
    snapshotHash: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict();
const Export = z.object({
  source: z.literal("HanGo Producción / Prisma Studio / read-only"),
  attempt: z.object({
    id: z.string(),
    userId: z.string(),
    lessonId: z.string(),
    rubricVersion: z.literal(JOURNEY_RUBRIC_VERSION),
    bankVersion: z.string(),
    locale: z.enum(["es", "en"]),
    status: z.literal("SEALED"),
    closeReason: z.enum([
      "NATURAL",
      "USER_END",
      "TECHNICAL_FAILURE",
      "ABANDONED",
    ]),
    snapshot: z.unknown(),
    snapshotHash: z.string(),
    captureHash: z.string(),
    captureQuality: JourneyCaptureQualitySchema.nullable(),
    turns: z
      .array(
        z.object({
          id: z.string(),
          sequence: z.number().int().nonnegative(),
          role: z.enum(["USER", "ASSISTANT"]),
          content: z.string(),
          recognition: JourneyRecognitionSchema.nullable(),
        }),
      )
      .max(80),
  }),
  originalEvaluation: z.object({
    score: z.number().nullable(),
    requestCount: z.number().int().nonnegative(),
    status: z.string(),
    usageLogId: z.string().nullable(),
  }),
});
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([key, item]) => [key, canonical(item)]),
    );
  return value;
}
function digest(value: unknown) {
  return createHash("sha256")
    .update(JSON.stringify(canonical(value)))
    .digest("hex");
}

/** Offline import preflight, NOT a DB import or authorization to send data.
 * Caller must obtain a scoped authorized export and independent expected pins.
 * A self-reported source label or hash cannot prove production ownership. */
export function prepareImportedJourneyQualityReview(
  raw: unknown,
  expected: z.infer<typeof Pins>,
  transport: "legacy" | "evidence" = "legacy",
) {
  const pins = Pins.parse(expected);
  const data = Export.parse(raw);
  const attempt = data.attempt;
  if (
    attempt.id !== pins.attemptId ||
    attempt.captureHash !== pins.captureHash ||
    attempt.snapshotHash !== pins.snapshotHash ||
    digest(attempt.snapshot) !== pins.snapshotHash
  )
    throw new Error("Imported attempt identity or snapshot integrity mismatch");
  const turns = attempt.turns.map((turn, index) => {
    if (turn.sequence !== index)
      throw new Error("Imported capture sequence mismatch");
    return {
      id: turn.id,
      sequence: turn.sequence,
      role: turn.role === "USER" ? ("user" as const) : ("assistant" as const),
      content: turn.content,
      ...(turn.recognition ? { recognition: turn.recognition } : {}),
    };
  });
  const capture = {
    closeReason: attempt.closeReason,
    turns: turns.map(({ role, content, recognition }) => ({
      role,
      content,
      ...(recognition ? { recognition } : {}),
    })),
    ...(attempt.captureQuality ? { quality: attempt.captureQuality } : {}),
  };
  if (digest(capture) !== pins.captureHash)
    throw new Error("Imported capture integrity mismatch");
  const snapshot = attempt.snapshot as JourneyAttemptSnapshot;
  if (snapshot.banks.version !== attempt.bankVersion)
    throw new Error("Imported bank version mismatch");
  const prepare =
    transport === "evidence"
      ? prepareJourneyQualityEvidenceReview
      : prepareJourneyQualityReview;
  const prepared = prepare({
    attemptId: attempt.id,
    locale: attempt.locale,
    snapshot,
    capture: {
      attemptId: attempt.id,
      lessonId: attempt.lessonId,
      closeReason: attempt.closeReason,
      turns,
      ...(attempt.captureQuality ? { quality: attempt.captureQuality } : {}),
    },
  });
  return {
    request: prepared.request,
    inspectResponse: prepared.inspectResponse,
    receipt: {
      source: data.source,
      attemptId: attempt.id,
      locale: attempt.locale,
      turnCount: turns.length,
      snapshotVerified: true as const,
      captureVerified: true as const,
      originalScore: data.originalEvaluation.score,
      originalRequestCount: data.originalEvaluation.requestCount,
      requestCharacters:
        prepared.request.instructions.length + prepared.request.input.length,
      paidRequestsExecuted: 0 as const,
      databaseWritesExecuted: 0 as const,
      readyForPaidDispatch: false as const,
    },
  };
}
