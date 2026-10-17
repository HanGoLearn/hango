import {
  getAiInteractionCost,
  type AiInteractionCostInput,
} from "@/lib/admin-ai-interaction-cost";

export function AiInteractionCost({ row }: { row: AiInteractionCostInput }) {
  const cost = getAiInteractionCost(row);
  const amount =
    cost.amountUsd == null
      ? "Sin datos"
      : `US$${new Intl.NumberFormat("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 8,
        }).format(cost.amountUsd)}`;
  return (
    <div>
      <span className="font-semibold text-text-primary">{amount}</span>
      <span className="mt-1 block text-caption text-text-muted">
        {cost.description}
      </span>
    </div>
  );
}
