import {
  JourneyAttemptSealSchema,
  type JourneyAttemptSnapshot,
  type JourneyAttemptSealInput,
  type JourneyCapturedTurn,
  type JourneyCaptureQuality,
} from "./journey-speaking-attempt-contract";
import type {
  JourneyQualityContext,
  JourneyQualityTarget,
} from "./journey-speaking-quality-candidate";

/** Server/offline adapter only. Caller must resolve ownership and read the frozen
 * snapshot/capture; never pass browser-selected banks, objectives or turn IDs.
 * No provider, database, grade, persistence, or acoustic measurement. */
export function buildJourneyQualityContext(input: {
  attemptId: string;
  locale: "es" | "en";
  snapshot: JourneyAttemptSnapshot;
  capture: {
    attemptId: string;
    lessonId: string;
    closeReason: JourneyAttemptSealInput["closeReason"];
    turns: readonly JourneyCapturedTurn[];
    quality?: JourneyCaptureQuality;
  };
  /** Explicit editorial selection, not a quota inferred from all bank entries. */
  requiredActIds?: readonly string[];
}): JourneyQualityContext {
  const { snapshot, capture } = input;
  const id = (value: string) => {
    if (
      typeof value !== "string" ||
      !value.trim() ||
      value !== value.trim() ||
      value.length > 100
    )
      throw new Error("Invalid quality context identifier");
    return value;
  };
  id(input.attemptId);
  id(snapshot.lessonId);
  id(snapshot.lessonSlug);
  if (input.locale !== "es" && input.locale !== "en")
    throw new Error("Unsupported quality locale");
  if (
    capture.attemptId !== input.attemptId ||
    capture.lessonId !== snapshot.lessonId ||
    snapshot.banks.lessonId !== snapshot.lessonId ||
    snapshot.banks.lessonSlug !== snapshot.lessonSlug
  )
    throw new Error(
      "Quality context does not belong to the same frozen attempt/lesson",
    );
  const sealed = JourneyAttemptSealSchema.parse({
    attemptId: capture.attemptId,
    lessonId: capture.lessonId,
    closeReason: capture.closeReason,
    turns: capture.turns.map(({ role, content, recognition }) => ({
      role,
      content,
      ...(recognition ? { recognition } : {}),
    })),
    ...(capture.quality ? { quality: capture.quality } : {}),
  });
  const turnIds = new Set<string>();
  const sequences = new Set<number>();
  for (const [index, turn] of capture.turns.entries()) {
    id(turn.id);
    if (
      turnIds.has(turn.id) ||
      sequences.has(turn.sequence) ||
      !Number.isSafeInteger(turn.sequence) ||
      turn.sequence < 0
    )
      throw new Error("Duplicate or invalid quality turn identity/sequence");
    // Validation must not silently trim or replace a frozen original transcript.
    if (sealed.turns[index]!.content !== turn.content)
      throw new Error("Quality context must preserve original capture text");
    turnIds.add(turn.id);
    sequences.add(turn.sequence);
  }
  const required = new Set(input.requiredActIds ?? []);
  if (required.size !== (input.requiredActIds ?? []).length)
    throw new Error("Duplicate required act");
  const targets: JourneyQualityTarget[] = [];
  const origins = new Map<string, string>();
  function add(
    kind: JourneyQualityTarget["kind"],
    sourceId: string,
    text: string,
    required: boolean,
    provenance: string,
  ) {
    id(sourceId);
    const targetId = id(`${kind}:${sourceId}`);
    if (typeof text !== "string" || !text.trim())
      throw new Error("Empty quality target text");
    if (origins.has(targetId)) {
      if (origins.get(targetId) !== provenance)
        throw new Error("Conflicting quality target identity");
      return;
    }
    origins.set(targetId, provenance);
    targets.push({ id: targetId, kind, text, required });
  }
  for (const act of snapshot.successConditions) {
    const targetId = `act:${act.id}`;
    if (origins.has(targetId))
      throw new Error("Duplicate success condition identity");
    add("act", act.id, act.text, required.has(act.id), JSON.stringify(act));
  }
  for (const actId of required)
    if (!origins.has(`act:${actId}`))
      throw new Error("Required act is outside the frozen lesson");
  for (const bucket of [
    snapshot.banks.core,
    snapshot.banks.support,
    snapshot.banks.extension,
  ]) {
    for (const kind of ["vocabulary", "grammar"] as const) {
      for (const entry of bucket[kind]) {
        id(entry.lessonId);
        id(entry.lessonSlug);
        // Resources marked for the character are not learner obligations or
        // production targets. Exposure is deliberately not mapped to mastery.
        if (entry.characterOnly) continue;
        add(
          kind,
          entry.id,
          entry.text,
          false,
          JSON.stringify([
            entry.lessonId,
            entry.lessonSlug,
            entry.text,
            entry.meaning,
          ]),
        );
      }
    }
  }
  return {
    attemptId: input.attemptId,
    locale: input.locale,
    lessonSlug: snapshot.lessonSlug,
    targets,
    turns: structuredClone([...capture.turns]).sort(
      (a, b) => a.sequence - b.sequence,
    ),
    // Missing/failed/pending capture cannot silently become a complete one.
    // Interrupting the character alone is not missing learner speech.
    technicallyComplete:
      (capture.closeReason === "NATURAL" ||
        capture.closeReason === "USER_END") &&
      capture.quality !== undefined &&
      !capture.quality.pendingLearnerTurn,
  };
}
