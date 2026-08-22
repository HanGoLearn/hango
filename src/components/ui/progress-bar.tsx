"use client";

import { forwardRef } from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/cn";

export interface ProgressBarProps extends React.ComponentPropsWithoutRef<
  typeof ProgressPrimitive.Root
> {
  value: number;
  /** Visible text label — required whenever the meaning isn't obvious (design_system.md). */
  label?: string;
  /** Overrides the fill's classes (color/gradient) — the track (`className`) stays independently overridable. Defaults to a flat `bg-primary-500`, unchanged from before this prop existed. */
  indicatorClassName?: string;
}

export const ProgressBar = forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressBarProps
>(function ProgressBar(
  { className, value, label, indicatorClassName, ...props },
  ref,
) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <div className="flex items-center justify-between">
          <span className="font-interface text-supporting text-text-secondary">
            {label}
          </span>
          <span className="font-interface text-supporting text-text-secondary">
            {Math.round(value)}%
          </span>
        </div>
      )}
      <ProgressPrimitive.Root
        ref={ref}
        value={value}
        aria-label={label}
        className={cn(
          "h-2 w-full overflow-hidden rounded-full bg-border",
          className,
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            "h-full bg-primary-500 transition-transform duration-slow ease-standard",
            indicatorClassName,
          )}
          style={{ transform: `translateX(-${100 - value}%)` }}
        />
      </ProgressPrimitive.Root>
    </div>
  );
});
