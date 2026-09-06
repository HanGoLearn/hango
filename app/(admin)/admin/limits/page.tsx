import { AlertTriangle, Bot, ShieldCheck } from "lucide-react";
import { AiUsageCapInput } from "@/components/admin/ai-usage-cap-input";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { getAiUsageSummary } from "@/lib/admin-ai-usage";

function formatUsd(value: number): string {
  return `$${value.toFixed(value < 1 ? 4 : 2)}`;
}

export default async function AdminLimitsPage() {
  const summary = await getAiUsageSummary();
  const todayCost = summary.reduce(
    (total, item) => total + item.todayCostUsd,
    0,
  );
  const monthCost = summary.reduce(
    (total, item) => total + item.monthCostUsd,
    0,
  );
  const activeFeatures = summary.filter(
    (item) => item.todayCallCount > 0,
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="font-interface text-caption font-semibold uppercase tracking-[0.12em] text-primary-400">
          Control de costos
        </p>
        <h1 className="mt-1 font-display text-page-title font-semibold">
          Límites y uso de IA
        </h1>
        <p className="mt-1 max-w-3xl font-interface text-supporting text-text-secondary">
          Costo estimado por cada función de OpenAI, TTS y transcripción. El
          límite diario se aplica individualmente a cada usuario y función.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <AdminStatCard
          label="Costo de hoy"
          value={formatUsd(todayCost)}
          detail="Todos los usuarios y funciones"
          icon={<Bot className="size-5" />}
        />
        <AdminStatCard
          label="Costo del mes"
          value={formatUsd(monthCost)}
          detail="Estimación interna, no factura final"
          icon={<ShieldCheck className="size-5" />}
        />
        <AdminStatCard
          label="Funciones activas hoy"
          value={activeFeatures}
          detail={`De ${summary.length} funciones controladas`}
          icon={<AlertTriangle className="size-5" />}
        />
      </section>

      <div className="overflow-x-auto rounded-panel border border-border bg-surface">
        <table className="w-full min-w-[800px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border bg-elevated font-interface text-caption font-semibold uppercase tracking-[0.08em] text-text-muted">
              <th className="px-4 py-3">Función</th>
              <th className="px-4 py-3">Hoy</th>
              <th className="px-4 py-3">Este mes</th>
              <th className="px-4 py-3">Límite diario por usuario</th>
            </tr>
          </thead>
          <tbody>
            {summary.map((row) => (
              <tr
                key={row.feature}
                className="border-b border-border last:border-b-0"
              >
                <td className="px-4 py-3 align-top">
                  <div className="font-interface text-body font-medium">
                    {row.label}
                  </div>
                  <span className="font-interface text-caption text-text-muted">
                    {row.feature}
                  </span>
                </td>
                <td className="px-4 py-3 align-top font-interface text-body">
                  {formatUsd(row.todayCostUsd)}
                  <span className="block text-caption text-text-muted">
                    {row.todayCallCount} solicitudes
                  </span>
                </td>
                <td className="px-4 py-3 align-top font-interface text-body">
                  {formatUsd(row.monthCostUsd)}
                  <span className="block text-caption text-text-muted">
                    {row.monthCallCount} solicitudes
                  </span>
                </td>
                <td className="px-4 py-3 align-top">
                  <AiUsageCapInput
                    feature={row.feature}
                    initialValue={row.dailyCapUsd}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
