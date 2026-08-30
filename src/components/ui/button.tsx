import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "tertiary";
type ButtonSize = "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /**
   * "lg" is for the one prominent, comfortable-to-tap action a screen
   * should have (2026-08-27 gamified redesign - onboarding's Continue,
   * a lesson's primary CTA) - a taller pill shape, distinct from "md"'s
   * existing control-radius look. Default "md" renders every pre-existing
   * call site exactly as before, byte-for-byte.
   */
  size?: ButtonSize;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-500 text-on-color-light hover:bg-primary-600 focus-visible:outline-primary-600",
  secondary:
    "bg-transparent text-text-primary border border-border-strong hover:bg-elevated focus-visible:outline-primary-500",
  tertiary:
    "bg-transparent text-text-secondary hover:text-text-primary hover:underline focus-visible:outline-primary-500",
};

const sizeClasses: Record<ButtonSize, string> = {
  md: "gap-2 rounded-control px-4 py-2 text-body font-medium",
  lg: "gap-2.5 rounded-full px-7 py-4 text-card-title font-semibold",
};

/**
 * Only one primary button should dominate a given section
 * (design_system.md / components.md).
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      className,
      children,
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled ?? loading}
        aria-busy={loading || undefined}
        className={cn(
          "inline-flex items-center justify-center font-interface transition-colors duration-fast ease-standard",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          sizeClasses[size],
          variantClasses[variant],
          className,
        )}
        {...props}
      >
        {loading && (
          <Loader2
            className={cn("animate-spin", size === "lg" ? "size-5" : "size-4")}
            aria-hidden="true"
          />
        )}
        {children}
      </button>
    );
  },
);
