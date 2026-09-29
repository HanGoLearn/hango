import "server-only";

import { createHash } from "node:crypto";
import { db } from "@/lib/db";

export type OperationalEventSourceValue =
  "SERVER" | "CLIENT" | "CRON" | "EMAIL" | "STORAGE" | "DATABASE";

export type OperationalEventSeverityValue = "INFO" | "WARNING" | "CRITICAL";

export type OperationalHeartbeatStatusValue =
  "RUNNING" | "HEALTHY" | "DEGRADED" | "FAILED";

const SAFE_CODE = /^[a-z0-9][a-z0-9._-]{0,79}$/;
const SAFE_METHOD = /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)$/;
const SAFE_DIGEST = /^[A-Za-z0-9_-]{1,100}$/;

function normalizedCode(value: string, fallback = "unknown"): string {
  const candidate = value.trim().toLowerCase();
  return SAFE_CODE.test(candidate) ? candidate : fallback;
}

/**
 * Keeps only a pathname/route template and masks segments that could identify
 * an account. Query strings and fragments are never retained.
 */
export function sanitizeOperationalRoute(value: string | null | undefined) {
  if (!value) return null;
  const route = value.split(/[?#]/, 1)[0]?.trim();
  if (!route?.startsWith("/")) return null;

  return route
    .replace(
      /\/(?:[0-9a-f]{8}-[0-9a-f-]{27,}|[a-z0-9_-]{20,}|[^/]*%40[^/]*)/gi,
      "/:id",
    )
    .slice(0, 180);
}

function sanitizeDigest(value: string | null | undefined) {
  if (!value) return null;
  const candidate = value.trim();
  return SAFE_DIGEST.test(candidate) ? candidate : null;
}

function sanitizeMethod(value: string | null | undefined) {
  const candidate = value?.trim().toUpperCase();
  return candidate && SAFE_METHOD.test(candidate) ? candidate : null;
}

function fingerprint(input: {
  source: OperationalEventSourceValue;
  code: string;
  route: string | null;
  method: string | null;
  digest: string | null;
}) {
  return createHash("sha256")
    .update(
      [input.source, input.code, input.route, input.method, input.digest].join(
        "\u0000",
      ),
    )
    .digest("hex");
}

export function normalizedOperationalErrorCode(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    const errorCode = Reflect.get(error, "code");
    if (typeof errorCode === "string") {
      const normalized = normalizedCode(errorCode);
      if (normalized !== "unknown") return normalized;
    }
    const name = Reflect.get(error, "name");
    if (typeof name === "string") {
      return normalizedCode(name, "application_error");
    }
  }
  return "application_error";
}

export async function recordOperationalEvent(input: {
  source: OperationalEventSourceValue;
  severity: OperationalEventSeverityValue;
  code: string;
  route?: string | null;
  method?: string | null;
  digest?: string | null;
}): Promise<void> {
  const code = normalizedCode(input.code);
  const route = sanitizeOperationalRoute(input.route);
  const method = sanitizeMethod(input.method);
  const digest = sanitizeDigest(input.digest);
  const eventFingerprint = fingerprint({
    source: input.source,
    code,
    route,
    method,
    digest,
  });
  const now = new Date();

  await db.operationalEvent.upsert({
    where: { fingerprint: eventFingerprint },
    create: {
      fingerprint: eventFingerprint,
      source: input.source,
      severity: input.severity,
      code,
      route,
      method,
      digest,
      firstSeenAt: now,
      lastSeenAt: now,
    },
    update: {
      severity: input.severity,
      occurrenceCount: { increment: 1 },
      lastSeenAt: now,
      resolvedAt: null,
    },
  });
}

/** Telemetry must never replace the original operation with a logging error. */
export async function recordOperationalEventBestEffort(
  input: Parameters<typeof recordOperationalEvent>[0],
): Promise<void> {
  try {
    await recordOperationalEvent(input);
  } catch {
    console.error("[operational-event-write-failed]");
  }
}

export async function markOperationalHeartbeat(input: {
  key: string;
  status: OperationalHeartbeatStatusValue;
  errorCode?: string | null;
  now?: Date;
}): Promise<void> {
  const key = normalizedCode(input.key, "unknown_service");
  const now = input.now ?? new Date();
  const errorCode = input.errorCode ? normalizedCode(input.errorCode) : null;

  await db.operationalHeartbeat.upsert({
    where: { key },
    create: {
      key,
      status: input.status,
      lastStartedAt: input.status === "RUNNING" ? now : null,
      lastSucceededAt:
        input.status === "HEALTHY" || input.status === "DEGRADED" ? now : null,
      lastFailedAt: input.status === "FAILED" ? now : null,
      errorCode,
    },
    update: {
      status: input.status,
      ...(input.status === "RUNNING" ? { lastStartedAt: now } : {}),
      ...(input.status === "HEALTHY" || input.status === "DEGRADED"
        ? { lastSucceededAt: now }
        : {}),
      ...(input.status === "FAILED" ? { lastFailedAt: now } : {}),
      errorCode,
    },
  });
}

export async function markOperationalHeartbeatBestEffort(
  input: Parameters<typeof markOperationalHeartbeat>[0],
): Promise<void> {
  try {
    await markOperationalHeartbeat(input);
  } catch {
    console.error("[operational-heartbeat-write-failed]");
  }
}
