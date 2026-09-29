import { serverEnv } from "@/lib/env/server";
import { runWeeklyLeaderboardPayout } from "@/lib/weekly-leaderboard-payout";
import {
  markOperationalHeartbeatBestEffort,
  normalizedOperationalErrorCode,
  recordOperationalEventBestEffort,
} from "@/lib/operational-events";

/**
 * Weekly leaderboard payout trigger (2026-08-30). GET, not POST - matches
 * Vercel Cron's own convention (a GET request, with an automatic
 * `Authorization: Bearer $CRON_SECRET` header when a var named exactly
 * CRON_SECRET is set), and is trivial for any other cron service to hit
 * too. Nothing runs until CRON_SECRET is actually set - see
 * src/lib/env/server.ts.
 */
export async function GET(request: Request) {
  if (!serverEnv.CRON_SECRET) {
    return new Response("Weekly payout is not configured", { status: 503 });
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${serverEnv.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  await markOperationalHeartbeatBestEffort({
    key: "cron.weekly-leaderboard-payout",
    status: "RUNNING",
  });

  try {
    const result = await runWeeklyLeaderboardPayout();
    await markOperationalHeartbeatBestEffort({
      key: "cron.weekly-leaderboard-payout",
      status: "HEALTHY",
    });
    return Response.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const errorCode = normalizedOperationalErrorCode(error);
    await Promise.all([
      markOperationalHeartbeatBestEffort({
        key: "cron.weekly-leaderboard-payout",
        status: "FAILED",
        errorCode,
      }),
      recordOperationalEventBestEffort({
        source: "CRON",
        severity: "CRITICAL",
        code: errorCode,
        route: "/api/cron/weekly-leaderboard-payout",
        method: "GET",
      }),
    ]);
    throw error;
  }
}
