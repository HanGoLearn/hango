import { z } from "zod";
import {
  hasUncertainJourneyRecognition,
  type JourneyCapturedTurn,
} from "./journey-speaking-attempt-contract";

/** Offline candidate, deliberately NOT the active Journey rubric. No provider,
 * DB, rewards or numeric overall score. Structural consistency is not calibration.
 */
export const JOURNEY_QUALITY_CANDIDATE_VERSION =
  "journey-quality-candidate-2026-10-18-v1";
/** Inspector revision is separate from the response contract and dispatch key.
 * Tightening offline checks must not authorize purchasing another judgment. */
export const JOURNEY_QUALITY_INSPECTION_VERSION =
  "journey-quality-inspection-2026-10-18-v2";
const TextDimensions = [
  "communication",
  "vocabulary",
  "grammar",
  "interaction",
] as const;
type TextDimension = (typeof TextDimensions)[number];
const Id = z.string().trim().min(1).max(100);
const Citation = z
  .object({ turnId: Id, quote: z.string().min(1).max(240) })
  .strict();
const Citations = z.array(Citation).max(6);
const Dimension = z
  .object({
    observation: z.enum(["OBSERVED", "NOT_OBSERVED"]),
    level: z.number().int().min(0).max(4).nullable(),
    support: z.enum(["NONE", "OCCASIONAL", "CONTINUOUS", "UNKNOWN"]),
    reason: z.string().trim().min(1).max(400),
    citations: Citations,
  })
  .strict();
const Unmeasured = z.object({ status: z.literal("NOT_EVALUATED") }).strict();
const Finding = z
  .object({
    id: Id,
    targetId: Id,
    state: z.enum([
      "INDEPENDENT",
      "ASSISTED",
      "UNDERSTOOD",
      "ERROR",
      "SELF_CORRECTED",
      "NOT_OBSERVED",
      "NO_OPPORTUNITY",
    ]),
    opportunity: z.enum([
      "OFFERED",
      "LEARNER_INITIATED",
      "NONE",
      "INTERRUPTED",
    ]),
    citations: Citations,
    reason: z.string().trim().min(1).max(400),
    resolutionId: Id.nullable(),
    correction: z
      .object({
        chinese: z.string().trim().min(1).max(180),
        pinyin: z.string().trim().min(1).max(240),
        translation: z.string().trim().min(1).max(300),
      })
      .strict()
      .nullable(),
  })
  .strict();
export const JourneyQualityCandidateSchema = z
  .object({
    version: z.literal(JOURNEY_QUALITY_CANDIDATE_VERSION),
    attemptId: Id,
    locale: z.enum(["es", "en"]),
    dimensions: z
      .object({
        communication: Dimension,
        vocabulary: Dimension,
        grammar: Dimension,
        interaction: Dimension,
        pronunciation: Unmeasured,
        fluency: Unmeasured,
      })
      .strict(),
    findings: z.array(Finding).max(64),
  })
  .strict();
export type JourneyQualityCandidate = z.infer<
  typeof JourneyQualityCandidateSchema
>;
export type JourneyQualityTarget = {
  id: string;
  kind: "act" | "vocabulary" | "grammar";
  text: string;
  required: boolean;
};
export type JourneyQualityContext = {
  attemptId: string;
  locale: "es" | "en";
  lessonSlug: string;
  /** Server-selected targets, not a user/model quota of every lesson word. */
  targets: readonly JourneyQualityTarget[];
  turns: readonly JourneyCapturedTurn[];
  technicallyComplete: boolean;
};
type Reference = z.infer<typeof Citation>;
type Claim = z.infer<typeof Finding>;
type Issue = { code: string; itemId?: string };
export type JourneyQualityInspection =
  | { ok: false; issues: Issue[] }
  | {
      ok: true;
      profile: {
        version: typeof JOURNEY_QUALITY_CANDIDATE_VERSION;
        locale: "es" | "en";
        status: "CANDIDATE" | "PARTIAL_CANDIDATE";
        score: null;
        eligibleForRewards: false;
        dimensions: JourneyQualityCandidate["dimensions"];
        coverage: {
          required: number;
          independentlyDemonstrated: string[];
          assisted: string[];
          selfCorrected: string[];
          unconfirmed: string[];
        };
        /** Grounded input for a future UI, not an uncited free-form Han narrative. */
        feedback: Array<{
          findingId: string;
          targetId: string;
          targetText: string;
          state: Claim["state"];
          label: string;
          resolved: boolean;
          isPriority: boolean;
          quotes: Reference[];
          correction: Claim["correction"];
        }>;
        limitations: string[];
      };
    };

const Labels = {
  es: {
    INDEPENDENT: "Aplicación independiente",
    ASSISTED: "Aplicación con ayuda",
    UNDERSTOOD: "Comprensión demostrada",
    ERROR: "Aspecto por corregir",
    SELF_CORRECTED: "Autocorrección",
    NOT_OBSERVED: "Todavía no demostrado",
    NO_OPPORTUNITY: "Sin oportunidad para demostrarlo",
  },
  en: {
    INDEPENDENT: "Independent use",
    ASSISTED: "Use with support",
    UNDERSTOOD: "Demonstrated understanding",
    ERROR: "Correction to review",
    SELF_CORRECTED: "Self-correction",
    NOT_OBSERVED: "Not yet demonstrated",
    NO_OPPORTUNITY: "No opportunity to demonstrate",
  },
} as const;
const isAssent = (text: string) =>
  /^(?:好(?:的)?|对(?:的)?|是(?:的)?|嗯|明白(?:了)?|ok(?:ay)?|yes|sí|vale)[。.!！?？\s]*$/iu.test(
    text.trim(),
  );

export function inspectJourneyQualityCandidate(
  raw: unknown,
  context: JourneyQualityContext,
): JourneyQualityInspection {
  const parsed = JourneyQualityCandidateSchema.safeParse(raw);
  if (!parsed.success)
    return { ok: false, issues: [{ code: "INVALID_SCHEMA" }] };
  const judgment = parsed.data;
  const issues: Issue[] = [];
  const fail = (code: string, itemId?: string) =>
    issues.push({ code, ...(itemId ? { itemId } : {}) });
  if (
    judgment.attemptId !== context.attemptId ||
    judgment.locale !== context.locale
  )
    fail("WRONG_ATTEMPT_OR_LOCALE");
  const turns = new Map(context.turns.map((turn) => [turn.id, turn]));
  const targets = new Map(context.targets.map((target) => [target.id, target]));
  const findings = new Map(
    judgment.findings.map((finding) => [finding.id, finding]),
  );
  if (
    turns.size !== context.turns.length ||
    targets.size !== context.targets.length ||
    findings.size !== judgment.findings.length
  )
    fail("DUPLICATE_ID");
  if (
    new Set(context.turns.map((turn) => turn.sequence)).size !==
    context.turns.length
  )
    fail("DUPLICATE_TURN_SEQUENCE");
  const learner = (citations: Reference[]) =>
    citations.filter((cite) => turns.get(cite.turnId)?.role === "user");
  function citationsValid(
    citations: Reference[],
    itemId: string,
    requireUser: boolean,
  ) {
    for (const cite of citations) {
      const turn = turns.get(cite.turnId);
      if (!turn || !turn.content.includes(cite.quote))
        fail("UNBACKED_CITATION", itemId);
      if (turn?.role === "user" && hasUncertainJourneyRecognition(turn))
        fail("UNCERTAIN_RECOGNITION", itemId);
    }
    if (requireUser && !learner(citations).length)
      fail("MISSING_LEARNER_EVIDENCE", itemId);
  }
  function occursAfter(a: Reference, b: Reference) {
    const first = turns.get(a.turnId),
      second = turns.get(b.turnId);
    if (!first || !second) return false;
    return (
      second.sequence > first.sequence ||
      (first.id === second.id &&
        first.content.indexOf(b.quote) >=
          first.content.indexOf(a.quote) + a.quote.length)
    );
  }
  const precedingPartner = (citations: Reference[]) =>
    citations.some(
      (cite) =>
        turns.get(cite.turnId)?.role === "assistant" &&
        learner(citations).some((user) => occursAfter(cite, user)),
    );
  // Sequence adjacency, not array adjacency: an omitted/uncertain turn must
  // never be reconstructed from the character's reply.
  const exchangePair = (citations: Reference[]) =>
    citations.some((cite) => {
      const partner = turns.get(cite.turnId);
      return (
        partner?.role === "assistant" &&
        learner(citations).some((user) => {
          const answer = turns.get(user.turnId);
          return answer && Math.abs(partner.sequence - answer.sequence) === 1;
        })
      );
    });
  const eventKeys = new Set<string>();
  for (const finding of judgment.findings) {
    const target = targets.get(finding.targetId);
    if (!target) {
      fail("UNKNOWN_TARGET", finding.id);
      continue;
    }
    const unobserved = ["NOT_OBSERVED", "NO_OPPORTUNITY"].includes(
      finding.state,
    );
    citationsValid(finding.citations, finding.id, !unobserved);
    const users = learner(finding.citations);
    if (unobserved && users.length)
      fail("UNOBSERVED_WITH_PRODUCTION", finding.id);
    if (!unobserved && ["NONE", "INTERRUPTED"].includes(finding.opportunity))
      fail("PRODUCTION_WITHOUT_OPPORTUNITY", finding.id);
    if (
      finding.state === "NO_OPPORTUNITY" &&
      !["NONE", "INTERRUPTED"].includes(finding.opportunity)
    )
      fail("OPPORTUNITY_STATE_CONFLICT", finding.id);
    if (finding.state === "ASSISTED") {
      const hints = finding.citations.filter(
        (cite) => turns.get(cite.turnId)?.role === "assistant",
      );
      if (!hints.some((hint) => users.some((user) => occursAfter(hint, user))))
        fail("MISSING_PRECEDING_MODEL", finding.id);
    }
    if (
      finding.state === "UNDERSTOOD" &&
      users.length &&
      users.every((cite) => isAssent(cite.quote))
    )
      fail("GENERIC_ASSENT", finding.id);
    if (
      target.kind === "vocabulary" &&
      ["INDEPENDENT", "ASSISTED"].includes(finding.state) &&
      !users.some((cite) => cite.quote.includes(target.text))
    )
      fail("WORD_NOT_PRODUCED", finding.id);
    if (
      target.kind === "vocabulary" &&
      finding.state === "ERROR" &&
      !users.some((cite) => cite.quote.includes(target.text)) &&
      !finding.correction?.chinese.includes(target.text)
    )
      fail("ERROR_TARGET_NOT_GROUNDED", finding.id);
    if (
      finding.state === "SELF_CORRECTED" &&
      !users.some((first) =>
        users.some(
          (second) =>
            first.quote !== second.quote && occursAfter(first, second),
        ),
      )
    )
      fail("MISSING_SELF_REPAIR", finding.id);
    if (finding.correction && finding.state !== "ERROR")
      fail("CORRECTION_WITHOUT_ERROR", finding.id);
    if (
      finding.state === "ERROR" &&
      ["vocabulary", "grammar"].includes(target.kind) &&
      !finding.correction
    )
      fail("ERROR_WITHOUT_ACTIONABLE_EXAMPLE", finding.id);
    if (finding.resolutionId) {
      const resolution = findings.get(finding.resolutionId);
      if (
        finding.state !== "ERROR" ||
        !resolution ||
        resolution.targetId !== finding.targetId ||
        !["INDEPENDENT", "SELF_CORRECTED"].includes(resolution.state) ||
        !users.some((error) =>
          learner(resolution.citations).some((repair) =>
            occursAfter(error, repair),
          ),
        )
      )
        fail("INVALID_ERROR_RESOLUTION", finding.id);
    }
    const key = `${finding.targetId}:${finding.citations
      .map((cite) => `${cite.turnId}:${cite.quote}`)
      .sort()
      .join("|")}`;
    if (eventKeys.has(key)) fail("DUPLICATE_FINDING_EVENT", finding.id);
    eventKeys.add(key);
  }
  const relevant = (dimension: TextDimension) =>
    judgment.findings.filter((finding) => {
      const kind = targets.get(finding.targetId)?.kind;
      return dimension === "vocabulary"
        ? kind === "vocabulary"
        : dimension === "grammar"
          ? kind === "grammar"
          : dimension === "communication"
            ? kind === "act"
            : true;
    });
  for (const key of TextDimensions) {
    const dimension = judgment.dimensions[key];
    const observed = dimension.observation === "OBSERVED";
    if (observed !== (dimension.level !== null))
      fail("OBSERVATION_LEVEL_CONFLICT", key);
    citationsValid(dimension.citations, key, observed);
    if (!observed && dimension.citations.length)
      fail("UNOBSERVED_DIMENSION_WITH_CITATIONS", key);
    if (
      key === "interaction" &&
      observed &&
      !dimension.citations.some(
        (cite) => turns.get(cite.turnId)?.role === "assistant",
      )
    )
      fail("MISSING_INTERLOCUTOR_CONTEXT", key);
    else if (
      key === "interaction" &&
      observed &&
      !exchangePair(dimension.citations)
    )
      fail("MISSING_LINKED_EXCHANGE", key);
    if (
      observed &&
      ["OCCASIONAL", "CONTINUOUS"].includes(dimension.support) &&
      !precedingPartner(dimension.citations)
    )
      fail("SUPPORT_WITHOUT_PRECEDING_EVIDENCE", key);
    if (
      key === "interaction" &&
      dimension.level === 4 &&
      ["CONTINUOUS", "UNKNOWN"].includes(dimension.support)
    )
      fail("MAXIMUM_WITH_UNCONFIRMED_AUTONOMY", key);
    if (!observed) continue;
    const items = relevant(key);
    if (
      ["vocabulary", "grammar"].includes(key) &&
      items.some(
        (item) => !["NOT_OBSERVED", "NO_OPPORTUNITY"].includes(item.state),
      ) &&
      !items.some(
        (item) =>
          !["NOT_OBSERVED", "NO_OPPORTUNITY"].includes(item.state) &&
          learner(item.citations).some((cite) =>
            learner(dimension.citations).some(
              (own) =>
                own.turnId === cite.turnId &&
                (own.quote.includes(cite.quote) ||
                  cite.quote.includes(own.quote)),
            ),
          ),
      )
    )
      fail("DIMENSION_EVIDENCE_NOT_LINKED", key);
    if (
      key !== "interaction" &&
      !items.some(
        (item) => !["NOT_OBSERVED", "NO_OPPORTUNITY"].includes(item.state),
      )
    )
      fail("DIMENSION_WITHOUT_FINDINGS", key);
    // Do not double-penalize every grammar error in interaction automatically.
    if (
      key !== "interaction" &&
      dimension.level === 4 &&
      items.some((item) => item.state === "ERROR" && !item.resolutionId)
    )
      fail("MAXIMUM_WITH_UNRESOLVED_ERROR", key);
    if (["grammar", "vocabulary"].includes(key) && dimension.level === 4) {
      const demonstrated = items.filter((item) =>
        ["INDEPENDENT", "SELF_CORRECTED"].includes(item.state),
      );
      if (!demonstrated.length) fail("MAXIMUM_WITHOUT_INDEPENDENT_USE", key);
      const assistedOnly = items.some(
        (item) =>
          item.state === "ASSISTED" &&
          !demonstrated.some(
            (transfer) =>
              transfer.targetId === item.targetId &&
              learner(item.citations).some((before) =>
                learner(transfer.citations).some((after) =>
                  occursAfter(before, after),
                ),
              ),
          ),
      );
      if (assistedOnly) fail("MAXIMUM_WITH_ASSISTANCE_ONLY", key);
    }
  }
  if (issues.length) return { ok: false, issues };
  const required = context.targets.filter((target) => target.required);
  const latest = (targetId: string) =>
    judgment.findings
      .filter(
        (finding) =>
          finding.targetId === targetId && learner(finding.citations).length,
      )
      .map((finding) => ({
        finding,
        position: learner(finding.citations)
          .map((cite) => {
            const turn = turns.get(cite.turnId)!;
            return {
              sequence: turn.sequence,
              offset: turn.content.indexOf(cite.quote),
            };
          })
          .sort((a, b) => b.sequence - a.sequence || b.offset - a.offset)[0]!,
      }))
      .sort(
        (a, b) =>
          b.position.sequence - a.position.sequence ||
          b.position.offset - a.position.offset,
      )[0]?.finding;
  const independentlyDemonstrated = required
    .filter((target) => latest(target.id)?.state === "INDEPENDENT")
    .map((target) => target.id);
  const assisted = required
    .filter((target) => latest(target.id)?.state === "ASSISTED")
    .map((target) => target.id);
  const selfCorrected = required
    .filter((target) => latest(target.id)?.state === "SELF_CORRECTED")
    .map((target) => target.id);
  const unconfirmed = required
    .filter(
      (target) =>
        !independentlyDemonstrated.includes(target.id) &&
        !assisted.includes(target.id) &&
        !selfCorrected.includes(target.id),
    )
    .map((target) => target.id);
  const limitations = ["NO_CALIBRATED_AUDIO", "HUMAN_CALIBRATION_PENDING"];
  if (unconfirmed.length) limitations.push("REQUIRED_TARGETS_UNCONFIRMED");
  if (!context.technicallyComplete) limitations.push("TECHNICAL_CAPTURE");
  if (
    TextDimensions.some(
      (key) => judgment.dimensions[key].observation !== "OBSERVED",
    )
  )
    limitations.push("UNOBSERVED_DIMENSIONS");
  return {
    ok: true,
    profile: {
      version: JOURNEY_QUALITY_CANDIDATE_VERSION,
      locale: context.locale,
      status: limitations.length > 2 ? "PARTIAL_CANDIDATE" : "CANDIDATE",
      score: null,
      eligibleForRewards: false,
      dimensions: judgment.dimensions,
      coverage: {
        required: required.length,
        independentlyDemonstrated,
        assisted,
        selfCorrected,
        unconfirmed,
      },
      feedback: judgment.findings.map((finding) => ({
        findingId: finding.id,
        targetId: finding.targetId,
        state: finding.state,
        targetText: targets.get(finding.targetId)!.text,
        label:
          finding.state === "ERROR" && finding.resolutionId
            ? context.locale === "es"
              ? "Error corregido después"
              : "Error corrected later"
            : Labels[context.locale][finding.state],
        resolved: finding.state === "ERROR" && Boolean(finding.resolutionId),
        isPriority: finding.state === "ERROR" && !finding.resolutionId,
        quotes: finding.citations,
        correction: finding.correction,
      })),
      limitations,
    },
  };
}
