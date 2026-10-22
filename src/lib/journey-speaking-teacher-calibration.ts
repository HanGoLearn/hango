import { createHash } from "node:crypto";

/** Offline calibration tooling. No provider/DB/UI/reward imports. The editorial
 * reference is AI-assisted and cannot certify independent teacher validation. */
export const TEACHER_CALIBRATION_VERSION =
  "journey-teacher-calibration-draft-2026-10-18-v3";
export const CALIBRATION_DIMENSIONS = [
  "communication",
  "vocabulary",
  "grammar",
  "interaction",
  "pronunciation",
  "fluency",
] as const;
export type CalibrationDimension = (typeof CALIBRATION_DIMENSIONS)[number];
export type CalibrationRating = {
  dimension: CalibrationDimension;
  level: 0 | 1 | 2 | 3 | 4 | null;
  reason: string;
  citations: Array<{ turnId: string; quote: string }>;
};
export type CalibrationCase = {
  id: string;
  lessonSlug: string;
  task: string;
  modality: "TEXT_ONLY";
  turns: Array<{ id: string; role: "user" | "assistant"; content: string }>;
  editorialReference: {
    provenance: "CODEX_AI_ASSISTED_DRAFT";
    ratings: CalibrationRating[];
    teachingNote: string;
  };
};
export type CalibrationSubmission = {
  caseId: string;
  ratings: CalibrationRating[];
};
const packetId = (id: string) =>
  `case-${createHash("sha256").update(`${TEACHER_CALIBRATION_VERSION}:${id}`).digest("hex").slice(0, 16)}`;

function validateRatings(
  entry: CalibrationCase,
  ratings: CalibrationRating[],
  complete: boolean,
) {
  const seen = new Set<string>();
  for (const rating of ratings) {
    if (
      !CALIBRATION_DIMENSIONS.includes(rating.dimension) ||
      seen.has(rating.dimension)
    )
      throw new Error("Duplicate or unknown dimension");
    seen.add(rating.dimension);
    if (
      rating.level !== null &&
      (!Number.isInteger(rating.level) || rating.level < 0 || rating.level > 4)
    )
      throw new Error("Invalid ordinal level");
    if (!rating.reason.trim()) throw new Error("Rating reason required");
    if (
      entry.modality === "TEXT_ONLY" &&
      ["pronunciation", "fluency"].includes(rating.dimension) &&
      rating.level !== null
    )
      throw new Error("Text cannot certify audio");
    for (const citation of rating.citations) {
      const turn = entry.turns.find((turn) => turn.id === citation.turnId);
      if (!citation.quote || !turn?.content.includes(citation.quote))
        throw new Error("Unbacked calibration citation");
    }
    if (
      rating.level !== null &&
      !rating.citations.some(
        (cite) =>
          entry.turns.find((turn) => turn.id === cite.turnId)?.role === "user",
      )
    )
      throw new Error("Learner evidence required");
  }
  if (complete && seen.size !== CALIBRATION_DIMENSIONS.length)
    throw new Error("Incomplete editorial reference");
}
function validateCorpus(cases: CalibrationCase[]) {
  if (
    !cases.length ||
    new Set(cases.map((entry) => entry.id)).size !== cases.length
  )
    throw new Error("Empty or duplicate corpus");
  if (new Set(cases.map((entry) => packetId(entry.id))).size !== cases.length)
    throw new Error("Packet identity collision");
  for (const entry of cases) {
    if (
      !entry.id ||
      !entry.task ||
      entry.modality !== "TEXT_ONLY" ||
      entry.editorialReference.provenance !== "CODEX_AI_ASSISTED_DRAFT"
    )
      throw new Error("Invalid draft provenance or context");
    if (new Set(entry.turns.map((turn) => turn.id)).size !== entry.turns.length)
      throw new Error("Duplicate turn identity");
    validateRatings(entry, entry.editorialReference.ratings, true);
  }
}

/** Strip the editorial answers from this packet; does not claim reviewers are
 * independent, qualified or actually human. Do not send it externally silently. */
export function makeBlindTeacherPacket(cases: CalibrationCase[]) {
  validateCorpus(cases);
  return {
    version: TEACHER_CALIBRATION_VERSION,
    status: "AWAITING_INDEPENDENT_TEACHER_REVIEW" as const,
    instructions:
      "Valora solo lo demostrado en cada tarea. 0 exige dificultad observada, no ausencia de datos. Sin audio: pronunciación y fluidez nulas. Cita originales y explica ayuda, autocorrección y limitaciones; no veas la clave editorial antes de enviar.",
    cases: cases
      .map(({ id, lessonSlug, task, modality, turns }) => ({
        id: packetId(id),
        lessonSlug,
        task,
        modality,
        // Do not leak the anchor's severity code through turn IDs either.
        turns: turns.map(({ role, content }, index) => ({
          id: `${packetId(id)}-turn-${index}`,
          role,
          content,
        })),
        ratings: CALIBRATION_DIMENSIONS.map((dimension) => ({
          dimension,
          level: null,
          reason: "",
          citations: [],
        })),
      }))
      .sort((a, b) => a.id.localeCompare(b.id)),
  };
}

/** Comparison with PROVISIONAL editorial anchors, not accuracy on students.
 * Missing/null ratings never become zeros. Even a perfect self-comparison cannot
 * authorize deployment, generate a grade, or claim teacher agreement. */
export function compareDraftTeacherCalibration(
  cases: CalibrationCase[],
  submissions: CalibrationSubmission[],
) {
  validateCorpus(cases);
  const byId = new Map(cases.map((entry) => [entry.id, entry]));
  const rows = new Map<string, CalibrationSubmission>();
  for (const submission of submissions) {
    const entry =
      byId.get(submission.caseId) ??
      cases.find((item) => packetId(item.id) === submission.caseId);
    if (!entry || rows.has(entry.id))
      throw new Error("Unknown or duplicate case submission");
    const ratings =
      submission.caseId === entry.id
        ? submission.ratings
        : submission.ratings.map((rating) => ({
            ...rating,
            citations: rating.citations.map((cite) => {
              const index = entry.turns.findIndex(
                (_turn, i) => `${packetId(entry.id)}-turn-${i}` === cite.turnId,
              );
              if (index < 0) throw new Error("Unknown packet citation");
              return { ...cite, turnId: entry.turns[index]!.id };
            }),
          }));
    validateRatings(entry, ratings, false);
    rows.set(entry.id, { caseId: entry.id, ratings });
  }
  const dimensions = Object.fromEntries(
    CALIBRATION_DIMENSIONS.map((dimension) => {
      let pairs = 0,
        exact = 0,
        withinOne = 0,
        absoluteError = 0,
        signedError = 0,
        missingRatings = 0,
        referenceUnscored = 0,
        submittedUnscored = 0,
        unsupportedMaxima = 0,
        unreferencedMaxima = 0;
      for (const entry of cases) {
        const reference = entry.editorialReference.ratings.find(
          (rating) => rating.dimension === dimension,
        )!;
        const rating = rows
          .get(entry.id)
          ?.ratings.find((item) => item.dimension === dimension);
        if (!rating) {
          missingRatings++;
          continue;
        }
        if (reference.level === null) {
          referenceUnscored++;
          if (rating.level === 4) unreferencedMaxima++;
        }
        if (rating.level === null) submittedUnscored++;
        if (reference.level === null || rating.level === null) continue;
        const difference = rating.level - reference.level;
        pairs++;
        absoluteError += Math.abs(difference);
        signedError += difference;
        if (difference === 0) exact++;
        if (Math.abs(difference) <= 1) withinOne++;
        if (rating.level === 4 && reference.level < 4) unsupportedMaxima++;
      }
      return [
        dimension,
        {
          pairs,
          exact,
          withinOne,
          exactAgreement: pairs ? exact / pairs : null,
          withinOneAgreement: pairs ? withinOne / pairs : null,
          meanAbsoluteError: pairs ? absoluteError / pairs : null,
          meanSignedDifference: pairs ? signedError / pairs : null,
          missingRatings,
          referenceUnscored,
          submittedUnscored,
          maximaAboveDraftReference: unsupportedMaxima,
          maximaWithoutScoredReference: unreferencedMaxima,
        },
      ];
    }),
  );
  return {
    version: TEACHER_CALIBRATION_VERSION,
    status: "DRAFT_COMPARISON_NOT_TEACHER_VALIDATION" as const,
    referenceProvenance: "CODEX_AI_ASSISTED_DRAFT" as const,
    independentHumanReviewVerified: false as const,
    deploymentEligible: false as const,
    score: null,
    corpusCases: cases.length,
    submittedCases: rows.size,
    dimensions,
  };
}
