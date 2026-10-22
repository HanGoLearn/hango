/** Frozen on NEW administrator test attempts; existing attempts keep their policy. */
export const JOURNEY_UNIFIED_POLICY = "journey-unified-2026-10-21-v1";
export const JOURNEY_UNIFIED_WEIGHTS = {
  communication: 20,
  vocabulary: 15,
  grammar: 20,
  pronunciation: 25,
  interaction: 10,
  fluency: 10,
} as const;
export type JourneyUnifiedDimension = keyof typeof JOURNEY_UNIFIED_WEIGHTS;
export const journeyUnifiedLabels = {
  es: {
    communication: "Comunicación",
    vocabulary: "Vocabulario en conversación",
    grammar: "Gramática en conversación",
    pronunciation: "Pronunciación y tonos",
    interaction: "Interacción y autonomía",
    fluency: "Fluidez: ritmo y pausas",
  },
  en: {
    communication: "Communication",
    vocabulary: "Vocabulary in conversation",
    grammar: "Grammar in conversation",
    pronunciation: "Pronunciation and tones",
    interaction: "Interaction and independence",
    fluency: "Fluency: rhythm and pauses",
  },
};
