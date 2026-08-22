"use client";

import { usePathname } from "next/navigation";
import { CircleCheck } from "lucide-react";
import { primaryNavItems } from "@/lib/navigation";
import { UserMenu } from "@/components/shell/user-menu";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { HanAvatar } from "@/components/ui/han-mascot";
import { cn } from "@/lib/cn";

export interface TopBarProps {
  streak: { currentStreak: number; activeToday: boolean };
}

/**
 * Top bar (docs/04_design/ui.md). DESIGN_TASKS.md Phase 3, Option A: a
 * persistent stats strip (streak, today's goal) lives here instead of only
 * on the Dashboard — the Duolingo reference's "always visible" stats row.
 */
export function TopBar({ streak }: TopBarProps) {
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
          <span className="flex items-center gap-1.5 rounded-full bg-accent-500/15 py-1 pr-3 pl-1 font-interface text-supporting font-semibold text-accent-300">
            <HanAvatar pose={streak.activeToday ? "heart" : "wave"} size={20} />
            {streak.currentStreak}
          </span>
          <span
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1 font-interface text-supporting font-semibold",
              streak.activeToday
                ? "bg-secondary-500/15 text-secondary-300"
                : "bg-elevated text-text-muted",
            )}
          >
            <CircleCheck className="size-4" aria-hidden="true" />
            Today&apos;s goal
          </span>
        </div>
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
