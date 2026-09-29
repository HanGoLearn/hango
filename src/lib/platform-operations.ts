import "server-only";

import { db } from "@/lib/db";
import { serverEnv } from "@/lib/env/server";
import { getStorageProvider } from "@/lib/storage";
import { isTransactionalEmailConfigured } from "@/lib/email";
import { getGlobalAiBudgetSummary } from "@/lib/admin-ai-usage";

export type PlatformHealthStatus =
  "HEALTHY" | "DEGRADED" | "DOWN" | "NOT_CONFIGURED" | "UNKNOWN";

export interface PlatformHealthItem {
  key: string;
  label: string;
  status: PlatformHealthStatus;
  detail: string;
  checkedAt: Date;
}

export interface PlatformAlert {
  severity: "warning" | "critical";
  title: string;
  detail: string;
  href?: string;
}

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

async function databaseHealth(now: Date): Promise<PlatformHealthItem> {
  try {
    await db.$queryRaw`SELECT 1`;
    return {
      key: "database",
      label: "Base de datos",
      status: "HEALTHY",
      detail: "La conexión de lectura respondió correctamente.",
      checkedAt: now,
    };
  } catch {
    return {
      key: "database",
      label: "Base de datos",
      status: "DOWN",
      detail: "La comprobación de conexión falló.",
      checkedAt: now,
    };
  }
}

async function storageHealth(now: Date): Promise<PlatformHealthItem> {
  try {
    const storage = getStorageProvider();
    await storage.list("__healthcheck__");
    const localInProduction =
      serverEnv.NODE_ENV === "production" && storage.name === "local";
    return {
      key: "storage",
      label: "Almacenamiento",
      status: localInProduction ? "DEGRADED" : "HEALTHY",
      detail: localInProduction
        ? "El almacenamiento local responde, pero no es persistente en el hosting de producción."
        : `El proveedor ${storage.name} respondió a una lectura no destructiva.`,
      checkedAt: now,
    };
  } catch {
    return {
      key: "storage",
      label: "Almacenamiento",
      status: "DOWN",
      detail: "La lectura de comprobación falló.",
      checkedAt: now,
    };
  }
}

function emailHealth(
  now: Date,
  heartbeat:
    | {
        status: "RUNNING" | "HEALTHY" | "DEGRADED" | "FAILED";
        lastSucceededAt: Date | null;
        lastFailedAt: Date | null;
        errorCode: string | null;
      }
    | undefined,
): PlatformHealthItem {
  const configured = isTransactionalEmailConfigured();
  if (!configured) {
    return {
      key: "email",
      label: "Correo transaccional",
      status: "NOT_CONFIGURED",
      detail:
        "No configurado: el registro y la recuperación por correo no deben abrirse al público.",
      checkedAt: now,
    };
  }
  if (heartbeat?.status === "FAILED") {
    return {
      key: "email",
      label: "Correo transaccional",
      status: "DOWN",
      detail: `El último envío falló (${heartbeat.errorCode ?? "error no identificado"}).`,
      checkedAt: now,
    };
  }
  return {
    key: "email",
    label: "Correo transaccional",
    status: heartbeat?.lastSucceededAt ? "HEALTHY" : "UNKNOWN",
    detail: heartbeat?.lastSucceededAt
      ? `Último envío correcto: ${heartbeat.lastSucceededAt.toISOString()}.`
      : "Credenciales configuradas; todavía no hay un envío real registrado.",
    checkedAt: now,
  };
}

function cronHealth(input: {
  key: string;
  label: string;
  heartbeat:
    | {
        status: "RUNNING" | "HEALTHY" | "DEGRADED" | "FAILED";
        lastStartedAt: Date | null;
        lastSucceededAt: Date | null;
        lastFailedAt: Date | null;
        errorCode: string | null;
      }
    | undefined;
  staleAfterMs: number;
  now: Date;
}): PlatformHealthItem {
  if (!serverEnv.CRON_SECRET) {
    return {
      key: input.key,
      label: input.label,
      status: "NOT_CONFIGURED",
      detail: "El disparador autenticado todavía no está configurado.",
      checkedAt: input.now,
    };
  }
  if (!input.heartbeat) {
    return {
      key: input.key,
      label: input.label,
      status: "UNKNOWN",
      detail: "Configurado, pero aún no hay una ejecución registrada.",
      checkedAt: input.now,
    };
  }
  if (input.heartbeat.status === "FAILED") {
    return {
      key: input.key,
      label: input.label,
      status: "DOWN",
      detail: `La última ejecución falló (${input.heartbeat.errorCode ?? "error no identificado"}).`,
      checkedAt: input.now,
    };
  }
  const reference =
    input.heartbeat.lastSucceededAt ?? input.heartbeat.lastStartedAt;
  if (
    !reference ||
    input.now.getTime() - reference.getTime() > input.staleAfterMs
  ) {
    return {
      key: input.key,
      label: input.label,
      status: "DEGRADED",
      detail:
        "No registra una ejecución correcta dentro del intervalo esperado.",
      checkedAt: input.now,
    };
  }
  return {
    key: input.key,
    label: input.label,
    status: input.heartbeat.status === "DEGRADED" ? "DEGRADED" : "HEALTHY",
    detail:
      input.heartbeat.status === "DEGRADED"
        ? `Terminó con incidencias (${input.heartbeat.errorCode ?? "revisar resultado"}).`
        : `Última ejecución correcta: ${reference.toISOString()}.`,
    checkedAt: input.now,
  };
}

export async function getPlatformOperations(now = new Date()) {
  const [database, storage] = await Promise.all([
    databaseHealth(now),
    storageHealth(now),
  ]);

  const databaseAvailable = database.status === "HEALTHY";
  const [heartbeatsResult, eventsResult, deletionResult, budgetResult] =
    databaseAvailable
      ? await Promise.allSettled([
          db.operationalHeartbeat.findMany({
            where: {
              key: {
                in: [
                  "cron.private-object-retention",
                  "cron.weekly-leaderboard-payout",
                  "email.transactional",
                ],
              },
            },
          }),
          db.operationalEvent.findMany({
            where: { resolvedAt: null },
            orderBy: [{ severity: "desc" }, { lastSeenAt: "desc" }],
            take: 20,
          }),
          Promise.all([
            db.privateObjectDeletion.count({
              where: { status: { in: ["PENDING", "PROCESSING"] } },
            }),
            db.privateObjectDeletion.count({ where: { status: "FAILED" } }),
            db.privateObjectDeletion.count({
              where: {
                status: { in: ["PENDING", "FAILED"] },
                nextAttemptAt: { lt: new Date(now.getTime() - HOUR_MS) },
              },
            }),
          ]),
          getGlobalAiBudgetSummary(),
        ])
      : ([
          { status: "rejected" },
          { status: "rejected" },
          { status: "rejected" },
          { status: "rejected" },
        ] as const);

  const heartbeats =
    heartbeatsResult.status === "fulfilled" ? heartbeatsResult.value : [];
  const heartbeatByKey = new Map(heartbeats.map((row) => [row.key, row]));
  const events = eventsResult.status === "fulfilled" ? eventsResult.value : [];
  const [deletionPending, deletionFailed, deletionOverdue] =
    deletionResult.status === "fulfilled" ? deletionResult.value : [0, 0, 0];
  const budget =
    budgetResult.status === "fulfilled" ? budgetResult.value : null;

  const services: PlatformHealthItem[] = [
    {
      key: "application",
      label: "Aplicación",
      status: "HEALTHY",
      detail: "El panel administrativo respondió.",
      checkedAt: now,
    },
    database,
    storage,
    emailHealth(now, heartbeatByKey.get("email.transactional")),
    cronHealth({
      key: "cron.private-object-retention",
      label: "Cron de borrado privado",
      heartbeat: heartbeatByKey.get("cron.private-object-retention"),
      staleAfterMs: 36 * HOUR_MS,
      now,
    }),
    cronHealth({
      key: "cron.weekly-leaderboard-payout",
      label: "Cron de leaderboard",
      heartbeat: heartbeatByKey.get("cron.weekly-leaderboard-payout"),
      staleAfterMs: 9 * DAY_MS,
      now,
    }),
  ];

  const alerts: PlatformAlert[] = [];
  for (const service of services) {
    if (service.status === "DOWN") {
      alerts.push({
        severity: "critical",
        title: `${service.label} no está saludable`,
        detail: service.detail,
      });
    } else if (
      service.status === "DEGRADED" ||
      (serverEnv.NODE_ENV === "production" &&
        ["NOT_CONFIGURED", "UNKNOWN"].includes(service.status))
    ) {
      alerts.push({
        severity: "warning",
        title: `Revisar ${service.label.toLowerCase()}`,
        detail: service.detail,
      });
    }
  }
  if (deletionFailed > 0 || deletionOverdue > 0) {
    alerts.push({
      severity:
        deletionFailed >= 5 || deletionOverdue >= 10 ? "critical" : "warning",
      title: "Cola de borrado privado necesita atención",
      detail: `${deletionPending} pendientes, ${deletionFailed} fallidos y ${deletionOverdue} vencidos.`,
    });
  }
  if (budget && budget.alertLevel !== "NORMAL") {
    alerts.push({
      severity: budget.usagePercent >= 90 ? "critical" : "warning",
      title: "Presupuesto diario de IA cerca del límite",
      detail: `${budget.usagePercent.toLocaleString("es-CO", { maximumFractionDigits: 1 })}% autorizado de USD ${budget.dailyLimitUsd.toLocaleString("es-CO", { maximumFractionDigits: 2 })}.`,
      href: "/admin/limits",
    });
  }
  for (const event of events) {
    if (event.severity === "CRITICAL" || event.occurrenceCount >= 3) {
      alerts.push({
        severity: event.severity === "CRITICAL" ? "critical" : "warning",
        title: `${event.source.toLowerCase()} · ${event.code.replaceAll("_", " ")}`,
        detail: `${event.occurrenceCount} ocurrencia${event.occurrenceCount === 1 ? "" : "s"}${event.route ? ` en ${event.route}` : ""}.`,
      });
    }
  }

  return {
    generatedAt: now,
    services,
    events,
    alerts,
    deletionQueue: {
      pending: deletionPending,
      failed: deletionFailed,
      overdue: deletionOverdue,
    },
    budget,
  };
}

export async function getPublicHealthStatus() {
  const now = new Date();
  const [database, storage] = await Promise.all([
    databaseHealth(now),
    storageHealth(now),
  ]);
  const healthy = database.status === "HEALTHY" && storage.status === "HEALTHY";
  return { healthy, checkedAt: now };
}
