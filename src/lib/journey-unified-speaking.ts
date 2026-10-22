import {
  JOURNEY_UNIFIED_POLICY,
  JOURNEY_UNIFIED_WEIGHTS,
  journeyUnifiedLabels,
  type JourneyUnifiedDimension,
} from "./journey-unified-policy";
import type { JourneySessionAudioResult } from "./journey-session-audio-review";
import type { JourneyCapturedTurn } from "./journey-speaking-attempt-contract";
import type { JourneyAssessmentSnapshot } from "./journey-lesson-report";
import { summarizeJourneyQuiz } from "./journey-lesson-report";
import { REFLECTION_WEIGHTS } from "./points-system";
import type { JourneySpeakingLevel } from "./journey-speaking-level";
import type { prepareJourneyQualityEvidenceReview } from "./journey-speaking-quality-evidence-review";

type Inspection = Extract<
  ReturnType<
    ReturnType<typeof prepareJourneyQualityEvidenceReview>["inspectResponse"]
  >,
  { state: "VALIDATED_CANDIDATE" }
>;
type Evidence = {
  sequence: number;
  quote: string;
  source: "TRANSCRIPT" | "SESSION_AUDIO";
};
export type JourneyUnifiedView = {
  version: typeof JOURNEY_UNIFIED_POLICY;
  locale: "es" | "en";
  experimental: true;
  eligibleForRewards: false;
  level?: JourneySpeakingLevel;
  phase:
    | "WAITING"
    | "PROCESSING"
    | "READY"
    | "PARTIAL"
    | "REVIEW_REQUIRED"
    | "FAILED";
  speakingScore: number | null;
  lessonScore: number | null;
  dimensions: Record<
    JourneyUnifiedDimension,
    {
      level: number | null;
      weight: number;
      contribution: number | null;
      reason: string;
      evidence: Evidence[];
    }
  >;
  coverage: {
    required: number;
    independent: number;
    assisted: number;
    selfCorrected: number;
    unconfirmed: number;
    audioReviewed: number;
    audioTotal: number;
  };
  hanNote: string;
  achievements: Array<{ text: string; evidence: Evidence[] }>;
  corrections: Array<{
    category: JourneyUnifiedDimension;
    original: string;
    chinese: string;
    pinyin: string;
    translation: string | null;
    explanation: string;
    practice: string | null;
    evidence: Evidence[];
    resolved: boolean;
  }>;
  nextStep: string;
  holds: string[];
};

/** One integrated, explicitly experimental result. Does NOT change the candidate's
 * own score:null/teacher-HOLD contract or turn unverified audio into rewards. */
export function buildJourneyUnifiedView(input: {
  locale: "es" | "en";
  turns: readonly JourneyCapturedTurn[];
  assessment: JourneyAssessmentSnapshot;
  state: string;
  inspection?: Inspection;
  findingReasons?: Readonly<Record<string, string>>;
  audio: JourneySessionAudioResult | null;
  technicallyComplete: boolean;
  level?: JourneySpeakingLevel;
}): JourneyUnifiedView {
  const { locale, inspection, audio } = input;
  const t = (es: string, en: string) => (locale === "es" ? es : en);
  const lookup = new Map(input.turns.map((turn) => [turn.id, turn]));
  const cite = (citations: { turnId: string; quote: string }[]): Evidence[] =>
    citations.map((c) => ({
      sequence: lookup.get(c.turnId)!.sequence,
      quote: c.quote,
      source: "TRANSCRIPT",
    }));
  const empty = (
    key: JourneyUnifiedDimension,
  ): JourneyUnifiedView["dimensions"][JourneyUnifiedDimension] => ({
    level: null,
    weight: JOURNEY_UNIFIED_WEIGHTS[key],
    contribution: null,
    reason: t("Sin evidencia evaluada todavía.", "No evaluated evidence yet."),
    evidence: [],
  });
  const dimensions: JourneyUnifiedView["dimensions"] = {
    communication: empty("communication"),
    vocabulary: empty("vocabulary"),
    grammar: empty("grammar"),
    pronunciation: empty("pronunciation"),
    interaction: empty("interaction"),
    fluency: empty("fluency"),
  };
  if (inspection) {
    for (const key of [
      "communication",
      "vocabulary",
      "grammar",
      "interaction",
    ] as const) {
      const dimension = inspection.inspection.profile.dimensions[key];
      dimensions[key] = {
        level: dimension.level,
        weight: JOURNEY_UNIFIED_WEIGHTS[key],
        contribution:
          dimension.level === null
            ? null
            : (dimension.level / 4) * JOURNEY_UNIFIED_WEIGHTS[key],
        reason: dimension.reason,
        evidence: cite(dimension.citations),
      };
    }
  }
  const acoustics = audio?.judgment?.dimensions;
  const audioEvidence = (
    refs: { sequence: number; quote: string }[],
  ): Evidence[] =>
    refs.map((ref) => ({
      sequence: ref.sequence,
      quote: ref.quote,
      source: "SESSION_AUDIO",
    }));
  if (acoustics) {
    const { tones, articulation, rhythm } = acoustics;
    const level =
      tones.level !== null && articulation.level !== null
        ? (tones.level + articulation.level) / 2
        : null;
    dimensions.pronunciation = {
      level,
      weight: 25,
      contribution: level === null ? null : (level / 4) * 25,
      reason: `${t("Tonos", "Tones")} (${tones.level === null ? "—" : tones.level}/4): ${tones.reason} ${t("Articulación", "Articulation")} (${articulation.level === null ? "—" : articulation.level}/4): ${articulation.reason}`,
      evidence: audioEvidence([...tones.evidence, ...articulation.evidence]),
    };
    dimensions.fluency = {
      level: rhythm.level,
      weight: 10,
      contribution: rhythm.level === null ? null : (rhythm.level / 4) * 10,
      reason: rhythm.reason,
      evidence: audioEvidence(rhythm.evidence),
    };
  } else {
    dimensions.pronunciation.reason = dimensions.fluency.reason = t(
      "La revisión de audio no está disponible; no se calcula a partir del texto.",
      "Audio review is unavailable; it is not inferred from text.",
    );
  }
  const holds: string[] = [];
  if (!input.technicallyComplete)
    holds.push(
      t(
        "La captura de la conversación está incompleta.",
        "The conversation capture is incomplete.",
      ),
    );
  if (!inspection)
    holds.push(
      input.state === "PENDING"
        ? t(
            "Falta evaluar la conversación guardada.",
            "The saved conversation still needs evaluation.",
          )
        : input.state === "PROCESSING"
          ? t("La evaluación está en curso.", "Evaluation is in progress.")
          : input.state === "INSUFFICIENT"
            ? t(
                "No hay suficientes intervenciones claras para evaluar; no es una nota de cero.",
                "There are not enough clear turns to assess; this is not a zero score.",
              )
            : t(
                "El juicio textual no pasó sus controles; se conserva para revisión sin inventar una nota.",
                "The textual judgment did not pass its checks; it is retained for review without inventing a grade.",
              ),
    );
  if (Object.values(dimensions).some((d) => d.level === null))
    holds.push(
      t(
        "Falta evidencia en una o más variables: no se redistribuyen sus pesos.",
        "One or more dimensions lack evidence; their weights are not redistributed.",
      ),
    );
  if (audio?.status !== "REVIEWED")
    holds.push(
      t(
        "La revisión de audio falta o solo cubre parte de las intervenciones.",
        "Audio review is missing or covers only part of the turns.",
      ),
    );
  const mismatchedFindings = new Set(
    inspection?.pedagogy.acts
      .filter((act) => act.status === "EVIDENCE_MISMATCH")
      .map((act) => act.findingId),
  );
  const mismatched = mismatchedFindings.size > 0;
  const heldTargets = new Set(
    inspection?.pedagogy.acts
      .filter((act) => act.status === "EVIDENCE_MISMATCH")
      .map((act) => act.targetId),
  );
  if (mismatched) {
    // Cross-field integrity: a known semantic contradiction may underpin any
    // textual dimension. Keep the original candidate private and unchanged;
    // do not publish its prose/levels as if only the total were questionable.
    for (const key of [
      "communication",
      "vocabulary",
      "grammar",
      "interaction",
    ] as const)
      dimensions[key] = {
        ...dimensions[key],
        level: null,
        contribution: null,
        reason: t(
          "Valoración textual retenida: una cita fue atribuida a un objetivo que no demuestra. No se considera un error del alumno.",
          "Textual judgment held: a quote was attributed to an objective it does not demonstrate. This is not treated as a learner error.",
        ),
      };
  }
  if (mismatched)
    holds.push(
      t(
        "Una evidencia no demuestra el objetivo al que fue atribuida. La nota queda retenida, no rebajada artificialmente.",
        "An evidence item does not support its attributed objective. The grade is held, not artificially lowered.",
      ),
    );
  const coverage = inspection?.inspection.profile.coverage;
  const confirmed = (ids: readonly string[] = []) =>
    ids.filter((id) => !heldTargets.has(id));
  const independent = confirmed(coverage?.independentlyDemonstrated);
  const assisted = confirmed(coverage?.assisted);
  const selfCorrected = confirmed(coverage?.selfCorrected);
  const unconfirmed = new Set(coverage?.unconfirmed ?? []);
  for (const id of [
    ...(coverage?.independentlyDemonstrated ?? []),
    ...(coverage?.assisted ?? []),
    ...(coverage?.selfCorrected ?? []),
  ])
    if (heldTargets.has(id)) unconfirmed.add(id);
  const allMaximum = Object.values(dimensions).every((d) => d.level === 4);
  if (allMaximum && unconfirmed.size)
    holds.push(
      t(
        "No se puede justificar un máximo con objetivos prioritarios todavía no demostrados.",
        "A maximum cannot be justified with unconfirmed priority objectives.",
      ),
    );
  const speakingScore =
    holds.length === 0
      ? Math.round(
          Object.values(dimensions).reduce(
            (sum, d) => sum + d.contribution!,
            0,
          ),
        )
      : null;
  const quizzes = {
    vocabulary: summarizeJourneyQuiz(input.assessment.vocabulary),
    grammar: summarizeJourneyQuiz(input.assessment.grammar),
    comprehension: summarizeJourneyQuiz(input.assessment.comprehension),
  };
  const lessonScore =
    speakingScore !== null &&
    Object.values(quizzes).every((q) => q.state === "COMPLETE")
      ? Math.round(
          (quizzes.vocabulary.score! * REFLECTION_WEIGHTS.VOCABULARY) / 100 +
            (quizzes.grammar.score! * REFLECTION_WEIGHTS.GRAMMAR) / 100 +
            (quizzes.comprehension.score! * REFLECTION_WEIGHTS.COMPREHENSION) /
              100 +
            (speakingScore * REFLECTION_WEIGHTS.SPEAKING) / 100,
        )
      : null;
  const feedback = inspection?.inspection.profile.feedback ?? [];
  const achievements = feedback
    .filter(
      (f) =>
        ["INDEPENDENT", "SELF_CORRECTED"].includes(f.state) &&
        !mismatchedFindings.has(f.findingId) &&
        !heldTargets.has(f.targetId),
    )
    .slice(0, 2)
    .map((f) => ({
      text: `${f.label}${f.targetId.startsWith("act:") ? "" : `: ${f.targetText}`}`,
      evidence: cite(f.quotes).filter(
        (ref) => input.turns[ref.sequence]?.role === "user",
      ),
    }));
  const corrections: JourneyUnifiedView["corrections"] = feedback
    .filter(
      (f) =>
        f.state === "ERROR" && f.correction && !heldTargets.has(f.targetId),
    )
    .map((f) => ({
      category: f.targetId.startsWith("grammar:") ? "grammar" : "vocabulary",
      original: f.quotes
        .filter((c) => lookup.get(c.turnId)?.role === "user")
        .map((c) => c.quote)
        .join(" · "),
      chinese: f.correction!.chinese,
      pinyin: f.correction!.pinyin,
      translation: f.correction!.translation,
      explanation: input.findingReasons?.[f.findingId] ?? f.label,
      practice: null,
      evidence: cite(f.quotes),
      resolved: f.resolved,
    }));
  for (const finding of audio?.judgment?.findings ?? [])
    corrections.push({
      category: finding.category === "rhythm" ? "fluency" : "pronunciation",
      original: finding.evidence.quote,
      chinese: finding.target,
      pinyin: finding.pinyin,
      translation: null,
      explanation: `${finding.heard} ${finding.explanation}`,
      practice: finding.practice,
      evidence: audioEvidence([finding.evidence]),
      resolved: false,
    });
  const priority = corrections.find((correction) => !correction.resolved);
  const nextStep =
    priority?.practice ??
    (priority
      ? t(
          `Prueba de nuevo «${priority.chinese}» (${priority.pinyin}) en otra respuesta breve.`,
          `Try “${priority.chinese}” (${priority.pinyin}) again in another brief reply.`,
        )
      : t(
          "Repite una situación semejante con tus propias palabras; si pides ayuda, intenta después una respuesta independiente.",
          "Try a similar situation in your own words; after asking for help, attempt an independent reply.",
        ));
  const observation = dimensions.communication;
  const example = observation.evidence.find(
    (ref) => input.turns[ref.sequence]?.role === "user",
  );
  const weakest = Object.entries(dimensions)
    .filter(([key, d]) => key !== "communication" && d.level !== null)
    .sort((a, b) => a[1].level! - b[1].level!)[0];
  const hanNote = mismatched
    ? t(
        "He retenido la valoración textual porque una cita no demuestra el objetivo que se le atribuyó. Conservamos tu conversación y el audio disponible; no te atribuimos ese logro ni un error por esta inconsistencia del evaluador.",
        "I have held the textual judgment because a quote does not demonstrate its attributed objective. Your conversation and available audio are retained; this evaluator inconsistency is neither credited as an achievement nor counted as your error.",
      )
    : example
      ? `${t("En tu respuesta", "In your reply")} «${example.quote}»: ${observation.reason}${weakest ? ` ${t("Tu siguiente foco es", "Your next focus is")} ${journeyUnifiedLabels[locale][weakest[0] as JourneyUnifiedDimension].toLocaleLowerCase(locale)}: ${weakest[1].reason}` : ""}`
      : t(
          "Todavía no hay evidencia coherente suficiente para una nota personal de este intento. Conservamos los resultados disponibles; no te atribuimos logros ni errores sin apoyo.",
          "There is not yet enough consistent evidence for a personal note on this attempt. Available results are retained; no unsupported achievements or errors are attributed to you.",
        );
  return {
    version: JOURNEY_UNIFIED_POLICY,
    locale,
    experimental: true,
    eligibleForRewards: false,
    ...(input.level ? { level: input.level } : {}),
    phase:
      input.state === "PENDING"
        ? "WAITING"
        : input.state === "PROCESSING"
          ? "PROCESSING"
          : input.state === "INSUFFICIENT"
            ? "PARTIAL"
            : !inspection
              ? "FAILED"
              : mismatched
                ? "REVIEW_REQUIRED"
                : speakingScore === null
                  ? "PARTIAL"
                  : "READY",
    speakingScore,
    lessonScore,
    dimensions,
    coverage: {
      required: coverage?.required ?? 0,
      independent: independent.length,
      assisted: assisted.length,
      selfCorrected: selfCorrected.length,
      unconfirmed: unconfirmed.size,
      audioReviewed: audio?.judgment?.reviewedItemIds.length ?? 0,
      audioTotal:
        audio?.totalLearnerTurns ??
        input.turns.filter((turn) => turn.role === "user").length,
    },
    hanNote,
    achievements,
    corrections,
    nextStep,
    holds,
  };
}
