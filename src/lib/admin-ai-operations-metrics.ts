export type AiOperationOutcomeValue = "SUCCESS" | "FAILURE" | "BLOCKED_CAP";

export interface AiOperationMetricRow {
  id: string;
  userId: string;
  feature: string;
  provider: string | null;
  model: string | null;
  outcome: AiOperationOutcomeValue;
  errorCode: string | null;
  latencyMs: number | null;
  createdAt: Date;
}

export interface AiOperationBreakdown {
  key: string;
  label: string;
  attempts: number;
  successes: number;
  failures: number;
  blocked: number;
  successRate: number | null;
  latencySamples: number;
  p50LatencyMs: number | null;
  p95LatencyMs: number | null;
  affectedUsers: number;
}

export interface AiOperationAlert {
  severity: "warning" | "critical";
  title: string;
  detail: string;
}

const DAY_MS = 86_400_000;
const BOGOTA_OFFSET_MS = 5 * 60 * 60 * 1000;

function percent(part: number, total: number): number | null {
  return total > 0 ? Math.round((part / total) * 1_000) / 10 : null;
}

function percentile(values: number[], percentileValue: number): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.max(
    0,
    Math.min(sorted.length - 1, Math.ceil(percentileValue * sorted.length) - 1),
  );
  return sorted[index] ?? null;
}

function bogotaDayKey(date: Date): string {
  return new Date(date.getTime() - BOGOTA_OFFSET_MS).toISOString().slice(0, 10);
}

function summarizeGroup(
  key: string,
  label: string,
  rows: AiOperationMetricRow[],
): AiOperationBreakdown {
  const successes = rows.filter((row) => row.outcome === "SUCCESS").length;
  const failures = rows.filter((row) => row.outcome === "FAILURE").length;
  const blocked = rows.filter((row) => row.outcome === "BLOCKED_CAP").length;
  const latencyValues = rows
    .filter((row) => row.outcome !== "BLOCKED_CAP" && row.latencyMs !== null)
    .map((row) => row.latencyMs as number);
  const affectedUsers = new Set(
    rows.filter((row) => row.outcome !== "SUCCESS").map((row) => row.userId),
  ).size;

  return {
    key,
    label,
    attempts: rows.length,
    successes,
    failures,
    blocked,
    successRate: percent(successes, successes + failures),
    latencySamples: latencyValues.length,
    p50LatencyMs: percentile(latencyValues, 0.5),
    p95LatencyMs: percentile(latencyValues, 0.95),
    affectedUsers,
  };
}

export function summarizeAiOperations(
  rows: AiOperationMetricRow[],
  options: {
    period: 7 | 30 | 90;
    now?: Date;
    knownFeatures: readonly string[];
    featureLabels: Record<string, string>;
  },
) {
  const overall = summarizeGroup("all", "Todas las funciones", rows);
  const byFeature = options.knownFeatures.map((feature) =>
    summarizeGroup(
      feature,
      options.featureLabels[feature] ?? feature,
      rows.filter((row) => row.feature === feature),
    ),
  );

  const providerGroups = new Map<string, AiOperationMetricRow[]>();
  for (const row of rows) {
    const provider = row.provider ?? "No identificado";
    const model = row.model ?? "Modelo no identificado";
    const key = `${provider}\u0000${model}`;
    providerGroups.set(key, [...(providerGroups.get(key) ?? []), row]);
  }
  const byProviderModel = [...providerGroups.entries()]
    .map(([key, groupRows]) => {
      const [provider, model] = key.split("\u0000");
      return summarizeGroup(key, `${provider} · ${model}`, groupRows);
    })
    .sort((a, b) => b.attempts - a.attempts);

  const errorGroups = new Map<string, AiOperationMetricRow[]>();
  for (const row of rows.filter((item) => item.outcome === "FAILURE")) {
    const key = row.errorCode ?? "unknown";
    errorGroups.set(key, [...(errorGroups.get(key) ?? []), row]);
  }
  const errorCodes = [...errorGroups.entries()]
    .map(([code, groupRows]) => ({
      code,
      count: groupRows.length,
      affectedUsers: new Set(groupRows.map((row) => row.userId)).size,
    }))
    .sort((a, b) => b.count - a.count);

  const now = options.now ?? new Date();
  const todayNumber = Math.floor((now.getTime() - BOGOTA_OFFSET_MS) / DAY_MS);
  const rowsByDay = new Map<string, AiOperationMetricRow[]>();
  for (const row of rows) {
    const key = bogotaDayKey(row.createdAt);
    rowsByDay.set(key, [...(rowsByDay.get(key) ?? []), row]);
  }
  const trend = Array.from({ length: options.period }, (_, index) => {
    const dayNumber = todayNumber - (options.period - index - 1);
    const day = new Date(dayNumber * DAY_MS + BOGOTA_OFFSET_MS);
    const dayRows = rowsByDay.get(bogotaDayKey(day)) ?? [];
    return {
      day,
      label: new Intl.DateTimeFormat("es-CO", {
        day: "numeric",
        month: "short",
        timeZone: "America/Bogota",
      }).format(day),
      successes: dayRows.filter((row) => row.outcome === "SUCCESS").length,
      failures: dayRows.filter((row) => row.outcome === "FAILURE").length,
      blocked: dayRows.filter((row) => row.outcome === "BLOCKED_CAP").length,
    };
  });

  const alerts: AiOperationAlert[] = [];
  for (const feature of byFeature) {
    const completed = feature.successes + feature.failures;
    const failureRate = percent(feature.failures, completed);
    if (completed >= 3 && failureRate !== null && failureRate >= 20) {
      alerts.push({
        severity: failureRate >= 40 ? "critical" : "warning",
        title: `Errores elevados en ${feature.label}`,
        detail: `${failureRate}% de ${completed} operaciones terminaron con error.`,
      });
    }
    if (
      feature.latencySamples >= 3 &&
      feature.p95LatencyMs !== null &&
      feature.p95LatencyMs >= 10_000
    ) {
      alerts.push({
        severity: feature.p95LatencyMs >= 20_000 ? "critical" : "warning",
        title: `Respuesta lenta en ${feature.label}`,
        detail: `El percentil 95 es de ${(feature.p95LatencyMs / 1_000).toFixed(1)} segundos.`,
      });
    }
    if (feature.blocked > 0) {
      alerts.push({
        severity: "warning",
        title: `Límite alcanzado en ${feature.label}`,
        detail: `${feature.blocked} solicitud${feature.blocked === 1 ? " fue bloqueada" : "es fueron bloqueadas"} por el límite diario.`,
      });
    }
  }

  return {
    overall,
    byFeature,
    byProviderModel,
    errorCodes,
    trend,
    alerts,
  };
}
