import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  /** Required: icon-only buttons have no visible text for screen readers. */
  "aria-label": string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton({ icon, className, disabled, ...props }, ref) {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          "inline-flex size-9 items-center justify-center rounded-control text-text-secondary transition-colors duration-fast ease-standard hover:bg-elevated hover:text-text-primary",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600",
          "disabled:pointer-events-none disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {icon}
      </button>
    );
  },
);
