import type { JourneyQualityInspection } from "./journey-speaking-quality-candidate";
import type { JourneyPedagogyAudit } from "./journey-speaking-quality-pedagogy";

export type JourneyQualityReviewView = {
  attempts: Array<{
    id: string;
    lessonId: string;
    title: string;
    date: string;
    currentScore: number | null;
  }>;
  selectedId: string | null;
  title: string | null;
  turns: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    uncertain: boolean;
  }>;
  state: string;
  profile: Extract<JourneyQualityInspection, { ok: true }>["profile"] | null;
  issues: string[];
  pedagogy?: JourneyPedagogyAudit | null;
  usage: {
    model: string;
    inputTokens: number | null;
    outputTokens: number | null;
    estimatedCostUsd: number;
  } | null;
};

export const qualityReviewStates: Record<string, string> = {
  NOT_RUN: "Sin revisión candidata",
  RESERVED: "Revisión reservada o interrumpida",
  VALIDATED_CANDIDATE: "Candidato coherente · pendiente de revisión pedagógica",
  REJECTED_CANDIDATE: "Candidato rechazado por incoherencias",
  REFUSED: "El proveedor rechazó la solicitud",
  INCOMPLETE: "Respuesta incompleta",
  INVALID_OUTPUT: "Respuesta no válida",
  BUDGET_BLOCKED: "Bloqueada por límite de consumo",
  PROVIDER_FAILED: "Fallo de conexión o proveedor",
  STORAGE_OR_METERING_FAILED: "Pendiente de comprobar guardado o consumo",
  UNAVAILABLE: "No se pudo verificar este registro privado",
  ATTEMPT_UNAVAILABLE: "Intento no disponible en esta selección",
  EMPTY: "Todavía no hay intentos de las lecciones piloto",
};
