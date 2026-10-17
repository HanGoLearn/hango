import type { AiTeacherContext, AiTeacherMode } from "@/lib/ai-context";

export type AiUsageFamily = "TEXT" | "STT" | "TTS" | "REALTIME";
export type AiCostSection = "INTERACTIVE" | "SHARED_CONTENT" | "HISTORY";
interface AiFeatureDescriptor {
  label: string;
  family: AiUsageFamily;
  section: AiCostSection;
  description: string;
  reportGroup?: "han-tutor";
  policyMigration?: string;
}
const voiceMigration = "20261010120000_separate_realtime_usage_limits";
const chatMigration = "20261010130000_separate_han_text_usage_limits";

/** One catalogue for accounting, reports and general/user limit editors.
 * Historical keys never get reassigned to a single product retroactively. */
export const AI_FEATURE_CATALOG = {
  "ai-teacher-chat": {
    label: "Chat de Han — histórico compartido",
    family: "TEXT",
    section: "HISTORY",
    description:
      "Registros anteriores mezclan Tutor, Companion y práctica. No se atribuyen a Companion.",
  },
  "han-tutor-chat": {
    label: "Chat escrito de Han Tutor",
    family: "TEXT",
    section: "INTERACTIVE",
    description:
      "Respuesta escrita de la burbuja. Costo por tokens, separado del inicio Realtime.",
    reportGroup: "han-tutor",
    policyMigration: chatMigration,
  },
  "han-companion-chat": {
    label: "Chat de Han Companion",
    family: "TEXT",
    section: "INTERACTIVE",
    description:
      "Solo mensajes de Companion, nunca del Tutor ni de personajes.",
    policyMigration: chatMigration,
  },
  "roleplay-chat": {
    label: "Chat escrito de práctica con personaje",
    family: "TEXT",
    section: "INTERACTIVE",
    description: "Alternativa escrita de role-play; no es Tutor ni Companion.",
    policyMigration: chatMigration,
  },
  "learner-fact-extraction": {
    label: "Memoria de Han Companion",
    family: "TEXT",
    section: "INTERACTIVE",
    description:
      "Extracción de datos personales de Companion, no memoria del Tutor.",
  },
  "vocabulary-lookup": {
    label: "Búsqueda de HanVocabulary",
    family: "TEXT",
    section: "INTERACTIVE",
    description:
      "Solo una búsqueda nueva consume IA. Caché compartido por palabra normalizada, nivel, idioma y versión del prompt.",
  },
  "mission-chat": {
    label: "Conversación de Mission",
    family: "TEXT",
    section: "INTERACTIVE",
    description: "Turnos escritos de una misión.",
  },
  "mission-report": {
    label: "Evaluación final de Mission",
    family: "TEXT",
    section: "INTERACTIVE",
    description: "Evaluación de misión, distinta de su conversación.",
  },
  "speaking-feedback": {
    label: "Evaluación de Speaking Lab",
    family: "TEXT",
    section: "INTERACTIVE",
    description: "Evaluación de grabación; no audio Realtime.",
  },
  "speaking-scenario": {
    label: "Escenario personalizado de Speaking Lab",
    family: "TEXT",
    section: "INTERACTIVE",
    description: "Generación de un escenario personalizado.",
  },
  "lesson-reflection": {
    label: "Reflexión final de la lección",
    family: "TEXT",
    section: "INTERACTIVE",
    description:
      "Evaluación escrita final. Lecturas TTS opcionales se registran aparte.",
  },
  "writing-feedback": {
    label: "Evaluación de Writing Lab",
    family: "TEXT",
    section: "INTERACTIVE",
    description: "Evaluación de texto escrito.",
  },
  "placement-grading": {
    label: "Evaluación oral de Placement",
    family: "TEXT",
    section: "INTERACTIVE",
    description: "Evaluación del examen, distinta de abrir su conversación.",
  },
  "free-topic-feedback": {
    label: "Evaluación de práctica libre",
    family: "TEXT",
    section: "INTERACTIVE",
    description: "Evaluación de conversación libre.",
  },
  "handwritten-writing": {
    label: "Evaluación de escritura a mano",
    family: "TEXT",
    section: "INTERACTIVE",
    description: "Análisis de la imagen de escritura.",
  },
  "welcome-audio": {
    label: "Audio de introducción al chino",
    family: "TTS",
    section: "SHARED_CONTENT",
    description:
      "Generación inicial compartida; reproducir el archivo guardado no llama a IA.",
  },
  "dialogue-audio": {
    label: "Audio de diálogos de lección",
    family: "TTS",
    section: "SHARED_CONTENT",
    description:
      "Generación inicial compartida; reproducir el archivo guardado no llama a IA.",
  },
  "grammar-audio": {
    label: "Audio de ejemplos de gramática",
    family: "TTS",
    section: "SHARED_CONTENT",
    description:
      "Generación inicial compartida; reproducir el archivo guardado no llama a IA.",
  },
  "vocabulary-audio": {
    label: "Audio de vocabulario y ejemplos",
    family: "TTS",
    section: "SHARED_CONTENT",
    description:
      "Generación inicial compartida; reproducir el archivo guardado no llama a IA.",
  },
  "placement-listening-audio": {
    label: "Audio de escucha de Placement",
    family: "TTS",
    section: "SHARED_CONTENT",
    description:
      "Generación inicial compartida; reproducir el archivo guardado no llama a IA.",
  },
  "han-speech": {
    label: "Lectura de respuestas en voz (TTS, no Realtime)",
    family: "TTS",
    section: "INTERACTIVE",
    description:
      "Botón de escuchar respuestas escritas, Reflexión o ejemplos. Incluye reescritura oral y TTS; el audio Realtime no usa esta ruta. Reutilizar el mismo texto, voz, idioma y estilo usa caché.",
  },
  "han-teacher-transcribe": {
    label: "Transcripción de grabaciones cortas de Han",
    family: "STT",
    section: "INTERACTIVE",
    description:
      "Grabación corta del chat; no la transcripción interna de Realtime.",
  },
  "speaking-transcribe": {
    label: "Transcripción de grabaciones de Speaking Lab",
    family: "STT",
    section: "INTERACTIVE",
    description:
      "Grabación subida para evaluar; no transcripción interna Realtime.",
  },
  "han-realtime-session": {
    label: "Voz en vivo — histórico compartido (sin separar)",
    family: "REALTIME",
    section: "HISTORY",
    description: "Estimaciones anteriores sin atribución fiable por producto.",
  },
  "han-tutor-realtime-session": {
    label: "Conversación de voz en vivo con Han",
    family: "REALTIME",
    section: "INTERACTIVE",
    description:
      "Han Tutor (burbuja). US$0.05 estimados al abrir una sesión; no se vuelve a sumar su audio como TTS.",
    reportGroup: "han-tutor",
    policyMigration: voiceMigration,
  },
  "han-companion-realtime-session": {
    label: "Conversación de voz en vivo — Han Companion",
    family: "REALTIME",
    section: "INTERACTIVE",
    description: "Sesión de Companion, independiente del Tutor.",
    policyMigration: voiceMigration,
  },
  "journey-speaking-realtime-session": {
    label: "Speaking de Learning Journey — conversación",
    family: "REALTIME",
    section: "INTERACTIVE",
    description: "Conversación del paso Speaking de la lección.",
    policyMigration: voiceMigration,
  },
  "speaking-lab-realtime-session": {
    label: "Speaking Lab — conversación",
    family: "REALTIME",
    section: "INTERACTIVE",
    description: "Conversación de las estaciones o práctica libre.",
    policyMigration: voiceMigration,
  },
  "placement-realtime-session": {
    label: "Examen oral — conversación",
    family: "REALTIME",
    section: "INTERACTIVE",
    description: "Sesión del examen oral de nivel.",
    policyMigration: voiceMigration,
  },
  "han-realtime-assessment": {
    label: "Evaluación de conversación por voz",
    family: "TEXT",
    section: "INTERACTIVE",
    description:
      "Llamada de texto independiente que comprueba el objetivo del role-play; no está medida dentro de US$0.05.",
  },
} as const satisfies Record<string, AiFeatureDescriptor>;

export type AiUsageFeature = keyof typeof AI_FEATURE_CATALOG;
/** Only unambiguous attribution. Shared TTS/STT, generic role-play assessment
 * and old mixed history stay in the financial report, not under Companion. */
export const AI_PRODUCT_FEATURES = {
  TUTOR: ["han-tutor-chat", "han-tutor-realtime-session"],
  COMPANION: [
    "han-companion-chat",
    "han-companion-realtime-session",
    "learner-fact-extraction",
  ],
  JOURNEY: [
    "welcome-audio",
    "dialogue-audio",
    "grammar-audio",
    "vocabulary-audio",
    "lesson-reflection",
    "journey-speaking-realtime-session",
  ],
  SPEAKING_LAB: [
    "speaking-feedback",
    "speaking-transcribe",
    "speaking-scenario",
    "free-topic-feedback",
    "speaking-lab-realtime-session",
  ],
  WRITING_LAB: ["writing-feedback", "handwritten-writing"],
  MISSIONS: ["mission-chat", "mission-report"],
  VOCABULARY: ["vocabulary-lookup"],
  PLACEMENT: [
    "placement-grading",
    "placement-listening-audio",
    "placement-realtime-session",
  ],
} as const satisfies Record<string, readonly AiUsageFeature[]>;
export const AI_USAGE_FEATURES = Object.keys(
  AI_FEATURE_CATALOG,
) as AiUsageFeature[];
export const AI_USAGE_LIMIT_FEATURES = AI_USAGE_FEATURES.filter(
  (feature) => AI_FEATURE_CATALOG[feature].section !== "HISTORY",
);
export const FEATURE_LABELS = Object.fromEntries(
  AI_USAGE_FEATURES.map((feature) => [
    feature,
    AI_FEATURE_CATALOG[feature].label,
  ]),
) as Record<AiUsageFeature, string>;
export const AI_FEATURE_FAMILY = Object.fromEntries(
  AI_USAGE_FEATURES.map((feature) => [
    feature,
    AI_FEATURE_CATALOG[feature].family,
  ]),
) as Record<AiUsageFeature, AiUsageFamily>;

export function aiFeatureDescriptor(
  feature: string,
): AiFeatureDescriptor | undefined {
  return Object.hasOwn(AI_FEATURE_CATALOG, feature)
    ? AI_FEATURE_CATALOG[feature as AiUsageFeature]
    : undefined;
}
export function resolveHanTextUsageFeature(
  mode: AiTeacherMode,
  context: AiTeacherContext,
) {
  if (context.rolePlay) return "roleplay-chat" as const;
  return mode === "PRACTICE"
    ? ("han-companion-chat" as const)
    : ("han-tutor-chat" as const);
}
