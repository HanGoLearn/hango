import { serverEnv } from "@/lib/env/server";
import { runPrivateObjectRetention } from "@/lib/private-object-retention";
import {
  markOperationalHeartbeatBestEffort,
  normalizedOperationalErrorCode,
  recordOperationalEventBestEffort,
} from "@/lib/operational-events";

/** Daily, idempotent enforcement of private Speaking Lab audio retention. */
export async function GET(request: Request) {
  if (!serverEnv.CRON_SECRET) {
    return new Response("Private-object retention is not configured", {
      status: 503,
    });
  }
  if (
    request.headers.get("authorization") !== `Bearer ${serverEnv.CRON_SECRET}`
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  await markOperationalHeartbeatBestEffort({
    key: "cron.private-object-retention",
    status: "RUNNING",
  });

  try {
    const result = await runPrivateObjectRetention();
    const degraded =
      result.outstandingFailed > 0 || result.processed.failed > 0;
    await markOperationalHeartbeatBestEffort({
      key: "cron.private-object-retention",
      status: degraded ? "DEGRADED" : "HEALTHY",
      errorCode: degraded ? "deletion_jobs_failed" : null,
    });
    if (degraded) {
      await recordOperationalEventBestEffort({
        source: "STORAGE",
        severity: "WARNING",
        code: "private_deletion_backlog",
        route: "/api/cron/private-object-retention",
        method: "GET",
      });
    }
    return Response.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const errorCode = normalizedOperationalErrorCode(error);
    await Promise.all([
      markOperationalHeartbeatBestEffort({
        key: "cron.private-object-retention",
        status: "FAILED",
        errorCode,
      }),
      recordOperationalEventBestEffort({
        source: "CRON",
        severity: "CRITICAL",
        code: errorCode,
        route: "/api/cron/private-object-retention",
        method: "GET",
      }),
    ]);
    throw error;
  }
}
