import { z } from "zod";

/** Phase-2 prototype only. No browser capture, provider, storage, DB or grade.
 * The context MUST be assembled from verified server-owned audio metadata, not
 * accepted as client/provider assertions. Matching IDs is not audio verification.
 */
const Id = z.string().trim().min(1).max(100);
const Segment = z
  .object({
    startMs: z.number().int().min(0),
    endMs: z.number().int().positive(),
  })
  .strict();
const CandidateSchema = z
  .object({
    attemptId: Id,
    locale: z.enum(["es", "en"]),
    findings: z
      .array(
        z
          .object({
            turnId: Id,
            audioRefId: Id,
            category: z.enum(["tone", "articulation", "rhythm"]),
            segment: Segment,
            heard: z.string().trim().min(1).max(180),
            target: z.string().trim().min(1).max(180),
            explanation: z.string().trim().min(1).max(400),
            practice: z.string().trim().min(1).max(300),
          })
          .strict(),
      )
      .max(40),
  })
  .strict();

export type JourneyAcousticCandidate = z.infer<typeof CandidateSchema>;
export type JourneyAcousticReviewContext = {
  attemptId: string;
  locale: "es" | "en";
  source: "TRANSCRIPT_ONLY" | "REALTIME_AUDIO" | "PRIVATE_RECORDING";
  additionalReviewAuthorized: boolean;
  evidenceVerified: boolean;
  turns: Array<{
    id: string;
    role: "user" | "assistant";
    audio?: {
      refId: string;
      durationMs: number;
      complete: boolean;
      quality: "USABLE" | "UNUSABLE" | "UNKNOWN";
      containsSpeech: boolean | null;
    };
  }>;
};
type Exclusion = {
  index: number;
  reason:
    | "UNSUPPORTED_TURN"
    | "UNUSABLE_AUDIO"
    | "WRONG_AUDIO_REFERENCE"
    | "INVALID_SEGMENT"
    | "DUPLICATE_FINDING";
};
export type JourneyAcousticReviewGate = {
  status: "INVALID_CANDIDATE" | "NOT_EVALUABLE" | "REVIEWABLE";
  reason:
    | "INVALID_SCHEMA"
    | "WRONG_ATTEMPT_OR_LOCALE"
    | "DUPLICATE_CONTEXT_ID"
    | "TRANSCRIPT_ONLY"
    | "REVIEW_NOT_AUTHORIZED"
    | "UNVERIFIED_AUDIO"
    | "NO_USABLE_LEARNER_AUDIO"
    | "ALL_FINDINGS_EXCLUDED"
    | "HUMAN_REVIEW_REQUIRED";
  // Even an empty, well-formed result cannot mean "perfect pronunciation".
  score: null;
  eligibleForScoring: false;
  coverage: { learnerTurns: number; usableLearnerAudioTurns: number };
  findings: JourneyAcousticCandidate["findings"];
  excluded: Exclusion[];
};

function usable(audio: JourneyAcousticReviewContext["turns"][number]["audio"]) {
  return Boolean(
    audio &&
    audio.refId &&
    Number.isSafeInteger(audio.durationMs) &&
    audio.durationMs > 0 &&
    audio.complete &&
    audio.quality === "USABLE" &&
    audio.containsSpeech === true,
  );
}

/** Prepares bounded, anchored candidates for manual calibration. It cannot
 * establish whether a sound was correct, detect noise or certify tone errors.
 */
export function inspectJourneyAcousticCandidate(
  raw: unknown,
  context: JourneyAcousticReviewContext,
): JourneyAcousticReviewGate {
  const learners = context.turns.filter((turn) => turn.role === "user");
  const coverage = {
    learnerTurns: learners.length,
    usableLearnerAudioTurns: learners.filter((turn) => usable(turn.audio))
      .length,
  };
  const result = (
    status: JourneyAcousticReviewGate["status"],
    reason: JourneyAcousticReviewGate["reason"],
    findings: JourneyAcousticCandidate["findings"] = [],
    excluded: Exclusion[] = [],
  ): JourneyAcousticReviewGate => ({
    status,
    reason,
    score: null,
    eligibleForScoring: false,
    coverage,
    findings,
    excluded,
  });
  const candidate = CandidateSchema.safeParse(raw);
  if (!candidate.success) return result("INVALID_CANDIDATE", "INVALID_SCHEMA");
  if (
    candidate.data.attemptId !== context.attemptId ||
    candidate.data.locale !== context.locale
  )
    return result("INVALID_CANDIDATE", "WRONG_ATTEMPT_OR_LOCALE");
  const byId = new Map(context.turns.map((turn) => [turn.id, turn]));
  if (byId.size !== context.turns.length)
    return result("INVALID_CANDIDATE", "DUPLICATE_CONTEXT_ID");
  if (!context.additionalReviewAuthorized)
    return result("NOT_EVALUABLE", "REVIEW_NOT_AUTHORIZED");
  if (context.source === "TRANSCRIPT_ONLY")
    return result("NOT_EVALUABLE", "TRANSCRIPT_ONLY");
  if (!context.evidenceVerified)
    return result("NOT_EVALUABLE", "UNVERIFIED_AUDIO");
  if (!coverage.usableLearnerAudioTurns)
    return result("NOT_EVALUABLE", "NO_USABLE_LEARNER_AUDIO");
  const findings: JourneyAcousticCandidate["findings"] = [];
  const excluded: Exclusion[] = [];
  const seen = new Set<string>();
  candidate.data.findings.forEach((finding, index) => {
    const turn = byId.get(finding.turnId);
    let reason: Exclusion["reason"] | null = null;
    if (!turn || turn.role !== "user") reason = "UNSUPPORTED_TURN";
    else if (!usable(turn.audio)) reason = "UNUSABLE_AUDIO";
    else if (turn.audio!.refId !== finding.audioRefId)
      reason = "WRONG_AUDIO_REFERENCE";
    else if (
      finding.segment.endMs <= finding.segment.startMs ||
      finding.segment.endMs > turn.audio!.durationMs
    )
      reason = "INVALID_SEGMENT";
    const key = `${finding.turnId}:${finding.category}:${finding.segment.startMs}:${finding.segment.endMs}`;
    if (!reason && seen.has(key)) reason = "DUPLICATE_FINDING";
    if (reason) excluded.push({ index, reason });
    else {
      seen.add(key);
      findings.push(finding);
    }
  });
  if (candidate.data.findings.length && !findings.length)
    return result("NOT_EVALUABLE", "ALL_FINDINGS_EXCLUDED", [], excluded);
  return result("REVIEWABLE", "HUMAN_REVIEW_REQUIRED", findings, excluded);
}
