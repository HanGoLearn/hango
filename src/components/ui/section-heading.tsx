import type { ReactNode } from "react";
import { SectionTitle } from "@/components/ui/typography";
import { cn } from "@/lib/cn";

/**
 * Colored icon badge + SectionTitle, same "scorecard" language as the nav
 * (DESIGN_TASKS.md Phase 7, Option A). Promoted out of the Settings page
 * (2026-08-21) - it was a private, unexported helper trapped in
 * app/(app)/settings/page.tsx, even though it's a generic, reusable pattern
 * with no Settings-specific logic.
 */
export function SectionHeading({
  children,
  badgeClassName,
  icon,
}: {
  children: ReactNode;
  badgeClassName: string;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-[0.5rem]",
          badgeClassName,
        )}
      >
        {icon}
      </span>
      <SectionTitle>{children}</SectionTitle>
    </div>
  );
}
