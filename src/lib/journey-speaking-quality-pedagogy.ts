import {
  JourneyQualityCandidateSchema,
  type JourneyQualityContext,
} from "./journey-speaking-quality-candidate";
import { hasUncertainJourneyRecognition } from "./journey-speaking-attempt-contract";
import {
  journeyActEvidenceRule,
  probeJourneyActEvidence,
  type JourneyActEvidenceRule,
} from "./journey-speaking-quality-act-evidence";

export const JOURNEY_PEDAGOGY_AUDIT_VERSION =
  "journey-pedagogy-audit-2026-10-18-v3";

type Citation = { turnId: string; quote: string };
type Notice = { code: string; itemId?: string };
export type JourneyPedagogyAudit = {
  version: typeof JOURNEY_PEDAGOGY_AUDIT_VERSION;
  /** A narrow pattern check is NOT a teacher's approval or a new grade. */
  decision: "HOLD";
  studentReady: false;
  score: null;
  notices: Notice[];
  coverage: {
    clearLearnerTurns: number;
    citedLearnerTurns: number;
    turns: Array<{
      turnId: string;
      sequence: number;
      status: "CITED" | "UNCITED" | "EXCLUDED_UNCERTAIN";
    }>;
    requiredTargetsConfigured: boolean;
  };
  acts: Array<{
    findingId: string;
    targetId: string;
    rule: JourneyActEvidenceRule | null;
    status: "PATTERN_SUPPORTED" | "EVIDENCE_MISMATCH" | "NEEDS_REVIEW";
    supportingQuotes: Citation[];
    /** Separate suggestions for a reviewer, NEVER substituted into findings. */
    otherSupportedQuotes: Citation[];
  }>;
};

/** Offline sidecar for a structurally valid judgment. Does not repair its
 * citations/reasons/levels, change request hashes, or authorize another call.
 * Original provider prose is kept private; never returned as student feedback.
 */
export function auditJourneyQualityPedagogy(
  raw: unknown,
  context: JourneyQualityContext,
): JourneyPedagogyAudit {
  const candidate = JourneyQualityCandidateSchema.parse(raw);
  if (
    candidate.attemptId !== context.attemptId ||
    candidate.locale !== context.locale
  )
    throw new Error("Pedagogy audit identity mismatch");
  const turns = new Map(context.turns.map((turn) => [turn.id, turn]));
  const targets = new Map(context.targets.map((target) => [target.id, target]));
  const validLearner = (cite: Citation) => {
    const turn = turns.get(cite.turnId);
    return (
      turn?.role === "user" &&
      !hasUncertainJourneyRecognition(turn) &&
      turn.content.includes(cite.quote)
    );
  };
  const allCitations = [
    ...Object.values(candidate.dimensions).flatMap((item) =>
      "citations" in item ? item.citations : [],
    ),
    ...candidate.findings.flatMap((item) => item.citations),
  ];
  const cited = new Set(
    allCitations.filter(validLearner).map((cite) => cite.turnId),
  );
  const coverageTurns = context.turns
    .filter((turn) => turn.role === "user")
    .map((turn) => ({
      turnId: turn.id,
      sequence: turn.sequence,
      status: hasUncertainJourneyRecognition(turn)
        ? ("EXCLUDED_UNCERTAIN" as const)
        : cited.has(turn.id)
          ? ("CITED" as const)
          : ("UNCITED" as const),
    }))
    .sort((a, b) => a.sequence - b.sequence);
  const notices: Notice[] = [
    { code: "HUMAN_CALIBRATION_PENDING" },
    { code: "MODEL_PROSE_NOT_APPROVED_FOR_STUDENT" },
  ];
  if (coverageTurns.some((turn) => turn.status === "UNCITED"))
    notices.push({ code: "UNCITED_LEARNER_TURNS" });
  const requiredTargetsConfigured = context.targets.some(
    (target) => target.required,
  );
  if (!requiredTargetsConfigured)
    notices.push({ code: "REQUIRED_TARGETS_NOT_CONFIGURED" });
  const acts: JourneyPedagogyAudit["acts"] = [];
  for (const finding of candidate.findings) {
    if (finding.state === "NO_OPPORTUNITY")
      notices.push({
        code: "OPPORTUNITY_REQUIRES_CONTEXT_REVIEW",
        itemId: finding.id,
      });
    if (
      targets.get(finding.targetId)?.kind !== "act" ||
      !["INDEPENDENT", "ASSISTED", "SELF_CORRECTED"].includes(finding.state)
    )
      continue;
    const selected = finding.citations.filter(validLearner);
    const rule = journeyActEvidenceRule(
      context.lessonSlug,
      targets.get(finding.targetId)!,
    );
    if (
      rule?.startsWith("contract-") &&
      /(?:using |usando )/u.test(targets.get(finding.targetId)!.text)
    )
      notices.push({
        code: "ACT_FORM_REQUIREMENT_REQUIRES_SEPARATE_REVIEW",
        itemId: finding.id,
      });
    const probe = (cite: Citation) =>
      rule
        ? probeJourneyActEvidence(rule, cite.quote, cite.turnId, context)
        : "NEEDS_REVIEW";
    const supportingQuotes = selected.filter(
      (cite) => probe(cite) === "PATTERN_SUPPORTED",
    );
    const mismatch =
      selected.length > 0 &&
      !supportingQuotes.length &&
      selected.every((cite) => probe(cite) === "EVIDENCE_MISMATCH");
    const otherSupportedQuotes = rule
      ? context.turns
          .filter(
            (turn) =>
              turn.role === "user" &&
              !hasUncertainJourneyRecognition(turn) &&
              turn.content.length <= 240 &&
              !selected.some((cite) => cite.turnId === turn.id),
          )
          .filter(
            (turn) =>
              probeJourneyActEvidence(rule, turn.content, turn.id, context) ===
              "PATTERN_SUPPORTED",
          )
          .map((turn) => ({ turnId: turn.id, quote: turn.content }))
          .slice(0, 6)
      : [];
    const status = supportingQuotes.length
      ? ("PATTERN_SUPPORTED" as const)
      : mismatch
        ? ("EVIDENCE_MISMATCH" as const)
        : ("NEEDS_REVIEW" as const);
    acts.push({
      findingId: finding.id,
      targetId: finding.targetId,
      rule,
      status,
      supportingQuotes,
      otherSupportedQuotes,
    });
    if (status !== "PATTERN_SUPPORTED")
      notices.push({
        code: mismatch
          ? "ACT_EVIDENCE_MISMATCH"
          : "ACT_SEMANTICS_REQUIRES_REVIEW",
        itemId: finding.id,
      });
  }
  return {
    version: JOURNEY_PEDAGOGY_AUDIT_VERSION,
    decision: "HOLD",
    studentReady: false,
    score: null,
    notices,
    coverage: {
      clearLearnerTurns: coverageTurns.filter(
        (turn) => turn.status !== "EXCLUDED_UNCERTAIN",
      ).length,
      citedLearnerTurns: coverageTurns.filter((turn) => turn.status === "CITED")
        .length,
      turns: coverageTurns,
      requiredTargetsConfigured,
    },
    acts,
  };
}
