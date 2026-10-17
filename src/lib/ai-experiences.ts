import {
  AI_USAGE_FEATURES,
  aiFeatureDescriptor,
  type AiUsageFeature,
} from "@/lib/ai-feature-catalog";

export const EXPERIENCE_BUDGET_MIGRATION =
  "20261010140000_shared_ai_experience_budgets";
export const AI_EXPERIENCES = {
  HAN_TUTOR: {
    label: "Han Tutor (burbuja)",
    description:
      "Un presupuesto para conversación de voz, chat escrito, grabaciones y lectura de respuestas.",
    section: "INTERACTIVE",
  },
  HAN_COMPANION: {
    label: "Han Companion",
    description:
      "Un presupuesto para voz, chat, grabaciones, lecturas y memoria de Companion. Nunca incluye Tutor.",
    section: "INTERACTIVE",
  },
  JOURNEY_SPEAKING: {
    label: "Speaking de Learning Journey",
    description:
      "Conversación con personaje y comprobaciones del objetivo dentro de la lección.",
    section: "INTERACTIVE",
  },
  SPEAKING_LAB: {
    label: "Speaking Lab",
    description:
      "Conversaciones, escenarios, grabaciones y evaluaciones del laboratorio.",
    section: "INTERACTIVE",
  },
  HAN_VOCABULARY: {
    label: "HanVocabulary",
    description:
      "Búsquedas nuevas. Reutilizar información guardada no consume IA.",
    section: "INTERACTIVE",
  },
  LESSON_REFLECTION: {
    label: "Reflexión final de la lección",
    description:
      "Evaluación final y lectura opcional del resultado, con un solo presupuesto.",
    section: "INTERACTIVE",
  },
  WRITING_LAB: {
    label: "Writing Lab",
    description: "Evaluación de textos y de escritura a mano.",
    section: "INTERACTIVE",
  },
  PLACEMENT: {
    label: "Examen de nivel",
    description: "Conversación oral, comprobaciones y evaluación del examen.",
    section: "INTERACTIVE",
  },
  SHARED_AUDIO: {
    label: "Generación de contenido compartido",
    description:
      "Generación inicial de audios de introducción, diálogos, vocabulario, gramática y Listening. Reproducciones guardadas sin llamada IA.",
    section: "SHARED_CONTENT",
  },
  MISSIONS: {
    label: "Misiones",
    description:
      "Conversación y evaluación final de misiones, con el mismo presupuesto.",
    section: "INTERACTIVE",
  },
} as const;
export type AiExperience = keyof typeof AI_EXPERIENCES;
export type AiExperienceLimitKey = `experience:${AiExperience}`;
export const AI_EXPERIENCE_IDS = Object.keys(AI_EXPERIENCES) as AiExperience[];

/** Every live operation belongs to one experience. Multi-source operations
 * carry their origin explicitly; old mixed logs are never guessed. */
export const AI_FEATURE_EXPERIENCES: Record<
  AiUsageFeature,
  readonly AiExperience[]
> = {
  "ai-teacher-chat": [],
  "han-realtime-session": [],
  "han-tutor-chat": ["HAN_TUTOR"],
  "han-tutor-realtime-session": ["HAN_TUTOR"],
  "han-companion-chat": ["HAN_COMPANION"],
  "han-companion-realtime-session": ["HAN_COMPANION"],
  "learner-fact-extraction": ["HAN_COMPANION"],
  "roleplay-chat": ["JOURNEY_SPEAKING", "SPEAKING_LAB", "PLACEMENT"],
  "han-realtime-assessment": ["JOURNEY_SPEAKING", "SPEAKING_LAB", "PLACEMENT"],
  "han-speech": [
    "HAN_TUTOR",
    "HAN_COMPANION",
    "LESSON_REFLECTION",
    "SHARED_AUDIO",
    "JOURNEY_SPEAKING",
    "SPEAKING_LAB",
  ],
  "han-teacher-transcribe": ["HAN_TUTOR", "HAN_COMPANION"],
  "journey-speaking-realtime-session": ["JOURNEY_SPEAKING"],
  "speaking-lab-realtime-session": ["SPEAKING_LAB"],
  "speaking-feedback": ["SPEAKING_LAB"],
  "speaking-transcribe": ["SPEAKING_LAB"],
  "speaking-scenario": ["SPEAKING_LAB"],
  "free-topic-feedback": ["SPEAKING_LAB"],
  "placement-realtime-session": ["PLACEMENT"],
  "placement-grading": ["PLACEMENT"],
  "vocabulary-lookup": ["HAN_VOCABULARY"],
  "lesson-reflection": ["LESSON_REFLECTION"],
  "writing-feedback": ["WRITING_LAB"],
  "handwritten-writing": ["WRITING_LAB"],
  "mission-chat": ["MISSIONS"],
  "mission-report": ["MISSIONS"],
  "welcome-audio": ["SHARED_AUDIO"],
  "dialogue-audio": ["SHARED_AUDIO"],
  "grammar-audio": ["SHARED_AUDIO"],
  "vocabulary-audio": ["SHARED_AUDIO"],
  "placement-listening-audio": ["SHARED_AUDIO"],
};
export function isAiExperience(value: unknown): value is AiExperience {
  return typeof value === "string" && Object.hasOwn(AI_EXPERIENCES, value);
}
export function experienceLimitKey(
  experience: AiExperience,
): AiExperienceLimitKey {
  return `experience:${experience}`;
}
export function experienceForLimitKey(value: string): AiExperience | null {
  const candidate = value.slice("experience:".length);
  return value.startsWith("experience:") && isAiExperience(candidate)
    ? candidate
    : null;
}
export function resolveAiExperience(
  feature: AiUsageFeature,
  requested?: unknown,
): AiExperience {
  const allowed = AI_FEATURE_EXPERIENCES[feature];
  if (requested != null) {
    if (isAiExperience(requested) && allowed.includes(requested))
      return requested;
    throw new Error("Invalid AI experience for this operation");
  }
  if (allowed.length === 1) return allowed[0]!;
  throw new Error("This AI operation requires an explicit experience");
}
export function recordedAiExperience(
  feature: string,
  experience?: string | null,
): AiExperience | null {
  if (
    !aiFeatureDescriptor(feature) ||
    aiFeatureDescriptor(feature)?.section === "HISTORY"
  )
    return null;
  const allowed = AI_FEATURE_EXPERIENCES[feature as AiUsageFeature];
  if (isAiExperience(experience) && allowed.includes(experience))
    return experience;
  return !experience && allowed.length === 1 ? allowed[0]! : null;
}
export function normalizeAiLimitKey(
  value: string,
): AiExperienceLimitKey | null {
  const experience =
    experienceForLimitKey(value) ?? recordedAiExperience(value);
  return experience ? experienceLimitKey(experience) : null;
}
export function fixedFeaturesForExperience(experience: AiExperience) {
  return AI_USAGE_FEATURES.filter(
    (feature) =>
      AI_FEATURE_EXPERIENCES[feature].length === 1 &&
      AI_FEATURE_EXPERIENCES[feature][0] === experience,
  );
}
export function featuresForExperience(experience: AiExperience) {
  return AI_USAGE_FEATURES.filter((feature) =>
    AI_FEATURE_EXPERIENCES[feature].includes(experience),
  );
}
export function speakingExperience(
  surface?: unknown,
  isFreeTopic = false,
): AiExperience {
  if (surface === "PLACEMENT") return "PLACEMENT";
  if (surface === "SPEAKING_LAB" || (!surface && isFreeTopic))
    return "SPEAKING_LAB";
  if (surface == null || surface === "JOURNEY") return "JOURNEY_SPEAKING";
  throw new Error("Invalid Speaking surface");
}
