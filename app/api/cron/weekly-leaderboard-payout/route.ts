import { serverEnv } from "@/lib/env/server";
import { runWeeklyLeaderboardPayout } from "@/lib/weekly-leaderboard-payout";

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

  const result = await runWeeklyLeaderboardPayout();
  return Response.json(result);
}
