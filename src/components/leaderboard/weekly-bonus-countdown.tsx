"use client";

import { useEffect, useState } from "react";
import { HanCoinsIcon } from "@/components/ui/hancoins-icon";
import { Body, Caption } from "@/components/ui/typography";

function formatRemaining(ms: number): string {
  if (ms <= 0) return "any moment now";
  const totalMinutes = Math.floor(ms / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * Live countdown to the current ISO week's boundary (2026-08-30, user
 * request). `weekEndsAt` is computed server-side (isoWeekBounds's `end`,
 * weekly-leaderboard-payout.ts) so this only ever ticks down against a
 * real calendar fact, independent of whether the actual weekly payout cron
 * is wired up yet (deferred separately) - the countdown itself doesn't
 * promise the trigger exists, only when the scoring week ends.
 */
export function WeeklyBonusCountdown({ weekEndsAt }: { weekEndsAt: string }) {
  const target = new Date(weekEndsAt).getTime();
  const [remaining, setRemaining] = useState(() => target - Date.now());

  useEffect(() => {
    const id = setInterval(() => setRemaining(target - Date.now()), 30_000);
    return () => clearInterval(id);
  }, [target]);

  return (
    <div className="flex items-center gap-3 rounded-panel border border-accent-500/40 bg-accent-500/10 px-4 py-3">
      <HanCoinsIcon size={24} />
      <div className="flex flex-col">
        <Body className="font-semibold text-text-primary">
          Weekly bonus in {formatRemaining(remaining)}
        </Body>
        <Caption className="text-text-secondary">
          Top 3 this week win 50 / 30 / 10 HanCoins
        </Caption>
      </div>
    </div>
  );
}
