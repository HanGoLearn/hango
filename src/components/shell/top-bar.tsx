"use client";

import { usePathname } from "next/navigation";
import { CircleCheck } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { UserMenu } from "@/components/shell/user-menu";
import { HanAvatar } from "@/components/ui/han-mascot";
import { Chip } from "@/components/ui/chip";
import { HanCoinsIcon } from "@/components/ui/hancoins-icon";
import { HanCoinsInfoTrigger } from "@/components/avatar/hancoins-info";
import type { AccessorySlot } from "@/lib/avatar-catalog";
import { pathWithoutLocale, type AppLocale } from "@/i18n/config";
import type { ShellMessages } from "@/i18n/messages/types";

export interface TopBarProps {
  streak: { currentStreak: number; activeToday: boolean };
  coinBalance: number;
  avatarAnimal: string | null;
  avatarEquipped: Record<AccessorySlot, string | null>;
  isAdministrator: boolean;
  locale: AppLocale;
  messages: ShellMessages;
}

/**
 * Top bar (docs/04_design/ui.md). DESIGN_TASKS.md Phase 3, Option A: a
 * persistent stats strip (streak, today's goal) lives here instead of only
 * on the Dashboard — the Duolingo reference's "always visible" stats row.
 */
export function TopBar({
  streak,
  coinBalance,
  avatarAnimal,
  avatarEquipped,
  isAdministrator,
  locale,
  messages,
}: TopBarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-4">
      {/* The brand, not the section name (2026-09-22): this slot used to
          repeat the section the learner had just tapped in the nav, which
          still marks that tab as active. HomeOnly keeps this whole bar on
          Home, so there is no other section left for it to name. */}
      <Logo />
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-3 lg:gap-4">
        <div className="flex items-center gap-2">
          <Chip tone="accent" className="hidden py-1 pr-3 pl-1 sm:inline-flex">
            <HanAvatar pose={streak.activeToday ? "heart" : "wave"} size={20} />
            {streak.currentStreak}
          </Chip>
          <HanCoinsInfoTrigger
            balance={coinBalance}
            messages={messages.hanCoins}
          >
            <Chip tone="accent">
              <HanCoinsIcon size={16} />
              {coinBalance}
            </Chip>
          </HanCoinsInfoTrigger>
          <Chip
            tone={streak.activeToday ? "secondary" : "neutral"}
            className="hidden lg:inline-flex"
          >
            <CircleCheck className="size-4" aria-hidden="true" />
            {messages.todayGoal}
          </Chip>
        </div>
        <UserMenu
          animal={avatarAnimal}
          equipped={avatarEquipped}
          isAdministrator={isAdministrator}
          locale={locale}
          messages={messages}
        />
      </div>
    </header>
  );
}
