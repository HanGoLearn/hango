"use client";

import { usePathname } from "next/navigation";
import { CircleCheck } from "lucide-react";
import { primaryNavItems } from "@/lib/navigation";
import { UserMenu } from "@/components/shell/user-menu";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { HanAvatar } from "@/components/ui/han-mascot";
import { Chip } from "@/components/ui/chip";
import { HanCoinsIcon } from "@/components/ui/hancoins-icon";
import { HanCoinsInfoTrigger } from "@/components/avatar/hancoins-info";
import type { AccessorySlot } from "@/lib/avatar-catalog";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
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
  languageSwitcherLabel: string;
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
  languageSwitcherLabel,
}: TopBarProps) {
  const pathname = usePathname();
  const localeNeutralPathname = pathWithoutLocale(pathname);
  const activeItem = primaryNavItems.find((item) =>
    localeNeutralPathname.startsWith(item.href),
  );
  const title = activeItem
    ? messages.navigation[activeItem.key].label
    : "HanGo";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-4">
      <span className="min-w-0 truncate font-interface text-card-title font-medium text-text-primary">
        {title}
      </span>
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
        <LanguageSwitcher
          locale={locale}
          label={languageSwitcherLabel}
          className="[&>svg]:hidden"
        />
        <ThemeToggle messages={messages.theme} />
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
