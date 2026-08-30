"use client";

import { Lock } from "lucide-react";
import { ANIMALS } from "@/lib/avatar-catalog";
import { AvatarDisplay } from "@/components/avatar/avatar-display";
import { Caption } from "@/components/ui/typography";
import { cn } from "@/lib/cn";

/**
 * Shared between onboarding's AvatarStep and the tienda page's animal
 * switcher (2026-08-30) - same grid, same locked-silhouette treatment for
 * the 9 not-yet-available zodiac signs, only the surrounding chrome differs
 * (wizard back/continue vs. a standalone "change animal" control).
 */
export function AnimalGrid({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (animalKey: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
      {ANIMALS.map((item) => (
        <button
          key={item.key}
          type="button"
          disabled={!item.available}
          onClick={() => onSelect(item.key)}
          className={cn(
            "flex flex-col items-center gap-1.5 rounded-panel border px-3 py-4 text-center transition-colors duration-fast ease-standard",
            !item.available && "cursor-not-allowed border-border bg-elevated",
            item.available &&
              selected === item.key &&
              "border-accent-500 bg-accent-500/10",
            item.available &&
              selected !== item.key &&
              "border-border bg-surface hover:border-accent-500/40",
          )}
        >
          {item.available ? (
            <AvatarDisplay animal={item.key} size={56} />
          ) : (
            <span className="flex size-14 items-center justify-center rounded-full bg-surface text-text-muted">
              <Lock className="size-5" aria-hidden="true" />
            </span>
          )}
          <span
            className={cn(
              "font-interface text-supporting font-medium",
              item.available ? "text-text-primary" : "text-text-muted",
            )}
          >
            {item.name}
          </span>
          {!item.available && (
            <Caption className="text-text-muted">Coming soon</Caption>
          )}
        </button>
      ))}
    </div>
  );
}
