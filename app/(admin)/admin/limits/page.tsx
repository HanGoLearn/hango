import Link from "next/link";
import { aiFeatureDescriptor } from "@/lib/ai-feature-catalog";
import { AlertTriangle, Bot, ShieldCheck, UserRoundCog } from "lucide-react";
import { AiUsageCapInput } from "@/components/admin/ai-usage-cap-input";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { GlobalAiBudgetControl } from "@/components/admin/global-ai-budget-control";
import {
  getAiUsageSummary,
  getAiExperienceUsageSummary,
  getGlobalAiBudgetSummary,
  type GlobalAiBudgetAlertLevel,
} from "@/lib/admin-ai-usage";

function formatUsd(value: number): string {
  return `$${value.toFixed(value < 1 ? 4 : 2)}`;
}

const ALERT_COPY: Record<
  GlobalAiBudgetAlertLevel,
  { label: string; className: string }
> = {
  NORMAL: {
    label: "Operación normal",
    className: "border-success-500/30 bg-success-500/10 text-success-600",
  },
  NOTICE_50: {
    label: "Aviso: 50 % utilizado",
    className: "border-info-500/30 bg-info-500/10 text-info-600",
  },
  WARNING_75: {
    label: "Atención: 75 % utilizado",
    className: "border-warning-500/30 bg-warning-500/10 text-warning-600",
  },
  CRITICAL_90: {
    label: "Crítico: 90 % utilizado",
    className: "border-error-500/30 bg-error-500/10 text-error-600",
  },
  BLOCKED_100: {
    label: "Presupuesto agotado: nuevas llamadas bloqueadas",
    className: "border-error-500/40 bg-error-500/15 text-error-600",
  },
};

export default async function AdminLimitsPage() {
  const [technical, summary, globalBudget] = await Promise.all([
    getAiUsageSummary(),
    getAiExperienceUsageSummary(),
    getGlobalAiBudgetSummary(),
  ]);
  const monthCost = technical.reduce(
    (total, item) => total + item.monthCostUsd,
    0,
  );
  const activeFeatures = summary.filter(
    (item) => item.todayCallCount > 0,
  ).length;
  const alert = ALERT_COPY[globalBudget.alertLevel];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-interface text-caption font-semibold uppercase tracking-[0.12em] text-primary-400">
            Control de costos
          </p>
          <h1 className="mt-1 font-display text-page-title font-semibold">
            Límites y uso de IA
          </h1>
          <p className="mt-1 max-w-3xl font-interface text-supporting text-text-secondary">
            Un presupuesto diario por experiencia: voz, texto y evaluación
            descuentan del mismo saldo. Los nombres y consumos coinciden con
            Analítica y con la ficha de cada usuario.
          </p>
        </div>
        <Link
          href="/admin/users"
          className="inline-flex w-fit items-center gap-2 rounded-control border border-border-strong px-4 py-2 font-interface text-supporting font-semibold text-text-primary transition-colors hover:bg-elevated"
        >
          <UserRoundCog className="size-4" aria-hidden="true" />
          Asignar límite a un usuario
        </Link>
      </div>

      <section className="rounded-panel border border-border bg-surface p-5 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="font-interface text-caption font-semibold uppercase tracking-[0.1em] text-primary-400">
              Protección de toda la beta
            </p>
            <h2 className="mt-1 font-display text-section-title font-semibold text-text-primary">
              Presupuesto global de IA
            </h2>
            <p className="mt-1 max-w-3xl font-interface text-supporting text-text-secondary">
              La exposición autorizada reserva un máximo antes de llamar al
              proveedor. Es conservadora y puede superar el costo real estimado,
              pero nunca el límite diario configurado.
            </p>
          </div>
          <span
            className={`w-fit rounded-full border px-3 py-1 font-interface text-caption font-semibold ${alert.className}`}
          >
            {alert.label}
          </span>
        </div>

        <div className="grid gap-4 py-5 sm:grid-cols-3">
          <div>
            <p className="font-interface text-caption text-text-muted">
              Exposición autorizada hoy
            </p>
            <p className="mt-1 font-display text-section-title font-semibold">
              {formatUsd(globalBudget.authorizedUsd)}
            </p>
            <p className="font-interface text-caption text-text-muted">
              {globalBudget.authorizationCount} autorizaciones
            </p>
          </div>
          <div>
            <p className="font-interface text-caption text-text-muted">
              Límite diario
            </p>
            <p className="mt-1 font-display text-section-title font-semibold">
              {formatUsd(globalBudget.dailyLimitUsd)}
            </p>
            <p className="font-interface text-caption text-text-muted">
              Reinicio diario en UTC
            </p>
          </div>
          <div>
            <p className="font-interface text-caption text-text-muted">
              Costo registrado estimado hoy
            </p>
            <p className="mt-1 font-display text-section-title font-semibold">
              {formatUsd(globalBudget.actualCostUsd)}
            </p>
            <p className="font-interface text-caption text-text-muted">
              Realtime usa una estimación preventiva por sesión
            </p>
          </div>
        </div>

        <div
          className="h-2 overflow-hidden rounded-full bg-elevated"
          role="progressbar"
          aria-label="Presupuesto global autorizado"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(globalBudget.usagePercent)}
        >
          <div
            className="h-full rounded-full bg-primary-500 transition-[width]"
            style={{ width: `${globalBudget.usagePercent}%` }}
          />
        </div>
        <p className="mt-2 font-interface text-caption text-text-muted">
          {globalBudget.usagePercent.toFixed(1)} % del presupuesto autorizado.
          Los avisos cambian al 50 %, 75 % y 90 %; al 100 % se bloquean nuevas
          llamadas.
        </p>

        <div className="mt-5 border-t border-border pt-5">
          <GlobalAiBudgetControl
            dailyLimitUsd={globalBudget.dailyLimitUsd}
            textEnabled={globalBudget.textEnabled}
            sttEnabled={globalBudget.sttEnabled}
            ttsEnabled={globalBudget.ttsEnabled}
            realtimeEnabled={globalBudget.realtimeEnabled}
          />
        </div>
      </section>

      <p className="rounded-card border border-info-500/30 bg-info-500/10 px-4 py-3 font-interface text-supporting text-text-secondary">
        Estos son los límites generales. Una excepción configurada desde la
        ficha 360° de un usuario tiene prioridad y no modifica a los demás. La
        burbuja de Han, Companion y cada Speaking son experiencias
        independientes. Por ejemplo, US$2 para Han Tutor son US$2 compartidos
        entre todas sus operaciones, no US$2 para cada una. Una sesión de voz
        nueva descuenta US$0.05 estimados; las demás operaciones usan su costo
        registrado. Cero bloquea nuevas llamadas de esa experiencia. El día
        reinicia en UTC. Estos topes son sobre estimaciones, no máximos
        garantizados de la factura.
      </p>

      <section className="grid gap-4 sm:grid-cols-3">
        <AdminStatCard
          label="Costo de hoy"
          value={formatUsd(globalBudget.actualCostUsd)}
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
          label="Experiencias con uso hoy"
          value={activeFeatures}
          detail={`De ${summary.length} presupuestos compartidos`}
          icon={<AlertTriangle className="size-5" />}
        />
      </section>

      <div className="overflow-x-auto rounded-panel border border-border bg-surface">
        <table className="w-full min-w-[800px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border bg-elevated font-interface text-caption font-semibold uppercase tracking-[0.08em] text-text-muted">
              <th className="px-4 py-3">Experiencia</th>
              <th className="px-4 py-3">Hoy</th>
              <th className="px-4 py-3">Este mes</th>
              <th className="px-4 py-3">Límite diario por usuario</th>
            </tr>
          </thead>
          <tbody>
            {summary.map((row) => (
              <tr
                key={row.feature}
                id={`ai-limit-${row.feature}`}
                className="border-b border-border last:border-b-0"
              >
                <td className="px-4 py-3 align-top">
                  <div className="font-interface text-body font-medium">
                    {row.label}
                  </div>
                  <p className="mt-1 max-w-md font-interface text-caption text-text-muted">
                    {row.description}
                  </p>
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
                    label={row.label}
                    initialValue={row.dailyCapUsd}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <details className="rounded-panel border border-border bg-surface p-5">
        <summary className="cursor-pointer font-interface font-semibold">
          Avanzado: operaciones y políticas anteriores (solo lectura)
        </summary>
        <p className="mt-3 text-supporting text-text-muted">
          No hay límites adicionales que configurar aquí. Los antiguos topes se
          conservan como archivo; las nuevas llamadas usan el presupuesto
          compartido de arriba. El histórico sin origen confirmado sigue
          incluido en los totales, pero no se atribuye a una experiencia
          inventada.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[700px] text-left font-interface text-caption">
            <thead>
              <tr>
                <th className="p-2">Operación técnica</th>
                <th className="p-2">Hoy</th>
                <th className="p-2">Mes</th>
                <th className="p-2">Tope anterior archivado</th>
              </tr>
            </thead>
            <tbody>
              {technical.map((row) => (
                <tr key={row.feature} className="border-t border-border">
                  <td className="p-2">
                    {row.label}
                    <p className="text-text-muted">
                      {row.feature} ·{" "}
                      {aiFeatureDescriptor(row.feature)?.description}
                    </p>
                  </td>
                  <td className="p-2">{formatUsd(row.todayCostUsd)}</td>
                  <td className="p-2">{formatUsd(row.monthCostUsd)}</td>
                  <td className="p-2">{formatUsd(row.dailyCapUsd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
