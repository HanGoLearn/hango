import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type CardSize = "md" | "lg";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Interactive cards get hover/focus affordances (e.g. scenario, lesson cards). */
  interactive?: boolean;
  /**
   * "lg" gives a card more breathing room and a softer panel radius
   * (2026-08-27 gamified redesign - onboarding option tiles, milestone
   * moments) - default "md" is every pre-existing call site's current
   * look, unchanged.
   */
  size?: CardSize;
}

const sizeClasses: Record<CardSize, string> = {
  md: "rounded-card p-4",
  lg: "rounded-panel p-6",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, interactive = false, size = "md", ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "border border-border bg-surface shadow-elevated",
        sizeClasses[size],
        interactive &&
          "transition-colors duration-fast ease-standard hover:border-border-strong",
        className,
      )}
      {...props}
    />
  );
});
