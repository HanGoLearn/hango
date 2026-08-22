import { forwardRef, useId } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, id, className, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="font-interface text-supporting font-medium text-text-primary"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={!!error || undefined}
        aria-describedby={describedBy}
        className={cn(
          "rounded-control border border-border bg-surface px-3 py-2 font-interface text-body text-text-primary placeholder:text-text-muted",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600",
          "disabled:pointer-events-none disabled:opacity-50",
          error && "border-error-500",
          className,
        )}
        {...props}
      />
      {hint && !error && (
        <span
          id={hintId}
          className="font-interface text-caption text-text-muted"
        >
          {hint}
        </span>
      )}
      {error && (
        <span
          id={errorId}
          className="font-interface text-caption text-error-500"
        >
          {error}
        </span>
      )}
    </div>
  );
});
