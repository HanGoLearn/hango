"use client";

import { forwardRef, useId } from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cn } from "@/lib/cn";

export const RadioGroup = forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(function RadioGroup({ className, ...props }, ref) {
  return (
    <RadioGroupPrimitive.Root
      ref={ref}
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
});

export interface RadioGroupItemProps extends React.ComponentPropsWithoutRef<
  typeof RadioGroupPrimitive.Item
> {
  label: string;
}

export const RadioGroupItem = forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioGroupItemProps
>(function RadioGroupItem({ className, label, id, ...props }, ref) {
  const generatedId = useId();
  const itemId = id ?? generatedId;

  return (
    <label
      htmlFor={itemId}
      className="flex items-center gap-2 font-interface text-body text-text-primary"
    >
      <RadioGroupPrimitive.Item
        ref={ref}
        id={itemId}
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full border border-border-strong bg-surface",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600",
          "data-[state=checked]:border-primary-500",
          "disabled:pointer-events-none disabled:opacity-50",
          className,
        )}
        {...props}
      >
        <RadioGroupPrimitive.Indicator asChild>
          <span className="size-2.5 rounded-full bg-primary-500" />
        </RadioGroupPrimitive.Indicator>
      </RadioGroupPrimitive.Item>
      {label}
    </label>
  );
});
