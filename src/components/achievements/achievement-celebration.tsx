"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import {
  getUnseenAchievementsAction,
  markAchievementsSeenAction,
  type UnlockedAchievement,
} from "@/lib/actions/achievements";
import {
  Modal,
  ModalContent,
  ModalTitle,
  ModalDescription,
} from "@/components/ui/modal";
import { HanMascot } from "@/components/ui/han-mascot";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { AchievementIcon } from "@/components/achievements/achievement-icon";
import type {
  AchievementsMessages,
  ShellMessages,
} from "@/i18n/messages/types";
import { localizeAchievement } from "@/i18n/achievements";
import { formatMessage } from "@/i18n/format";

/**
 * Achievement celebration (2026-08-29, user request) - mounted once in
 * AppShell so it's present on every authenticated page. Detection
 * (achievements.ts, 7 hook points across lesson/reflection/scenario/
 * placement/streak/level/leaderboard) only ever writes rows with
 * `seenAt: null`; this component's only job is noticing them and showing a
 * celebration, one at a time, then marking each seen on dismiss.
 *
 * Re-checks on every `pathname` change rather than only on mount - App
 * Router layouts (AppShell lives in the shared `(app)` layout) persist
 * across client-side navigation, so a mount-only check would miss anything
 * unlocked later in the same session. Known trade-off: an unlock that
 * happens with no navigation afterward (rare - most unlock triggers already
 * happen right before a redirect, e.g. finishing a lesson) won't celebrate
 * until the next route change.
 */
export function AchievementCelebration({
  messages,
  achievementMessages,
}: {
  messages: ShellMessages["achievementCelebration"];
  achievementMessages: AchievementsMessages;
}) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [queue, setQueue] = useState<UnlockedAchievement[]>([]);

  useEffect(() => {
    let cancelled = false;
    void getUnseenAchievementsAction().then((unlocked) => {
      if (cancelled || unlocked.length === 0) return;
      setQueue((current) => {
        const currentKeys = new Set(current.map((a) => a.key));
        const additions = unlocked.filter((a) => !currentKeys.has(a.key));
        return additions.length > 0 ? [...current, ...additions] : current;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const current = queue[0] ?? null;

  const dismiss = useCallback(() => {
    if (!current) return;
    void markAchievementsSeenAction([current.key]);
    setQueue((q) => q.slice(1));
  }, [current]);

  if (!current) return null;
  const localized = localizeAchievement(current, achievementMessages);

  return (
    <Modal
      open
      onOpenChange={(open) => {
        if (!open) dismiss();
      }}
    >
      <ModalContent className="flex flex-col items-center gap-3 pt-2 text-center">
        <motion.div
          initial={reduceMotion ? undefined : { scale: 0.7, opacity: 0 }}
          animate={reduceMotion ? undefined : { scale: 1, opacity: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <HanMascot pose="celebrating" size={110} />
        </motion.div>
        <Chip tone="accent" variant="solid" size="sm">
          {messages.unlocked}
        </Chip>
        <ModalTitle className="flex items-center gap-2">
          <AchievementIcon
            name={current.iconName}
            className="size-5 text-accent-300"
          />
          {localized.title}
        </ModalTitle>
        <ModalDescription>{localized.description}</ModalDescription>
        <span className="font-interface text-caption font-semibold uppercase tracking-wide text-text-muted">
          {achievementMessages.categories[current.category]}
        </span>
        <Button type="button" onClick={dismiss} className="mt-1">
          {queue.length > 1
            ? formatMessage(messages.next, { count: queue.length - 1 })
            : messages.nice}
        </Button>
      </ModalContent>
    </Modal>
  );
}
