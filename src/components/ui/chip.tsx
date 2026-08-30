import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type ChipTone =
  | "primary"
  | "secondary"
  | "accent"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral";
type ChipVariant = "wash" | "solid";
type ChipSize = "sm" | "md";

export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: ChipTone;
  /** "wash" = translucent tint (the app's existing default pill look). "solid" = opaque fill with on-color text, for a pill that needs to read as a stronger status (e.g. "Mastered"). */
  variant?: ChipVariant;
  size?: ChipSize;
}

const washClasses: Record<ChipTone, string> = {
  primary: "bg-primary-500/15 text-primary-300",
  secondary: "bg-secondary-500/15 text-secondary-300",
  accent: "bg-accent-500/15 text-accent-300",
  success: "bg-success-500/15 text-success-500",
  warning: "bg-warning-500/15 text-warning-500",
  error: "bg-error-500/15 text-error-500",
  info: "bg-info-500/15 text-info-500",
  neutral: "bg-elevated text-text-secondary",
};

const solidClasses: Record<ChipTone, string> = {
  primary: "bg-primary-500 text-on-color-light",
  secondary: "bg-secondary-500 text-on-color-light",
  accent: "bg-accent-500 text-on-color-dark",
  success: "bg-success-500 text-on-color-light",
  warning: "bg-warning-500 text-on-color-dark",
  error: "bg-error-500 text-on-color-light",
  info: "bg-info-500 text-on-color-light",
  neutral: "bg-elevated text-text-primary",
};

const sizeClasses: Record<ChipSize, string> = {
  sm: "gap-1 px-2 py-0.5 text-caption",
  md: "gap-1.5 px-3 py-1 text-supporting",
};

/**
 * Shared pill/badge primitive (2026-08-27 gamified redesign) - replaces the
 * ~9 hand-rolled `rounded-full` pill patterns found across the codebase in
 * the design-system audit (the streak chip alone was duplicated verbatim
 * in TopBar and Dashboard). Compose an icon + text as children; this only
 * owns shape/color/size, not content.
 */
export const Chip = forwardRef<HTMLSpanElement, ChipProps>(function Chip(
  { tone = "neutral", variant = "wash", size = "md", className, ...props },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex w-fit items-center rounded-full font-interface font-semibold",
        sizeClasses[size],
        variant === "solid" ? solidClasses[tone] : washClasses[tone],
        className,
      )}
      {...props}
    />
  );
});
