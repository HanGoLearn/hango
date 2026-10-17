import {
  isRealtimeUsageFeature,
  REALTIME_SESSION_ESTIMATE_USD,
} from "@/lib/realtime-usage";

export interface AiInteractionCostInput {
  feature: string;
  provider: string;
  calls: number;
  costUsd: number;
}

/** Display references, not measured provider billing. Realtime reuses the
 * approved session estimate; Vocabulary still logs its separate token costs. */
export function getAiInteractionCost(input: AiInteractionCostInput) {
  if (input.provider === "openai" && input.feature === "vocabulary-lookup") {
    return {
      amountUsd: 0.0007,
      description: "Referencia por búsqueda nueva",
    };
  }
  if (input.provider === "openai" && isRealtimeUsageFeature(input.feature)) {
    return {
      amountUsd: REALTIME_SESSION_ESTIMATE_USD,
      description: "Estimación por sesión; no costo medido",
    };
  }
  return {
    amountUsd:
      Number.isFinite(input.calls) &&
      input.calls > 0 &&
      Number.isFinite(input.costUsd) &&
      input.costUsd >= 0
        ? input.costUsd / input.calls
        : null,
    description: "Promedio registrado del período",
  };
}
