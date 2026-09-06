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

export interface TopBarProps {
  streak: { currentStreak: number; activeToday: boolean };
  coinBalance: number;
  avatarAnimal: string | null;
  avatarEquipped: Record<AccessorySlot, string | null>;
  isAdministrator: boolean;
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
}: TopBarProps) {
  const pathname = usePathname();
  const activeItem = primaryNavItems.find((item) =>
    pathname?.startsWith(item.href),
  );
  const title = activeItem?.label ?? "HanGo";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-4">
      <span className="font-interface text-card-title font-medium text-text-primary">
        {title}
      </span>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Chip tone="accent" className="py-1 pr-3 pl-1">
            <HanAvatar pose={streak.activeToday ? "heart" : "wave"} size={20} />
            {streak.currentStreak}
          </Chip>
          <HanCoinsInfoTrigger balance={coinBalance}>
            <Chip tone="accent">
              <HanCoinsIcon size={16} />
              {coinBalance}
            </Chip>
          </HanCoinsInfoTrigger>
          <Chip tone={streak.activeToday ? "secondary" : "neutral"}>
            <CircleCheck className="size-4" aria-hidden="true" />
            Today&apos;s goal
          </Chip>
        </div>
        <ThemeToggle />
        <UserMenu
          animal={avatarAnimal}
          equipped={avatarEquipped}
          isAdministrator={isAdministrator}
        />
      </div>
    </header>
  );
}
