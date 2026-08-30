"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  getUnseenCoinGainsAction,
  markCoinGainsSeenAction,
  type UnseenCoinGain,
} from "@/lib/actions/coins";
import { HanCoinsIcon } from "@/components/ui/hancoins-icon";
import { Body, Caption } from "@/components/ui/typography";

const REASON_LABELS: Record<string, string> = {
  lesson_completed: "Lesson completed",
  scenario_completed: "Scenario completed",
  achievement_unlocked: "Achievement unlocked",
  weekly_leaderboard: "Weekly leaderboard bonus",
  daily_login: "Daily login",
};
const TOAST_DURATION_MS = 3500;

/**
 * Coin-gain toast (2026-08-30, user request - "asi como cuando logras un
 * achievement, tambien aparezca que ganaste coins"). Deliberately a small,
 * auto-dismissing toast, not a full modal like AchievementCelebration -
 * coins are earned far more often (every lesson), a blocking modal per gain
 * would be exhausting where achievements are already rare/special. Same
 * decoupled detection/celebration architecture (seenAt on CoinLedgerEntry),
 * same re-check-on-navigation pattern, mounted alongside
 * AchievementCelebration in AppShell - both can show at once without
 * conflict, different screen regions.
 */
export function CoinCelebration() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [queue, setQueue] = useState<UnseenCoinGain[]>([]);

  useEffect(() => {
    let cancelled = false;
    void getUnseenCoinGainsAction().then((gains) => {
      if (cancelled || gains.length === 0) return;
      setQueue((current) => {
        const currentIds = new Set(current.map((g) => g.id));
        const additions = gains.filter((g) => !currentIds.has(g.id));
        return additions.length > 0 ? [...current, ...additions] : current;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const current = queue[0] ?? null;

  useEffect(() => {
    if (!current) return;
    const timer = setTimeout(() => {
      void markCoinGainsSeenAction([current.id]);
      setQueue((q) => q.slice(1));
    }, TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [current]);

  const dismiss = () => {
    if (!current) return;
    void markCoinGainsSeenAction([current.id]);
    setQueue((q) => q.slice(1));
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex justify-center px-4 md:bottom-6">
      <AnimatePresence>
        {current && (
          <motion.button
            type="button"
            key={current.id}
            onClick={dismiss}
            initial={reduceMotion ? undefined : { opacity: 0, y: 12, scale: 0.95 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="pointer-events-auto flex items-center gap-2.5 rounded-full border border-accent-500/40 bg-surface px-4 py-2 text-left shadow-modal"
          >
            <HanCoinsIcon size={24} />
            <div className="flex flex-col">
              <Body className="font-semibold text-text-primary">
                +{current.amount}
              </Body>
              <Caption className="text-text-muted">
                {REASON_LABELS[current.reason] ?? "Earned"}
              </Caption>
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
