import {
  JOURNEY_SESSION_AUDIO_VERSION,
  type JourneySessionAudioJudgment,
} from "@/lib/journey-session-audio-review";

/** Fictional transport fixture, never a recording or evidence of accuracy. */
export function sessionAudioJudgment(
  attemptId = "attempt",
  itemId = "audio-1",
  sequence = 1,
  quote = "你好，我叫小明。",
  locale: "es" | "en" = "es",
): JourneySessionAudioJudgment {
  const evidence = { sequence, itemId, quote };
  const dimension = {
    status: "OBSERVED" as const,
    level: 3,
    reason:
      locale === "es"
        ? "Observación acústica ficticia para pruebas."
        : "Fictional acoustic observation for testing.",
    evidence: [evidence],
  };
  return {
    version: JOURNEY_SESSION_AUDIO_VERSION,
    attemptId,
    locale,
    reviewedItemIds: [itemId],
    dimensions: {
      tones: structuredClone(dimension),
      articulation: structuredClone(dimension),
      rhythm: structuredClone(dimension),
    },
    findings: [
      {
        category: "tones",
        evidence,
        heard: "Descripción ficticia de un contraste tonal.",
        target: "你",
        pinyin: "nǐ",
        explanation: "Ejemplo sintético, no un diagnóstico real.",
        practice: "Practica el fragmento de ejemplo.",
      },
    ],
    limitations: ["Muestra ficticia; no demuestra precisión acústica."],
  };
}
