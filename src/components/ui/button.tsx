import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "tertiary";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
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

/**
 * Only one primary button should dominate a given section
 * (design_system.md / components.md).
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
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
          "inline-flex items-center justify-center gap-2 rounded-control px-4 py-2 font-interface text-body font-medium transition-colors duration-fast ease-standard",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          variantClasses[variant],
          className,
        )}
        {...props}
      >
        {loading && (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        )}
        {children}
      </button>
    );
  },
);
