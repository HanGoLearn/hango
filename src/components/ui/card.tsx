import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Interactive cards get hover/focus affordances (e.g. scenario, lesson cards). */
  interactive?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, interactive = false, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-card border border-border bg-surface p-4 shadow-elevated",
        interactive &&
          "transition-colors duration-fast ease-standard hover:border-border-strong",
        className,
      )}
      {...props}
    />
  );
});
