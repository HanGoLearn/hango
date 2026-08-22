"use client";

import { forwardRef, useId } from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export interface CheckboxProps extends React.ComponentPropsWithoutRef<
  typeof CheckboxPrimitive.Root
> {
  label?: string;
}

export const Checkbox = forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(function Checkbox({ className, label, id, ...props }, ref) {
  const generatedId = useId();
  const checkboxId = id ?? generatedId;

  const control = (
    <CheckboxPrimitive.Root
      ref={ref}
      id={checkboxId}
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-[0.25rem] border border-border-strong bg-surface",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600",
        "data-[state=checked]:border-primary-500 data-[state=checked]:bg-primary-500",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator>
        <Check className="size-3.5 text-on-color-light" aria-hidden="true" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );

  if (!label) return control;

  return (
    <label
      htmlFor={checkboxId}
      className="flex items-center gap-2 font-interface text-body text-text-primary"
    >
      {control}
      {label}
    </label>
  );
});
