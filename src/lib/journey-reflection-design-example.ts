import type { AppLocale } from "@/i18n/config";

// DESIGN FIXTURES ONLY. These ordinal levels and acoustic findings are invented
// examples, not outputs of the candidate evaluator or measurements of any user.
export type ReflectionDesignScenario = "practice" | "strong" | "partial";
export const REFLECTION_DESIGN_WEIGHTS = {
  communication: 20,
  vocabulary: 15,
  grammar: 20,
  pronunciation: 25,
  interaction: 10,
  fluency: 10,
} as const;
export type ReflectionDesignMetric = keyof typeof REFLECTION_DESIGN_WEIGHTS;

export function createReflectionDesignExample(
  locale: AppLocale,
  scenario: ReflectionDesignScenario,
) {
  const es = locale === "es";
  const strong = scenario === "strong";
  const partial = scenario === "partial";
  const levels: Record<ReflectionDesignMetric, number | null> = {
    communication: strong ? 4 : 3,
    vocabulary: strong ? 4 : 3,
    grammar: strong ? 4 : 2,
    pronunciation: partial ? null : strong ? 3 : 2,
    interaction: strong ? 4 : 3,
    fluency: partial ? null : strong ? 4 : 3,
  };
  const speaking = partial
    ? null
    : Math.round(
        Object.entries(REFLECTION_DESIGN_WEIGHTS).reduce(
          (sum, [key, weight]) =>
            sum + (levels[key as ReflectionDesignMetric]! / 4) * weight,
          0,
        ),
      );
  const exercises = [
    {
      key: "vocabulary",
      label: es ? "Vocabulario" : "Vocabulary",
      correct: strong ? 10 : 9,
      total: 10,
      weight: 20,
    },
    {
      key: "grammar",
      label: es ? "Gramática" : "Grammar",
      correct: strong ? 6 : 5,
      total: 6,
      weight: 20,
    },
    {
      key: "comprehension",
      label: es ? "Comprensión" : "Comprehension",
      correct: 5,
      total: 5,
      weight: 30,
    },
  ].map((row) => ({
    ...row,
    score: Math.round((row.correct / row.total) * 100),
  }));
  const overall =
    speaking === null
      ? null
      : Math.round(
          exercises.reduce(
            (sum, row) => sum + (row.score * row.weight) / 100,
            0,
          ) +
            speaking * 0.3,
        );
  const labels: Record<ReflectionDesignMetric, string> = es
    ? {
        communication: "Comunicación",
        vocabulary: "Vocabulario en conversación",
        grammar: "Gramática en conversación",
        pronunciation: "Pronunciación y tonos",
        interaction: "Interacción y autonomía",
        fluency: "Fluidez funcional",
      }
    : {
        communication: "Communication",
        vocabulary: "Vocabulary in conversation",
        grammar: "Grammar in conversation",
        pronunciation: "Pronunciation and tones",
        interaction: "Interaction and independence",
        fluency: "Functional fluency",
      };
  const reasons: Record<ReflectionDesignMetric, string> = es
    ? {
        communication:
          "Compartiste tu nombre y origen, y mantuviste el sentido del intercambio.",
        vocabulary:
          "Usaste 叫 para presentarte y entendiste la pregunta sobre tu origen.",
        grammar: strong
          ? "Aplicaste 我叫 y formulaste una pregunta de seguimiento sin un modelo inmediato."
          : "Al presentar tu nombre apareció un 是 de más: 我叫是小林。",
        pronunciation: partial
          ? "No hay una medición acústica disponible. No se sustituye por una nota de transcripción."
          : "Hallazgo acústico ficticio para mostrar el diseño; no se ha analizado ninguna grabación.",
        interaction:
          "Devolviste la pregunta con 你呢？ en lugar de limitarte a responder.",
        fluency: partial
          ? "Sin audio evaluable no se califican pausas, ritmo o continuidad."
          : "Continuidad ficticia para esta demostración; no es una medición de tu voz.",
      }
    : {
        communication:
          "You shared your name and origin and kept the exchange meaningful.",
        vocabulary:
          "You used 叫 to introduce yourself and understood the question about your origin.",
        grammar: strong
          ? "You used 我叫 and asked a follow-up question without an immediate model."
          : "An extra 是 appeared in your introduction: 我叫是小林。",
        pronunciation: partial
          ? "No acoustic assessment is available. Transcription is not a replacement score."
          : "Fictional acoustic finding to illustrate the design; no recording has been analyzed.",
        interaction:
          "You returned the question with 你呢？ rather than only answering.",
        fluency: partial
          ? "Without usable audio, pauses, rhythm and continuity remain ungraded."
          : "Fictional continuity for this demonstration, not a measurement of your voice.",
      };
  return {
    synthetic: true as const,
    locale,
    scenario,
    strong,
    partial,
    speaking,
    overall,
    stars: overall === null ? null : overall >= 90 ? 3 : overall >= 70 ? 2 : 1,
    exercises,
    metrics: (
      Object.keys(REFLECTION_DESIGN_WEIGHTS) as ReflectionDesignMetric[]
    ).map((key) => ({
      key,
      label: labels[key],
      level: levels[key],
      weight: REFLECTION_DESIGN_WEIGHTS[key],
      points:
        levels[key] === null
          ? null
          : (levels[key]! / 4) * REFLECTION_DESIGN_WEIGHTS[key],
      acoustic: key === "pronunciation" || key === "fluency",
      reason: reasons[key],
    })),
  };
}
