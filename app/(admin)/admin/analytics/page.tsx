import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Coins,
  Info,
  RefreshCcw,
  ShieldAlert,
  Sparkles,
  Users,
} from "lucide-react";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { requireAdministrator } from "@/lib/admin-auth";
import { getAdminAnalytics, type AnalyticsPeriod } from "@/lib/admin-analytics";

type SearchParams = Promise<{ period?: string }>;

function usd(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value < 1 ? 4 : 2,
  }).format(value);
}

function number(value: number) {
  return value.toLocaleString("es-CO");
}

function duration(seconds: number) {
  if (seconds < 60) return `${Math.round(seconds)} s`;
  const minutes = seconds / 60;
  if (minutes < 60) {
    return `${minutes.toLocaleString("es-CO", { maximumFractionDigits: 1 })} min`;
  }
  return `${(minutes / 60).toLocaleString("es-CO", { maximumFractionDigits: 1 })} h`;
}

function rateLabel(row: {
  calculationMethod: string;
  inputRateUsdPerMillionTokens: number | null;
  outputRateUsdPerMillionTokens: number | null;
  audioRateUsdPerMinute: number | null;
}) {
  if (
    row.calculationMethod === "TOKEN_RATES" &&
    row.inputRateUsdPerMillionTokens !== null &&
    row.outputRateUsdPerMillionTokens !== null
  ) {
    return `${usd(row.inputRateUsdPerMillionTokens)} entrada · ${usd(row.outputRateUsdPerMillionTokens)} salida / 1M tokens`;
  }
  if (
    row.calculationMethod === "PER_MINUTE" &&
    row.audioRateUsdPerMinute !== null
  ) {
    return `${usd(row.audioRateUsdPerMinute)} / minuto`;
  }
  return "No registrada en el histórico anterior";
}

function methodLabel(method: string) {
  if (method === "TOKEN_RATES") return "Tokens";
  if (method === "PER_MINUTE") return "Audio por minuto";
  return "Estimación heredada";
}

function durationSourceLabel(source: string | null) {
  if (source === "CLIENT_RECORDED") return "medida por la grabación";
  if (source === "PROVIDER_REPORTED") return "informada por el proveedor";
  if (source === "BYTE_SIZE_ESTIMATE") return "aproximada por tamaño";
  if (source === "TEXT_LENGTH_ESTIMATE") return "aproximada por texto";
  return null;
}

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const parsedPeriod = Number(params.period);
  const period: AnalyticsPeriod = [7, 30, 90].includes(parsedPeriod)
    ? (parsedPeriod as AnalyticsPeriod)
    : 30;
  // Free cache() hit (2026-09-08 optimization pass) - admin/layout.tsx
  // already resolved this for the same request.
  const administrator = await requireAdministrator();
  const analytics = await getAdminAnalytics(period, administrator.id);
  const maxTrendValue = Math.max(
    1,
    ...analytics.trend.flatMap((day) => [day.activeUsers, day.completions]),
  );
  const change = analytics.comparison.completionChange;

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-interface text-caption font-semibold uppercase tracking-[0.12em] text-primary-400">
            Decisiones de producto
          </p>
          <h1 className="mt-1 font-display text-page-title font-semibold">
            Analítica y engagement
          </h1>
          <p className="mt-1 max-w-3xl font-interface text-supporting text-text-secondary">
            Descubre dónde avanzan los estudiantes, dónde abandonan y qué
            experiencias generan retorno y costo.
          </p>
        </div>
        <PeriodSwitch active={period} />
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label={`Usuarios activos · ${period} días`}
          value={number(analytics.engagement.activeUsers)}
          detail="Actividad visible e interactuada"
          icon={<Activity className="size-5" aria-hidden="true" />}
        />
        <AdminStatCard
          label="Usuarios que regresaron"
          value={`${analytics.engagement.returningRate}%`}
          detail={`${analytics.engagement.returningUsers} estuvieron activos al menos 2 días`}
          icon={<RefreshCcw className="size-5" aria-hidden="true" />}
        />
        <AdminStatCard
          label="Actividades completadas"
          value={number(analytics.comparison.currentCompletions)}
          detail={
            change === null
              ? "Sin periodo anterior comparable"
              : `${change >= 0 ? "+" : ""}${change}% frente al periodo anterior`
          }
          icon={
            change !== null && change < 0 ? (
              <ArrowDownRight className="size-5" aria-hidden="true" />
            ) : (
              <ArrowUpRight className="size-5" aria-hidden="true" />
            )
          }
        />
        <AdminStatCard
          label="Alertas accionables"
          value={analytics.alerts.length}
          detail="Límites, conversión, actividad y reactivación"
          icon={<ShieldAlert className="size-5" aria-hidden="true" />}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-panel border border-border bg-surface p-5">
          <div className="flex items-center gap-2">
            <Activity className="size-5 text-primary-400" aria-hidden="true" />
            <h2 className="font-display text-section-title font-semibold">
              Sesiones reales de actividad
            </h2>
          </div>
          <p className="mt-1 font-interface text-caption text-text-muted">
            Solo intervalos con la pestaña visible e interacción reciente.
          </p>
          <dl className="mt-5 grid grid-cols-3 gap-3 font-interface">
            <Metric label="DAU" value={number(analytics.activity.dau)} />
            <Metric label="WAU" value={number(analytics.activity.wau)} />
            <Metric label="MAU" value={number(analytics.activity.mau)} />
          </dl>
          <dl className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
            <Metric
              label={`Sesiones · ${period} días`}
              value={number(analytics.activity.logicalSessions)}
            />
            <Metric
              label="Duración activa mediana"
              value={duration(analytics.activity.medianActiveSeconds)}
            />
            <Metric
              label="Tiempo activo total"
              value={duration(analytics.activity.totalActiveSeconds)}
            />
            <Metric
              label="Frente al periodo anterior"
              value={
                analytics.activity.activeTimeChange === null
                  ? "Sin base comparable"
                  : `${analytics.activity.activeTimeChange >= 0 ? "+" : ""}${analytics.activity.activeTimeChange}%`
              }
              tone={
                analytics.activity.activeTimeChange === null
                  ? undefined
                  : analytics.activity.activeTimeChange < 0
                    ? "negative"
                    : "positive"
              }
            />
          </dl>
        </article>

        <article className="min-w-0 overflow-hidden rounded-panel border border-border bg-surface">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-display text-section-title font-semibold">
              Tiempo por experiencia
            </h2>
            <p className="font-interface text-caption text-text-muted">
              Comparación sin mezclar los sistemas de conversación y práctica.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left font-interface text-supporting">
              <thead className="bg-elevated text-caption uppercase tracking-wide text-text-muted">
                <tr>
                  <th className="px-5 py-3">Experiencia</th>
                  <th className="px-4 py-3 text-right">Usuarios</th>
                  <th className="px-4 py-3 text-right">Sesiones</th>
                  <th className="px-4 py-3 text-right">Interacciones</th>
                  <th className="px-5 py-3 text-right">Tiempo activo</th>
                </tr>
              </thead>
              <tbody>
                {analytics.activity.surfaces.map((surface) => (
                  <tr key={surface.surface} className="border-t border-border">
                    <td className="px-5 py-3 font-semibold">{surface.label}</td>
                    <td className="px-4 py-3 text-right">
                      {number(surface.users)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {number(surface.sessions)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {number(surface.interactions)}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold">
                      {duration(surface.activeSeconds)}
                    </td>
                  </tr>
                ))}
                {!analytics.activity.surfaces.length && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-10 text-center text-text-muted"
                    >
                      La medición comenzará con la próxima interacción de un
                      estudiante.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <article className="min-w-0 rounded-panel border border-border bg-surface p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-section-title font-semibold">
                Pulso diario
              </h2>
              <p className="font-interface text-caption text-text-muted">
                Usuarios con actividad visible y actividades completadas.
              </p>
            </div>
            <div className="flex gap-3 font-interface text-caption text-text-secondary">
              <Legend color="bg-primary-400" label="Activos" />
              <Legend color="bg-accent-300" label="Completadas" />
            </div>
          </div>
          <div className="mt-6 overflow-x-auto pb-8">
            <div
              className="flex h-56 items-end gap-1.5"
              style={{
                minWidth: `${Math.max(560, analytics.trend.length * 22)}px`,
              }}
              role="img"
              aria-label="Tendencia diaria de usuarios activos y actividades completadas"
            >
              {analytics.trend.map((day, index) => (
                <div
                  key={day.day.toISOString()}
                  className="group relative flex h-full min-w-4 flex-1 items-end justify-center gap-0.5 border-b border-border"
                  title={`${day.label}: ${day.activeUsers} activos, ${day.completions} completadas`}
                >
                  <span
                    className="w-[42%] min-w-1 rounded-t-sm bg-primary-400 transition-opacity group-hover:opacity-80"
                    style={{
                      height: `${Math.max(2, (day.activeUsers / maxTrendValue) * 180)}px`,
                    }}
                  />
                  <span
                    className="w-[42%] min-w-1 rounded-t-sm bg-accent-300 transition-opacity group-hover:opacity-80"
                    style={{
                      height: `${Math.max(2, (day.completions / maxTrendValue) * 180)}px`,
                    }}
                  />
                  {(analytics.trend.length <= 7 ||
                    index % (period === 30 ? 5 : 15) === 0) && (
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap font-interface text-[10px] text-text-muted">
                      {day.label}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="rounded-panel border border-border bg-surface p-5">
          <h2 className="font-display text-section-title font-semibold">
            Retención de registro
          </h2>
          <p className="font-interface text-caption text-text-muted">
            Regreso en el día calendario exacto.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            {analytics.retention.map((retention) => (
              <div
                key={retention.day}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-card bg-elevated p-4"
              >
                <span className="flex size-10 items-center justify-center rounded-full bg-primary-500/15 font-interface text-supporting font-bold text-primary-400">
                  D{retention.day}
                </span>
                <div className="min-w-0">
                  <p className="font-interface text-supporting font-semibold">
                    {retention.returned} regresaron
                  </p>
                  <p className="font-interface text-caption text-text-muted">
                    De {retention.eligible} usuarios elegibles
                  </p>
                </div>
                <span className="font-display text-section-title font-semibold text-accent-300">
                  {retention.rate}%
                </span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1.15fr]">
        <article className="rounded-panel border border-border bg-surface p-5">
          <h2 className="font-display text-section-title font-semibold">
            Embudo de activación
          </h2>
          <p className="font-interface text-caption text-text-muted">
            Cohorte de usuarios registrados durante los últimos {period} días.
          </p>
          <div className="mt-5 grid gap-4">
            {analytics.funnel.map((stage, index) => (
              <div key={stage.label}>
                <div className="mb-1.5 flex items-end justify-between gap-4">
                  <div>
                    <p className="font-interface text-supporting font-semibold">
                      {index + 1}. {stage.label}
                    </p>
                    <p className="font-interface text-caption text-text-muted">
                      {stage.users} usuarios · {stage.conversionFromPrevious}%
                      desde el paso anterior
                    </p>
                  </div>
                  <span className="font-interface text-caption font-semibold text-text-secondary">
                    {stage.conversionFromRegistration}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-elevated">
                  <div
                    className="h-full rounded-full bg-primary-500"
                    style={{ width: `${stage.conversionFromRegistration}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-panel border border-border bg-surface p-5">
          <h2 className="font-display text-section-title font-semibold">
            Señales de engagement
          </h2>
          <p className="font-interface text-caption text-text-muted">
            Retorno, personalización y progreso comunitario.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <EngagementTile
              label="Alta frecuencia"
              value={analytics.engagement.highlyEngagedUsers}
              detail={`Activos 4+ días de ${period}`}
            />
            <EngagementTile
              label="Para reactivar"
              value={analytics.engagement.dormantUsers}
              detail="Onboarding completo, sin acceso en 14 días"
            />
            <EngagementTile
              label="Avatar creado"
              value={`${analytics.engagement.avatarAdoptionRate}%`}
              detail={`${analytics.engagement.avatarOwners} de ${analytics.engagement.onboardedUsers} usuarios onboarded`}
            />
            <EngagementTile
              label="Compraron accesorios"
              value={analytics.engagement.accessoryOwners}
              detail="Usuarios que participaron en la economía"
            />
            <EngagementTile
              label="Con achievements"
              value={analytics.engagement.achievementOwners}
              detail="Usuarios con al menos un logro"
            />
            <EngagementTile
              label="En leaderboard"
              value={analytics.engagement.leaderboardParticipants}
              detail="Usuarios con progreso auténtico mayor a cero"
            />
          </div>
        </article>
      </section>

      <section className="rounded-panel border border-border bg-surface">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-display text-section-title font-semibold">
            Uso por experiencia
          </h2>
          <p className="font-interface text-caption text-text-muted">
            Cada sistema conserva su propia señal; no se mezclan sesiones ni
            actividades diferentes.
          </p>
        </div>
        <div className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-4">
          {analytics.systems.map((system) => (
            <article key={system.key} className="min-w-0 bg-surface p-5">
              <h3 className="font-interface text-card-title font-semibold">
                {system.label}
              </h3>
              <div className="mt-4 flex items-end justify-between gap-3">
                <div>
                  <p className="font-display text-section-title font-semibold">
                    {number(system.actions)}
                  </p>
                  <p className="font-interface text-caption text-text-muted">
                    acciones
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-interface text-supporting font-semibold">
                    {system.users} usuarios
                  </p>
                  <p className="font-interface text-caption text-text-muted">
                    {usd(system.costUsd)} IA
                  </p>
                </div>
              </div>
              <p className="mt-3 font-interface text-caption text-text-secondary">
                {system.detail}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="grid gap-4">
          <article className="rounded-panel border border-border bg-surface p-5">
            <div className="flex items-center gap-2">
              <Coins className="size-5 text-accent-300" aria-hidden="true" />
              <h2 className="font-display text-section-title font-semibold">
                Economía · {period} días
              </h2>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-4 font-interface">
              <Metric
                label="Ganados"
                value={`+${number(analytics.economy.earnedCoins)}`}
                tone="positive"
              />
              <Metric
                label="Gastados"
                value={`−${number(analytics.economy.spentCoins)}`}
                tone="negative"
              />
              <Metric
                label="Otorgados por admin"
                value={number(analytics.economy.adminGrantedCoins)}
              />
              <Metric
                label="Usuarios con movimientos"
                value={number(analytics.economy.activeRecipients)}
              />
            </dl>
          </article>

          <article className="rounded-panel border border-border bg-surface p-5">
            <div className="flex items-center gap-2">
              <Sparkles
                className="size-5 text-primary-400"
                aria-hidden="true"
              />
              <h2 className="font-display text-section-title font-semibold">
                Eficiencia de IA
              </h2>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-4 font-interface">
              <Metric
                label="Costo total"
                value={usd(analytics.ai.totalCostUsd)}
              />
              <Metric
                label="Solicitudes"
                value={number(analytics.ai.totalCalls)}
              />
              <Metric
                label="Por usuario activo"
                value={usd(analytics.ai.costPerActiveUser)}
              />
              <Metric
                label="Por actividad completada"
                value={usd(analytics.ai.costPerCompletion)}
              />
            </dl>
          </article>
        </div>

        <article className="min-w-0 overflow-hidden rounded-panel border border-border bg-surface">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-display text-section-title font-semibold">
              Funciones de IA con mayor costo
            </h2>
            <p className="font-interface text-caption text-text-muted">
              Desglose por función, proveedor, modelo y tarifa histórica usada
              en cada estimación.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left font-interface text-supporting">
              <thead className="bg-elevated text-caption uppercase tracking-wide text-text-muted">
                <tr>
                  <th className="px-5 py-3">Función</th>
                  <th className="px-4 py-3">Proveedor / modelo</th>
                  <th className="px-4 py-3">Método y evidencia</th>
                  <th className="px-4 py-3">Tarifa histórica</th>
                  <th className="px-4 py-3 text-right">Solicitudes</th>
                  <th className="px-5 py-3 text-right">Costo</th>
                </tr>
              </thead>
              <tbody>
                {analytics.ai.rows.map((row) => (
                  <tr
                    key={`${row.feature}:${row.provider}:${row.model}:${row.calculationMethod}:${row.durationSource}:${row.inputRateUsdPerMillionTokens}:${row.outputRateUsdPerMillionTokens}:${row.audioRateUsdPerMinute}`}
                    className="border-t border-border"
                  >
                    <td className="px-5 py-3">
                      <span className="font-semibold">{row.label}</span>
                      <span className="block text-caption text-text-muted">
                        {row.feature}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {row.provider} · {row.model}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      <span className="font-semibold text-text-primary">
                        {methodLabel(row.calculationMethod)}
                      </span>
                      {row.durationSeconds > 0 && (
                        <span className="block text-caption text-text-muted">
                          {(row.durationSeconds / 60).toLocaleString("es-CO", {
                            maximumFractionDigits: 1,
                          })}{" "}
                          min
                          {durationSourceLabel(row.durationSource)
                            ? ` · ${durationSourceLabel(row.durationSource)}`
                            : ""}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-caption text-text-secondary">
                      {rateLabel(row)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {number(row.calls)}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold">
                      {usd(row.costUsd)}
                    </td>
                  </tr>
                ))}
                {!analytics.ai.rows.length && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-10 text-center text-text-muted"
                    >
                      No hubo consumo de IA durante este periodo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="rounded-panel border border-border bg-surface p-5">
        <div className="flex items-center gap-2">
          <AlertTriangle
            className="size-5 text-warning-500"
            aria-hidden="true"
          />
          <h2 className="font-display text-section-title font-semibold">
            Alertas y oportunidades
          </h2>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {analytics.alerts.map((alert, index) => (
            <Link
              key={`${alert.title}:${index}`}
              href={alert.href}
              className="rounded-card border border-border bg-elevated p-4 transition-colors hover:border-primary-500"
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-1 size-2.5 shrink-0 rounded-full ${
                    alert.severity === "critical"
                      ? "bg-error-500"
                      : alert.severity === "warning"
                        ? "bg-warning-500"
                        : "bg-info-500"
                  }`}
                />
                <div>
                  <p className="font-interface text-supporting font-semibold">
                    {alert.title}
                  </p>
                  <p className="mt-1 font-interface text-caption text-text-secondary">
                    {alert.detail}
                  </p>
                </div>
              </div>
            </Link>
          ))}
          {!analytics.alerts.length && (
            <div className="rounded-card bg-secondary-500/10 p-4 font-interface text-supporting text-secondary-400 lg:col-span-2">
              No hay alertas con los criterios actuales.
            </div>
          )}
        </div>
      </section>

      <details className="rounded-panel border border-border bg-surface p-5">
        <summary className="flex cursor-pointer list-none items-center gap-2 font-interface text-supporting font-semibold">
          <Info className="size-4 text-info-500" aria-hidden="true" />
          Cómo leer estas métricas
        </summary>
        <ul className="mt-4 grid gap-2 pl-6 font-interface text-caption text-text-secondary">
          <li>{analytics.methodology.activity}</li>
          <li>{analytics.methodology.retention}</li>
          <li>{analytics.methodology.separation}</li>
        </ul>
      </details>
    </div>
  );
}

function PeriodSwitch({ active }: { active: AnalyticsPeriod }) {
  return (
    <nav
      aria-label="Periodo de analítica"
      className="flex w-fit rounded-control border border-border bg-surface p-1"
    >
      {([7, 30, 90] as const).map((period) => (
        <Link
          key={period}
          href={`/admin/analytics?period=${period}`}
          aria-current={active === period ? "page" : undefined}
          className={`rounded-control px-3 py-1.5 font-interface text-supporting font-semibold transition-colors ${
            active === period
              ? "bg-primary-500 text-on-color-light"
              : "text-text-secondary hover:bg-elevated hover:text-text-primary"
          }`}
        >
          {period} días
        </Link>
      ))}
    </nav>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`size-2.5 rounded-sm ${color}`} /> {label}
    </span>
  );
}

function EngagementTile({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <div className="rounded-card bg-elevated p-4">
      <p className="font-display text-section-title font-semibold">{value}</p>
      <p className="font-interface text-supporting font-semibold">{label}</p>
      <p className="mt-1 font-interface text-caption text-text-muted">
        {detail}
      </p>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "positive" | "negative";
}) {
  return (
    <div>
      <dt className="text-caption text-text-muted">{label}</dt>
      <dd
        className={`mt-1 text-card-title font-semibold ${
          tone === "positive"
            ? "text-secondary-400"
            : tone === "negative"
              ? "text-primary-400"
              : "text-text-primary"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
