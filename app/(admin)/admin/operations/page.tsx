import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  Ban,
  CheckCircle2,
  CircleX,
  Clock3,
  Info,
  ShieldCheck,
} from "lucide-react";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { requireAdministrator } from "@/lib/admin-auth";
import {
  getAdminAiOperations,
  type AiOperationsPeriod,
} from "@/lib/admin-ai-operations";

type SearchParams = Promise<{ period?: string }>;

const dateTimeFormatter = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Bogota",
});

function number(value: number) {
  return value.toLocaleString("es-CO");
}

function rate(value: number | null) {
  return value === null ? "Sin datos" : `${value}%`;
}

function latency(value: number | null) {
  if (value === null) return "—";
  if (value < 1_000) return `${value} ms`;
  return `${(value / 1_000).toLocaleString("es-CO", {
    maximumFractionDigits: 1,
  })} s`;
}

function errorLabel(code: string | null) {
  if (!code || code === "unknown") return "Error no identificado";
  if (code === "timeout") return "Tiempo de espera agotado";
  if (code === "provider_rate_limited") return "Límite del proveedor";
  if (code === "provider_http_error") return "Error HTTP del proveedor";
  if (code === "daily_cap_exceeded") return "Límite diario alcanzado";
  if (code === "user_cap_exceeded")
    return "Límite personalizado del usuario alcanzado";
  if (code === "user_feature_blocked")
    return "Función bloqueada para este usuario";
  return code.replaceAll("_", " ");
}

export default async function AdminOperationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const parsedPeriod = Number(params.period);
  const period: AiOperationsPeriod = [7, 30, 90].includes(parsedPeriod)
    ? (parsedPeriod as AiOperationsPeriod)
    : 30;
  // Free cache() hit (2026-09-08 optimization pass) - admin/layout.tsx
  // already resolved this for the same request; reusing it here avoids
  // getAdminAiOperations needing its own User-table join to exclude the
  // administrator's own AI usage from the report.
  const administrator = await requireAdministrator();
  const operations = await getAdminAiOperations(period, administrator.id);
  const maxTrendValue = Math.max(
    1,
    ...operations.trend.map(
      (day) => day.successes + day.failures + day.blocked,
    ),
  );
  const activeFeatures = [...operations.byFeature].sort(
    (a, b) => b.attempts - a.attempts || a.label.localeCompare(b.label),
  );

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-interface text-caption font-semibold uppercase tracking-[0.12em] text-primary-400">
            Salud de la plataforma
          </p>
          <h1 className="mt-1 font-display text-page-title font-semibold">
            Operaciones de IA
          </h1>
          <p className="mt-1 max-w-3xl font-interface text-supporting text-text-secondary">
            Detecta errores, lentitud y límites alcanzados en Han y las
            experiencias de aprendizaje antes de que se conviertan en un
            problema para más estudiantes.
          </p>
        </div>
        <PeriodSwitch active={period} />
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Operaciones exitosas"
          value={rate(operations.overall.successRate)}
          detail={`${number(operations.overall.successes)} correctas de ${number(operations.overall.successes + operations.overall.failures)} completadas`}
          icon={<CheckCircle2 className="size-5" aria-hidden="true" />}
        />
        <AdminStatCard
          label="Errores del proveedor"
          value={number(operations.overall.failures)}
          detail={`${number(operations.overall.affectedUsers)} usuarios afectados por error o bloqueo`}
          icon={<CircleX className="size-5" aria-hidden="true" />}
        />
        <AdminStatCard
          label="Bloqueadas por límite"
          value={number(operations.overall.blocked)}
          detail="No llegaron a ejecutarse en el proveedor"
          icon={<Ban className="size-5" aria-hidden="true" />}
        />
        <AdminStatCard
          label="Latencia p95"
          value={latency(operations.overall.p95LatencyMs)}
          detail={`Mediana ${latency(operations.overall.p50LatencyMs)} · ${number(operations.overall.latencySamples)} muestras`}
          icon={<Clock3 className="size-5" aria-hidden="true" />}
        />
      </section>

      <section
        className={`rounded-panel border p-5 ${
          operations.alerts.length
            ? "border-warning-500/40 bg-warning-500/10"
            : "border-success-500/40 bg-success-500/10"
        }`}
      >
        <div className="flex items-start gap-3">
          {operations.alerts.length ? (
            <AlertTriangle
              className="mt-0.5 size-5 shrink-0 text-warning-500"
              aria-hidden="true"
            />
          ) : (
            <ShieldCheck
              className="mt-0.5 size-5 shrink-0 text-success-500"
              aria-hidden="true"
            />
          )}
          <div>
            <h2 className="font-interface text-body font-semibold">
              {operations.alerts.length
                ? `${operations.alerts.length} señal${operations.alerts.length === 1 ? " requiere" : "es requieren"} atención`
                : operations.overall.attempts
                  ? "Sin señales críticas en este periodo"
                  : "La medición operativa está lista"}
            </h2>
            {!operations.alerts.length && (
              <p className="mt-1 font-interface text-supporting text-text-secondary">
                {operations.overall.attempts
                  ? "Las funciones medidas están dentro de los umbrales de error, velocidad y uso configurados."
                  : "Los datos aparecerán aquí con las próximas operaciones de IA; el histórico anterior no se reconstruye para evitar conclusiones falsas."}
              </p>
            )}
            {!!operations.alerts.length && (
              <div className="mt-3 grid gap-2 lg:grid-cols-2">
                {operations.alerts.map((alert, index) => (
                  <div
                    key={`${alert.title}-${index}`}
                    className={`rounded-card border p-3 ${
                      alert.severity === "critical"
                        ? "border-error-500/30 bg-error-500/10"
                        : "border-warning-500/30 bg-surface/60"
                    }`}
                  >
                    <p className="font-interface text-supporting font-semibold">
                      {alert.title}
                    </p>
                    <p className="mt-0.5 font-interface text-caption text-text-secondary">
                      {alert.detail}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-panel border border-border bg-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-section-title font-semibold">
              Pulso diario
            </h2>
            <p className="font-interface text-caption text-text-muted">
              Correctas, errores reales y solicitudes detenidas por límite.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 font-interface text-caption text-text-secondary">
            <Legend color="bg-success-500" label="Correctas" />
            <Legend color="bg-error-500" label="Errores" />
            <Legend color="bg-warning-500" label="Bloqueadas" />
          </div>
        </div>
        <div className="mt-6 overflow-x-auto pb-8">
          <div
            className="flex h-52 items-end gap-1.5"
            style={{
              minWidth: `${Math.max(560, operations.trend.length * 22)}px`,
            }}
            role="img"
            aria-label="Tendencia diaria de operaciones de inteligencia artificial"
          >
            {operations.trend.map((day, index) => {
              const total = day.successes + day.failures + day.blocked;
              return (
                <div
                  key={day.day.toISOString()}
                  className="group relative flex h-full min-w-4 flex-1 flex-col justify-end border-b border-border"
                  title={`${day.label}: ${day.successes} correctas, ${day.failures} errores, ${day.blocked} bloqueadas`}
                >
                  <span
                    className="w-full bg-success-500"
                    style={{
                      height: `${(day.successes / maxTrendValue) * 170}px`,
                    }}
                  />
                  <span
                    className="w-full bg-error-500"
                    style={{
                      height: `${(day.failures / maxTrendValue) * 170}px`,
                    }}
                  />
                  <span
                    className="w-full bg-warning-500"
                    style={{
                      height: `${(day.blocked / maxTrendValue) * 170}px`,
                    }}
                  />
                  {total === 0 && <span className="h-0.5 w-full bg-border" />}
                  {(operations.trend.length <= 7 ||
                    index % (period === 30 ? 5 : 15) === 0) && (
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap font-interface text-[10px] text-text-muted">
                      {day.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="min-w-0 overflow-hidden rounded-panel border border-border bg-surface">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-display text-section-title font-semibold">
            Confiabilidad por función
          </h2>
          <p className="font-interface text-caption text-text-muted">
            Cada sistema permanece identificado por separado para localizar el
            origen exacto de un problema.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[940px] text-left font-interface text-supporting">
            <thead className="bg-elevated text-caption uppercase tracking-wide text-text-muted">
              <tr>
                <th className="px-5 py-3">Función</th>
                <th className="px-4 py-3 text-right">Intentos</th>
                <th className="px-4 py-3 text-right">Éxito</th>
                <th className="px-4 py-3 text-right">Errores</th>
                <th className="px-4 py-3 text-right">Bloqueadas</th>
                <th className="px-4 py-3 text-right">p50</th>
                <th className="px-5 py-3 text-right">p95</th>
              </tr>
            </thead>
            <tbody>
              {activeFeatures.map((feature) => (
                <tr key={feature.key} className="border-t border-border">
                  <td className="px-5 py-3">
                    <p className="font-semibold">{feature.label}</p>
                    <p className="text-caption text-text-muted">
                      {feature.key}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {number(feature.attempts)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {rate(feature.successRate)}
                  </td>
                  <td className="px-4 py-3 text-right text-error-500">
                    {number(feature.failures)}
                  </td>
                  <td className="px-4 py-3 text-right text-warning-500">
                    {number(feature.blocked)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {latency(feature.p50LatencyMs)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {latency(feature.p95LatencyMs)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="min-w-0 overflow-hidden rounded-panel border border-border bg-surface">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-display text-section-title font-semibold">
              Proveedor y modelo
            </h2>
            <p className="font-interface text-caption text-text-muted">
              Permite distinguir un problema de HanGo de uno externo.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left font-interface text-supporting">
              <thead className="bg-elevated text-caption uppercase tracking-wide text-text-muted">
                <tr>
                  <th className="px-5 py-3">Proveedor · modelo</th>
                  <th className="px-4 py-3 text-right">Intentos</th>
                  <th className="px-4 py-3 text-right">Éxito</th>
                  <th className="px-5 py-3 text-right">p95</th>
                </tr>
              </thead>
              <tbody>
                {operations.byProviderModel.map((row) => (
                  <tr key={row.key} className="border-t border-border">
                    <td className="px-5 py-3 font-semibold">{row.label}</td>
                    <td className="px-4 py-3 text-right">{row.attempts}</td>
                    <td className="px-4 py-3 text-right">
                      {rate(row.successRate)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {latency(row.p95LatencyMs)}
                    </td>
                  </tr>
                ))}
                {!operations.byProviderModel.length && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-8 text-center text-text-muted"
                    >
                      Aún no hay operaciones registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-panel border border-border bg-surface p-5">
          <h2 className="font-display text-section-title font-semibold">
            Tipos de error
          </h2>
          <p className="font-interface text-caption text-text-muted">
            Códigos normalizados; nunca se guardan mensajes privados del
            proveedor.
          </p>
          <div className="mt-4 grid gap-2">
            {operations.errorCodes.map((error) => (
              <div
                key={error.code}
                className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-card bg-elevated p-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-interface text-supporting font-semibold">
                    {errorLabel(error.code)}
                  </p>
                  <p className="font-interface text-caption text-text-muted">
                    {error.affectedUsers} usuario
                    {error.affectedUsers === 1 ? "" : "s"} afectado
                    {error.affectedUsers === 1 ? "" : "s"}
                  </p>
                </div>
                <span className="font-display text-section-title font-semibold text-error-500">
                  {error.count}
                </span>
              </div>
            ))}
            {!operations.errorCodes.length && (
              <p className="rounded-card bg-success-500/10 p-4 font-interface text-supporting text-success-500">
                No se registraron errores de proveedor.
              </p>
            )}
          </div>
        </article>
      </section>

      <section className="min-w-0 overflow-hidden rounded-panel border border-border bg-surface">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-display text-section-title font-semibold">
            Incidentes recientes
          </h2>
          <p className="font-interface text-caption text-text-muted">
            Últimos errores y bloqueos del periodo seleccionado.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left font-interface text-supporting">
            <thead className="bg-elevated text-caption uppercase tracking-wide text-text-muted">
              <tr>
                <th className="px-5 py-3">Fecha</th>
                <th className="px-4 py-3">Función</th>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Resultado</th>
                <th className="px-5 py-3">Detalle seguro</th>
              </tr>
            </thead>
            <tbody>
              {operations.incidents.map((incident) => (
                <tr key={incident.id} className="border-t border-border">
                  <td className="whitespace-nowrap px-5 py-3 text-caption text-text-secondary">
                    {dateTimeFormatter.format(incident.createdAt)}
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    {incident.featureLabel}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/users/${incident.user.id}`}
                      className="font-medium text-primary-400 hover:underline"
                    >
                      {incident.user.name ??
                        incident.user.email ??
                        "Sin nombre"}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-caption font-semibold ${
                        incident.outcome === "FAILURE"
                          ? "bg-error-500/15 text-error-500"
                          : "bg-warning-500/15 text-warning-500"
                      }`}
                    >
                      {incident.outcome === "FAILURE" ? "Error" : "Bloqueada"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-text-secondary">
                    {errorLabel(incident.errorCode)}
                    {incident.latencyMs !== null
                      ? ` · ${latency(incident.latencyMs)}`
                      : ""}
                  </td>
                </tr>
              ))}
              {!operations.incidents.length && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-text-muted"
                  >
                    No hay incidentes en este periodo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <details className="rounded-panel border border-border bg-surface p-5">
        <summary className="flex cursor-pointer list-none items-center gap-2 font-interface text-supporting font-semibold">
          <Info className="size-4 text-info-500" aria-hidden="true" />
          Cómo leer y proteger estas métricas
        </summary>
        <ul className="mt-4 grid gap-2 pl-6 font-interface text-caption text-text-secondary">
          <li>
            Éxito se calcula solo sobre operaciones que llegaron al proveedor;
            los bloqueos diarios se muestran aparte.
          </li>
          <li>
            p50 representa la experiencia habitual y p95 los casos más lentos.
          </li>
          <li>
            Se guarda función, proveedor, modelo, resultado, código normalizado
            y latencia. No se guardan prompts, conversaciones, transcripciones,
            audio ni mensajes crudos de error.
          </li>
          <li>
            La medición empieza desde esta entrega y no inventa datos para el
            histórico anterior.
          </li>
        </ul>
      </details>
    </div>
  );
}

function PeriodSwitch({ active }: { active: AiOperationsPeriod }) {
  return (
    <nav
      aria-label="Periodo de operaciones de IA"
      className="flex w-fit rounded-control border border-border bg-surface p-1"
    >
      {([7, 30, 90] as const).map((period) => (
        <Link
          key={period}
          href={`/admin/operations?period=${period}`}
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
