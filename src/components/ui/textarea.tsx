import { forwardRef, useId } from "react";
import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  /** Shows a live character count, e.g. against `maxLength`. */
  showCharacterCount?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    {
      label,
      error,
      showCharacterCount,
      id,
      className,
      value,
      maxLength,
      ...props
    },
    ref,
  ) {
    const generatedId = useId();
    const textareaId = id ?? generatedId;
    const errorId = error ? `${textareaId}-error` : undefined;
    const length = typeof value === "string" ? value.length : 0;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="font-interface text-supporting font-medium text-text-primary"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          value={value}
          maxLength={maxLength}
          aria-invalid={!!error || undefined}
          aria-describedby={errorId}
          className={cn(
            "min-h-24 resize-y rounded-control border border-border bg-surface px-3 py-2 font-interface text-body text-text-primary placeholder:text-text-muted",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600",
            "disabled:pointer-events-none disabled:opacity-50",
            error && "border-error-500",
            className,
          )}
          {...props}
        />
        <div className="flex items-center justify-between">
          {error ? (
            <span
              id={errorId}
              className="font-interface text-caption text-error-500"
            >
              {error}
            </span>
          ) : (
            <span />
          )}
          {showCharacterCount && (
            <span className="font-interface text-caption text-text-muted">
              {length}
              {maxLength ? ` / ${maxLength}` : ""}
            </span>
          )}
        </div>
      </div>
    );
  },
);
