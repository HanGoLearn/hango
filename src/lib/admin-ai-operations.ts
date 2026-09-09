import "server-only";

import { db } from "@/lib/db";
import { AI_USAGE_FEATURES } from "@/lib/ai-usage";
import { FEATURE_LABELS } from "@/lib/admin-ai-usage";
import { summarizeAiOperations } from "@/lib/admin-ai-operations-metrics";

const DAY_MS = 86_400_000;
const BOGOTA_OFFSET_MS = 5 * 60 * 60 * 1000;

export type AiOperationsPeriod = 7 | 30 | 90;

function bogotaPeriodStart(period: AiOperationsPeriod, now = new Date()): Date {
  const todayNumber = Math.floor((now.getTime() - BOGOTA_OFFSET_MS) / DAY_MS);
  return new Date((todayNumber - (period - 1)) * DAY_MS + BOGOTA_OFFSET_MS);
}

/**
 * `excludeUserId` replaces a `user: { email: { not: ADMIN_EMAIL } } }` join
 * (2026-09-08 optimization pass) - the caller (the admin page, which already
 * resolved the logged-in administrator's id via requireAdministrator() to
 * even reach this page) passes it in directly, turning an unindexable
 * per-row join against User into a plain composite-index range scan on
 * AiOperationLog's own (userId, createdAt) index. Kept as a parameter
 * rather than calling requireAdministrator() in here so this stays a plain,
 * auth-free data function - integration tests can call it directly without
 * pulling in the next-auth module graph.
 */
export async function getAdminAiOperations(
  period: AiOperationsPeriod,
  excludeUserId: string,
) {
  const now = new Date();
  const periodStart = bogotaPeriodStart(period, now);
  const [rows, incidents] = await Promise.all([
    db.aiOperationLog.findMany({
      where: {
        createdAt: { gte: periodStart },
        userId: { not: excludeUserId },
      },
      select: {
        id: true,
        userId: true,
        feature: true,
        provider: true,
        model: true,
        outcome: true,
        errorCode: true,
        latencyMs: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    db.aiOperationLog.findMany({
      where: {
        createdAt: { gte: periodStart },
        outcome: { not: "SUCCESS" },
        userId: { not: excludeUserId },
      },
      select: {
        id: true,
        feature: true,
        provider: true,
        model: true,
        outcome: true,
        errorCode: true,
        latencyMs: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return {
    period,
    generatedAt: now,
    ...summarizeAiOperations(rows, {
      period,
      now,
      knownFeatures: AI_USAGE_FEATURES,
      featureLabels: FEATURE_LABELS,
    }),
    incidents: incidents.map((incident) => ({
      ...incident,
      featureLabel:
        FEATURE_LABELS[incident.feature as keyof typeof FEATURE_LABELS] ??
        incident.feature,
    })),
  };
}
