import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import { requireAdministrator } from "./admin-auth";
import { db } from "./db";
import { getJourneySpeakingAttempt } from "./journey-speaking-attempts";
import {
  JourneyCaptureQualitySchema,
  JourneyRecognitionSchema,
  hasUncertainJourneyRecognition,
  type JourneyAttemptSnapshot,
} from "./journey-speaking-attempt-contract";
import { JOURNEY_QUALITY_CANDIDATE_VERSION } from "./journey-speaking-quality-candidate";
import { prepareJourneyQualityReview } from "./journey-speaking-quality-review";
import { prepareJourneyQualityEvidenceReview } from "./journey-speaking-quality-evidence-review";
import { localJourneyQualityStore } from "./journey-speaking-quality-store";
import type { JourneyQualityReviewView } from "./journey-speaking-quality-view";

const pilotSlugs = [
  "foundations-greetings-and-introductions",
  "restaurant-entering-and-ordering",
  "negotiating-job-contract-reviewing-contract-terms",
];
const SavedResponse = z.object({
  request: z.object({
    promptVersion: z.string(),
    input: z.string().max(150_000),
  }),
  result: z.object({
    content: z.string().max(150_000),
    outputStatus: z.enum(["complete", "refused", "incomplete"]).optional(),
  }),
});
const Claim = z.object({
  version: z.literal(JOURNEY_QUALITY_CANDIDATE_VERSION),
  userId: z.string(),
  attemptId: z.string(),
  requestHash: z.string(),
});
const Summary = z.object({
  reviewKey: z.string(),
  state: z.string().max(80),
  usageLogId: z.string().max(100).nullable(),
});
const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");

/** Read-only. No import of the dispatch service, provider, or usage mutation. */
export async function getLocalJourneyQualityReview(
  attemptId?: string,
): Promise<JourneyQualityReviewView> {
  if (process.env.NODE_ENV !== "development")
    throw new Error("Private quality review is development-only");
  const administrator = await requireAdministrator();
  const rows = await db.journeySpeakingAttempt.findMany({
    where: {
      userId: administrator.id,
      status: "SEALED",
      lesson: { slug: { in: pilotSlugs } },
    },
    orderBy: [{ startedAt: "desc" }, { id: "desc" }],
    take: 20,
    select: {
      id: true,
      lessonId: true,
      startedAt: true,
      lesson: { select: { title: true } },
      evaluation: { select: { score: true } },
    },
  });
  const view: JourneyQualityReviewView = {
    attempts: rows.map((row) => ({
      id: row.id,
      lessonId: row.lessonId,
      title: row.lesson.title,
      date: row.startedAt.toISOString(),
      currentScore: row.evaluation?.score ?? null,
    })),
    selectedId: null,
    title: null,
    turns: [],
    state: rows.length ? "ATTEMPT_UNAVAILABLE" : "EMPTY",
    profile: null,
    issues: [],
    usage: null,
  };
  const selected = attemptId
    ? rows.find((row) => row.id === attemptId)
    : rows[0];
  if (!selected) return view;
  view.selectedId = selected.id;
  view.title = selected.lesson.title;
  // Verify the frozen hashes through the same ownership-enforcing reader.
  try {
    const attempt = await getJourneySpeakingAttempt(
      administrator.id,
      selected.id,
      selected.lessonId,
    );
    if (!attempt.closeReason || !["es", "en"].includes(attempt.locale))
      return { ...view, state: "UNAVAILABLE" };
    const turns = attempt.turns.map((turn) => ({
      id: turn.id,
      sequence: turn.sequence,
      role: turn.role === "USER" ? ("user" as const) : ("assistant" as const),
      content: turn.content,
      ...(turn.recognition
        ? { recognition: JourneyRecognitionSchema.parse(turn.recognition) }
        : {}),
    }));
    view.turns = turns.map((turn) => ({
      id: turn.id,
      role: turn.role,
      content: turn.content,
      uncertain: turn.role === "user" && hasUncertainJourneyRecognition(turn),
    }));
    const reviewInput = {
      attemptId: attempt.id,
      locale: attempt.locale as "es" | "en",
      snapshot: attempt.snapshot as unknown as JourneyAttemptSnapshot,
      capture: {
        attemptId: attempt.id,
        lessonId: attempt.lessonId,
        closeReason: attempt.closeReason,
        turns,
        ...(attempt.captureQuality
          ? {
              quality: JourneyCaptureQualitySchema.parse(
                attempt.captureQuality,
              ),
            }
          : {}),
      },
    };
    let prepared:
      | ReturnType<typeof prepareJourneyQualityReview>
      | ReturnType<typeof prepareJourneyQualityEvidenceReview> =
      prepareJourneyQualityReview(reviewInput);
    const reviewKey = hash(
      JSON.stringify([
        administrator.id,
        attempt.id,
        JOURNEY_QUALITY_CANDIDATE_VERSION,
      ]),
    );
    const claimRaw = await localJourneyQualityStore.readClaim(reviewKey);
    if (claimRaw === null) return { ...view, state: "NOT_RUN" };
    const claim = Claim.safeParse(claimRaw);
    if (
      !claim.success ||
      claim.data.userId !== administrator.id ||
      claim.data.attemptId !== attempt.id
    )
      return { ...view, state: "UNAVAILABLE" };
    if (claim.data.requestHash !== hash(prepared.request.input))
      prepared = prepareJourneyQualityEvidenceReview(reviewInput);
    if (claim.data.requestHash !== hash(prepared.request.input))
      return { ...view, state: "UNAVAILABLE" };
    const summary = Summary.safeParse(
      await localJourneyQualityStore.readSummary(reviewKey),
    );
    if (summary.success && summary.data.reviewKey !== reviewKey)
      return { ...view, state: "UNAVAILABLE" };
    view.state = summary.success ? summary.data.state : "RESERVED";
    if (summary.success && summary.data.usageLogId) {
      view.usage = await db.aiUsageLog.findFirst({
        where: {
          id: summary.data.usageLogId,
          userId: administrator.id,
          experience: "LESSON_REFLECTION",
        },
        select: {
          model: true,
          inputTokens: true,
          outputTokens: true,
          estimatedCostUsd: true,
        },
      });
    }
    const raw = await localJourneyQualityStore.readResponse(reviewKey);
    if (raw === null) return view;
    const saved = SavedResponse.safeParse(raw);
    if (
      !saved.success ||
      saved.data.request.input !== prepared.request.input ||
      saved.data.request.promptVersion !== prepared.request.promptVersion
    )
      return { ...view, state: "UNAVAILABLE" };
    const reviewed = prepared.inspectResponse({
      status:
        saved.data.result.outputStatus === "complete"
          ? "completed"
          : saved.data.result.outputStatus === "refused"
            ? "refused"
            : "incomplete",
      text: saved.data.result.content,
    });
    // Disk inspection.json is not blindly trusted; recompute locally, free.
    // A valid candidate does not conceal an unresolved metering/storage failure.
    if (view.state !== "STORAGE_OR_METERING_FAILED")
      view.state = reviewed.state;
    if (reviewed.state === "VALIDATED_CANDIDATE") {
      view.profile = reviewed.inspection.profile;
      view.pedagogy = reviewed.pedagogy;
    }
    if (reviewed.state === "REJECTED_CANDIDATE")
      view.issues = reviewed.inspection.issues
        .slice(0, 20)
        .map((issue) => issue.code);
    return view;
  } catch {
    return { ...view, state: "UNAVAILABLE", profile: null, issues: [] };
  }
}
