import "server-only";
import { db } from "@/lib/db";
import { grantCoins } from "@/lib/coins";
import { weekKey } from "@/lib/points-system";

/**
 * Weekly leaderboard payout (2026-08-30, user request - "al finalizar la
 * semana, al top 1 le des 50 monedas, al top 2 30, al top 3 10... es un
 * evento que se da todas las semanas"). Ranked by HanCoins *earned during
 * the week that just ended*, not all-time General Level rank - the
 * existing /leaderboard barely reorders week to week, so ranking the
 * weekly prize by it would crown the same 3 learners forever. Coins earned
 * is a real, already-tracked proxy for "who was most active this specific
 * week" (every coin source is a real lesson/scenario/achievement), so this
 * needs no new tracking, just a date-bounded query over CoinLedgerEntry.
 *
 * Meant to run once, shortly after each week's boundary - see
 * app/api/cron/weekly-leaderboard-payout/route.ts for how it's triggered.
 * Safe to call more than once for the same week: grantCoins's
 * `sourceKey` uniqueness (`weekly_top:{weekKey}:{userId}`) makes a retried
 * or duplicate call a no-op, never a double payout.
 */
const WEEKLY_TOP_PAYOUTS = [50, 30, 10]; // index 0 = rank 1

/** Monday 00:00 UTC (inclusive) .. the following Monday 00:00 UTC (exclusive) for the ISO week containing `dateInsideWeek`. Exported for unit testing. */
export function isoWeekBounds(dateInsideWeek: Date): { start: Date; end: Date } {
  const day = new Date(
    Date.UTC(
      dateInsideWeek.getUTCFullYear(),
      dateInsideWeek.getUTCMonth(),
      dateInsideWeek.getUTCDate(),
    ),
  );
  const dayNumber = (day.getUTCDay() + 6) % 7; // Monday = 0
  const start = new Date(day);
  start.setUTCDate(day.getUTCDate() - dayNumber);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 7);
  return { start, end };
}

export interface WeeklyPayoutResult {
  weekKey: string;
  paid: { userId: string; rank: number; amount: number }[];
}

/**
 * `now` defaults to the real current time - overridable so tests can pin a
 * deterministic week. Looks at "yesterday" relative to `now`, not `now`
 * itself, so this stays correct however many minutes after the actual UTC
 * week boundary the scheduler happens to fire it.
 */
export async function runWeeklyLeaderboardPayout(
  now: Date = new Date(),
): Promise<WeeklyPayoutResult> {
  const endedWeekDate = new Date(now);
  endedWeekDate.setUTCDate(endedWeekDate.getUTCDate() - 1);
  const key = weekKey(endedWeekDate);
  const { start, end } = isoWeekBounds(endedWeekDate);

  const earners = await db.coinLedgerEntry.groupBy({
    by: ["userId"],
    where: { amount: { gt: 0 }, createdAt: { gte: start, lt: end } },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
    take: WEEKLY_TOP_PAYOUTS.length,
  });

  const paid: WeeklyPayoutResult["paid"] = [];
  for (let index = 0; index < earners.length; index++) {
    const earner = earners[index]!;
    if ((earner._sum.amount ?? 0) <= 0) continue;
    const amount = WEEKLY_TOP_PAYOUTS[index]!;
    await grantCoins(
      earner.userId,
      amount,
      "weekly_leaderboard",
      `weekly_top:${key}:${earner.userId}`,
    );
    paid.push({ userId: earner.userId, rank: index + 1, amount });
  }

  return { weekKey: key, paid };
}
