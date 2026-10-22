import { z } from "zod";
import { prepareJourneyQualityReview } from "./journey-speaking-quality-review";
import { buildJourneyQualityContext } from "./journey-speaking-quality-context";
import {
  JourneyQualityCandidateSchema,
  inspectJourneyQualityCandidate,
} from "./journey-speaking-quality-candidate";
import { hasUncertainJourneyRecognition } from "./journey-speaking-attempt-contract";
import { auditJourneyQualityPedagogy } from "./journey-speaking-quality-pedagogy";

export const JOURNEY_EVIDENCE_TRANSPORT_VERSION =
  "journey-evidence-selection-2026-10-18-v1";
export const JOURNEY_EVIDENCE_PROMPT_VERSION =
  "journey-quality-evidence-review-2026-10-18-v1";
const Selection = {
  learnerEvidenceIds: z.array(z.string().min(1).max(40)).max(6),
  partnerEvidenceIds: z.array(z.string().min(1).max(40)).max(6),
};
const Dimension =
  JourneyQualityCandidateSchema.shape.dimensions.shape.communication
    .omit({ citations: true })
    .extend(Selection)
    .strict();
const Finding = JourneyQualityCandidateSchema.shape.findings.element
  .omit({ citations: true })
  .extend(Selection)
  .strict();
const Wire = JourneyQualityCandidateSchema.extend({
  transportVersion: z.literal(JOURNEY_EVIDENCE_TRANSPORT_VERSION),
  dimensions: z
    .object({
      communication: Dimension,
      vocabulary: Dimension,
      grammar: Dimension,
      interaction: Dimension,
      pronunciation:
        JourneyQualityCandidateSchema.shape.dimensions.shape.pronunciation,
      fluency: JourneyQualityCandidateSchema.shape.dimensions.shape.fluency,
    })
    .strict(),
  findings: z.array(Finding).max(64),
}).strict();
type Evidence = { id: string; turnId: string; sequence: number; quote: string };

/** This is a different TRANSPORT, not a repair of old provider judgments.
 * Identity, text and target eligibility are server-owned. No API/DB imports. */
export function prepareJourneyQualityEvidenceReview(
  input: Parameters<typeof buildJourneyQualityContext>[0],
) {
  const context = buildJourneyQualityContext(input);
  const legacy = prepareJourneyQualityReview(input);
  const learner: Evidence[] = [],
    partner: Evidence[] = [];
  for (const turn of context.turns) {
    if (turn.role === "user" && hasUncertainJourneyRecognition(turn)) continue;
    // Fixed exact UTF-16 slices, no trimming, normalization or invented words.
    // Both catalog and inspection use these same frozen fragments.
    for (let offset = 0; offset < turn.content.length; offset += 240) {
      const item = {
        id: `${turn.role === "user" ? "L" : "P"}${turn.sequence}_${offset / 240}`,
        turnId: turn.id,
        sequence: turn.sequence,
        quote: turn.content.slice(offset, offset + 240),
      };
      (turn.role === "user" ? learner : partner).push(item);
    }
    // A word crossing a fixed chunk boundary must not become "unobserved".
    // Additional windows preserve exact original text and are server-owned.
    if (turn.role === "user") {
      const added = new Set<number>();
      for (const target of context.targets.filter(
        (item) => item.kind === "vocabulary",
      )) {
        for (
          let offset = turn.content.indexOf(target.text);
          offset >= 0;
          offset = turn.content.indexOf(target.text, offset + 1)
        ) {
          if (target.text.length > 240)
            throw new Error("Vocabulary target exceeds citation capacity");
          if (
            Math.floor(offset / 240) ===
              Math.floor((offset + target.text.length - 1) / 240) ||
            added.has(offset)
          )
            continue;
          added.add(offset);
          const start = Math.max(
            0,
            offset - Math.min(80, 240 - target.text.length),
          );
          learner.push({
            id: `L${turn.sequence}_x${offset}`,
            turnId: turn.id,
            sequence: turn.sequence,
            quote: turn.content.slice(start, start + 240),
          });
        }
      }
    }
  }
  const learnerMap = new Map(learner.map((item) => [item.id, item]));
  const partnerMap = new Map(partner.map((item) => [item.id, item]));
  const eligible = new Map(
    context.targets.map((target) => [
      target.id,
      learner
        .filter(
          (item) =>
            target.kind !== "vocabulary" || item.quote.includes(target.text),
        )
        .map((item) => item.id),
    ]),
  );
  // Never silently exclude evidence to fit a schema. A too-large request must
  // be redesigned offline, not sent without its original context.
  if (learner.length + partner.length > 160)
    throw new Error("Evidence catalog too large");
  const schema = z.toJSONSchema(Wire) as Record<string, unknown>;
  delete schema.$schema;
  type Json = Record<string, unknown>;
  const props = schema.properties as Json;
  props.attemptId = { type: "string", enum: [context.attemptId] };
  props.locale = { type: "string", enum: [context.locale] };
  // Shared definitions avoid duplicating global enums in every target branch.
  const definitions: Json = {
    learnerId: {
      type: "string",
      ...(learner.length ? { enum: learner.map((x) => x.id) } : {}),
    },
    partnerId: {
      type: "string",
      ...(partner.length ? { enum: partner.map((x) => x.id) } : {}),
    },
  };
  const refs = (kind: "learner" | "partner", allowed?: string[]) => {
    const count =
      allowed?.length ?? (kind === "learner" ? learner.length : partner.length);
    return {
      type: "array",
      maxItems: count ? 6 : 0,
      items: allowed?.length
        ? { type: "string", enum: allowed }
        : { $ref: `#/$defs/${kind}Id` },
    };
  };
  const dimensions = (props.dimensions as Json).properties as Json;
  for (const key of ["communication", "vocabulary", "grammar", "interaction"]) {
    const item = (dimensions[key] as Json).properties as Json;
    item.learnerEvidenceIds = refs("learner");
    item.partnerEvidenceIds = refs("partner");
  }
  const findingTemplate = (props.findings as Json).items as Json;
  const branches = context.targets.map((target) => {
    const branch = structuredClone(findingTemplate);
    const item = branch.properties as Json;
    item.targetId = { type: "string", enum: [target.id] };
    item.learnerEvidenceIds =
      target.kind === "vocabulary"
        ? refs("learner", eligible.get(target.id)!)
        : refs("learner");
    item.partnerEvidenceIds = refs("partner");
    // No production/error claim for vocabulary absent from clear learner text.
    // A future substitution/omission diagnostic needs its own grounded contract.
    if (target.kind === "vocabulary" && !eligible.get(target.id)!.length)
      item.state = { type: "string", enum: ["NOT_OBSERVED", "NO_OPPORTUNITY"] };
    return branch;
  });
  props.findings = branches.length
    ? { type: "array", maxItems: 64, items: { anyOf: branches } }
    : { type: "array", maxItems: 0, items: findingTemplate };
  schema.$defs = definitions;
  let enumCount = 0;
  function countEnums(value: unknown) {
    if (Array.isArray(value)) {
      value.forEach(countEnums);
      return;
    }
    if (value && typeof value === "object") {
      for (const [key, item] of Object.entries(value)) {
        if (key === "enum" && Array.isArray(item)) enumCount += item.length;
        else countEnums(item);
      }
    }
  }
  countEnums(schema);
  if (enumCount > 1000 || JSON.stringify(schema).length > 180000)
    throw new Error("Constrained schema exceeds safe request size");

  const oldPayload = JSON.parse(legacy.request.input);
  const payload = {
    ...oldPayload,
    // No mixed-role IDs: the model sees separate labeled catalogs. Real DB IDs
    // are not writable/copyable in the output contract at all.
    turns: learner.map(({ id, sequence, quote }) => ({
      id,
      sequence,
      role: "user",
      content: quote,
    })),
    partnerContext: partner.map(({ id, sequence, quote }) => ({
      id,
      sequence,
      role: "assistant",
      content: quote,
    })),
    targets: oldPayload.targets.map((target: { id: string }) => ({
      ...target,
      eligibleLearnerEvidenceIds: eligible.get(target.id),
    })),
    transportVersion: JOURNEY_EVIDENCE_TRANSPORT_VERSION,
  };
  const instructions =
    legacy.request.instructions +
    "\n" +
    [
      "EVIDENCE SELECTION TRANSPORT: This section overrides all earlier JSON quote/citation format instructions. Do NOT output quotes or turnIds. Choose learnerEvidenceIds only from the L catalog and partnerEvidenceIds only from the P context. The server supplies the original quotes; you cannot reassign their author. Choose ONLY eligible learner IDs for the exact target. An absent vocabulary item cannot be declared produced or erroneous in this transport.",
      "Use the same separate IDs in every dimension. Interaction needs a real adjacent L/P exchange. Partner context explains the response but never establishes learner mastery. Clear learner text is evidence of language use, not acoustic perfection. An observed word occurrence is not automatically correct use. Do not use an unrelated optional word to classify an issue outside the bank.",
      "Do not lower a beginner for short answers or sticking to lesson vocabulary. If you cannot ground a limitation, do not invent one just to choose level 3. Decide task-relative effectiveness; leave genuinely unavailable judgments unobserved. This transport prevents some attribution mistakes, not all semantic errors.",
    ].join("\n");
  return {
    request: {
      ...legacy.request,
      promptVersion: JOURNEY_EVIDENCE_PROMPT_VERSION,
      instructions,
      input: JSON.stringify(payload),
      responseFormat: {
        type: "json_schema" as const,
        name: "journey_evidence_selection",
        strict: true as const,
        schema,
      },
    },
    inspectResponse(response: {
      status: "completed" | "incomplete" | "refused";
      text?: string;
    }) {
      if (response.status !== "completed")
        return {
          state:
            response.status === "refused"
              ? ("REFUSED" as const)
              : ("INCOMPLETE" as const),
        };
      if (!response.text || response.text.length > 150000)
        return { state: "INVALID_OUTPUT" as const };
      let raw: unknown;
      try {
        raw = JSON.parse(response.text);
      } catch {
        return { state: "INVALID_OUTPUT" as const };
      }
      const parsed = Wire.safeParse(raw);
      if (!parsed.success)
        return {
          state: "REJECTED_CANDIDATE" as const,
          inspection: {
            ok: false as const,
            issues: [{ code: "INVALID_EVIDENCE_CONTRACT" }],
          },
        };
      const issues: Array<{ code: string; itemId?: string }> = [];
      function resolve(
        selection: z.infer<typeof Dimension> | z.infer<typeof Finding>,
        itemId: string,
        targetId?: string,
      ) {
        const {
          learnerEvidenceIds: ls,
          partnerEvidenceIds: ps,
          ...rest
        } = selection;
        if (new Set([...ls, ...ps]).size !== ls.length + ps.length)
          issues.push({ code: "DUPLICATE_EVIDENCE_SELECTION", itemId });
        for (const id of ls) {
          if (!learnerMap.has(id))
            issues.push({ code: "WRONG_LEARNER_EVIDENCE_OWNER", itemId });
          if (targetId && !eligible.get(targetId)?.includes(id))
            issues.push({ code: "INELIGIBLE_TARGET_EVIDENCE", itemId });
        }
        for (const id of ps)
          if (!partnerMap.has(id))
            issues.push({ code: "WRONG_PARTNER_EVIDENCE_OWNER", itemId });
        if (targetId && !eligible.has(targetId))
          issues.push({ code: "UNKNOWN_TARGET", itemId });
        const target = context.targets.find((item) => item.id === targetId);
        if (
          target?.kind === "vocabulary" &&
          !eligible.get(targetId!)!.length &&
          "state" in selection &&
          !["NOT_OBSERVED", "NO_OPPORTUNITY"].includes(selection.state)
        )
          issues.push({ code: "ABSENT_VOCABULARY_PRODUCTION", itemId });
        const citations = [
          ...ls.map((id) => learnerMap.get(id)),
          ...ps.map((id) => partnerMap.get(id)),
        ]
          .filter((x): x is Evidence => Boolean(x))
          .map(({ turnId, quote }) => ({ turnId, quote }));
        return { ...rest, citations };
      }
      const wire = parsed.data;
      const dimensions = {
        communication: resolve(wire.dimensions.communication, "communication"),
        vocabulary: resolve(wire.dimensions.vocabulary, "vocabulary"),
        grammar: resolve(wire.dimensions.grammar, "grammar"),
        interaction: resolve(wire.dimensions.interaction, "interaction"),
        pronunciation: wire.dimensions.pronunciation,
        fluency: wire.dimensions.fluency,
      };
      const findings = wire.findings.map((item) =>
        resolve(item, item.id, item.targetId),
      );
      if (issues.length)
        return {
          state: "REJECTED_CANDIDATE" as const,
          inspection: { ok: false as const, issues },
        };
      const candidate = {
        version: wire.version,
        attemptId: wire.attemptId,
        locale: wire.locale,
        dimensions,
        findings,
      };
      const inspection = inspectJourneyQualityCandidate(candidate, context);
      return inspection.ok
        ? {
            state: "VALIDATED_CANDIDATE" as const,
            inspection,
            pedagogy: auditJourneyQualityPedagogy(candidate, context),
          }
        : { state: "REJECTED_CANDIDATE" as const, inspection };
    },
  };
}
