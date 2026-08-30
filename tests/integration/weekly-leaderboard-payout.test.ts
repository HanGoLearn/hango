import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { runWeeklyLeaderboardPayout } from "@/lib/weekly-leaderboard-payout";
import { getCoinBalance } from "@/lib/coins";

// Fixed week (verified Monday->Monday): 2026-08-17T00:00:00Z .. 2026-08-24T00:00:00Z.
// `now` is a Monday morning right after it ends, so runWeeklyLeaderboardPayout's
// "yesterday" lands inside this exact week - deterministic, no real-clock dependency.
const NOW_JUST_AFTER_WEEK_END = new Date("2026-08-24T09:00:00Z");
const WITHIN_WEEK = new Date("2026-08-20T12:00:00Z");
const BEFORE_WEEK = new Date("2026-08-16T12:00:00Z");

const testEmails: string[] = [];

afterEach(async () => {
  if (testEmails.length > 0) {
    await db.user.deleteMany({ where: { email: { in: testEmails } } });
    testEmails.length = 0;
  }
});

async function createEarner(email: string, amount: number, createdAt: Date) {
  testEmails.push(email);
  const user = await db.user.create({ data: { email } });
  await db.coinLedgerEntry.create({
    data: {
      userId: user.id,
      amount,
      reason: "lesson_completed",
      sourceKey: `lesson:seed-${email}`,
      createdAt,
    },
  });
  return user;
}

describe("weekly leaderboard payout (integration, real database)", () => {
  it("pays 50/30/10 to the top 3 earners of the week that just ended", async () => {
    const stamp = Date.now();
    const first = await createEarner(`wk-1st-${stamp}@hango.dev`, 40, WITHIN_WEEK);
    const second = await createEarner(`wk-2nd-${stamp}@hango.dev`, 25, WITHIN_WEEK);
    const third = await createEarner(`wk-3rd-${stamp}@hango.dev`, 10, WITHIN_WEEK);
    const fourth = await createEarner(`wk-4th-${stamp}@hango.dev`, 5, WITHIN_WEEK);

    const result = await runWeeklyLeaderboardPayout(NOW_JUST_AFTER_WEEK_END);

    const paidById = new Map(result.paid.map((p) => [p.userId, p]));
    expect(paidById.get(first.id)).toMatchObject({ rank: 1, amount: 50 });
    expect(paidById.get(second.id)).toMatchObject({ rank: 2, amount: 30 });
    expect(paidById.get(third.id)).toMatchObject({ rank: 3, amount: 10 });
    expect(paidById.has(fourth.id)).toBe(false);

    // Balances reflect their real week's coins PLUS the bonus.
    expect(await getCoinBalance(first.id)).toBe(40 + 50);
    expect(await getCoinBalance(second.id)).toBe(25 + 30);
    expect(await getCoinBalance(third.id)).toBe(10 + 10);
    expect(await getCoinBalance(fourth.id)).toBe(5);
  });

  it("excludes coins earned outside the target week", async () => {
    const stamp = Date.now();
    const inWeek = await createEarner(`wk-in-${stamp}@hango.dev`, 20, WITHIN_WEEK);
    const beforeWeek = await createEarner(
      `wk-before-${stamp}@hango.dev`,
      1000,
      BEFORE_WEEK,
    );

    const result = await runWeeklyLeaderboardPayout(NOW_JUST_AFTER_WEEK_END);
    const paidIds = result.paid.map((p) => p.userId);

    expect(paidIds).toContain(inWeek.id);
    expect(paidIds).not.toContain(beforeWeek.id);
  });

  it("is idempotent - running it twice for the same week never pays twice", async () => {
    const stamp = Date.now();
    const winner = await createEarner(`wk-idem-${stamp}@hango.dev`, 15, WITHIN_WEEK);

    await runWeeklyLeaderboardPayout(NOW_JUST_AFTER_WEEK_END);
    await runWeeklyLeaderboardPayout(NOW_JUST_AFTER_WEEK_END);

    expect(await getCoinBalance(winner.id)).toBe(15 + 50);
    const bonusEntries = await db.coinLedgerEntry.count({
      where: { userId: winner.id, reason: "weekly_leaderboard" },
    });
    expect(bonusEntries).toBe(1);
  });
});
