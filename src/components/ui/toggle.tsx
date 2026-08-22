"use client";

import { forwardRef, useId } from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/cn";

export interface ToggleProps extends React.ComponentPropsWithoutRef<
  typeof SwitchPrimitive.Root
> {
  label?: string;
}

/** Immediate binary setting (design_system.md), e.g. automatic playback. */
export const Toggle = forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  ToggleProps
>(function Toggle({ className, label, id, ...props }, ref) {
  const generatedId = useId();
  const toggleId = id ?? generatedId;

  const control = (
    <SwitchPrimitive.Root
      ref={ref}
      id={toggleId}
      className={cn(
        "relative inline-flex h-6 w-10 shrink-0 items-center rounded-full bg-neutral-600 transition-colors duration-fast ease-standard",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600",
        "data-[state=checked]:bg-primary-500",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block size-4 translate-x-1 rounded-full bg-neutral-0 transition-transform duration-fast ease-standard data-[state=checked]:translate-x-5" />
    </SwitchPrimitive.Root>
  );

  if (!label) return control;

  return (
    <label
      htmlFor={toggleId}
      className="flex items-center gap-2 font-interface text-body text-text-primary"
    >
      {control}
      {label}
    </label>
  );
});
