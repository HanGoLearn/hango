"use client";

import { useId, type ReactNode } from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * "row" = single horizontal line (icon, if any, at the left; label/
 * description in the middle; checkbox/radio indicator at the right) -
 * compact, for short-text options (2026-08-28: "gordos y grandes para lo
 * que dice el texto" on explanation-language/daily-target, then "los
 * textos quiero que vayan a la derecha del logo" on skills). "stack" is
 * the original icon-on-top layout, still used where a longer description
 * needs its own line (level-step) - also tightened ("reduce el grosor")
 * from p-4/gap-3 to p-3.5/gap-2.
 */
function tileClasses(layout: "stack" | "row") {
  return cn(
    "group relative flex w-full rounded-panel border-2 border-border bg-surface text-left transition-colors duration-fast ease-standard",
    "hover:border-border-strong",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600",
    "data-[state=checked]:border-primary-500 data-[state=checked]:bg-primary-500/10",
    "disabled:pointer-events-none disabled:opacity-50",
    layout === "row" ? "items-center p-3" : "flex-col items-start gap-2 p-3.5",
  );
}

const radioIndicatorClasses = cn(
  "flex size-5 shrink-0 items-center justify-center rounded-full border border-border-strong bg-surface transition-colors",
  "group-data-[state=checked]:border-primary-500 group-data-[state=checked]:bg-primary-500",
);

function TileContent({
  icon,
  label,
  description,
  meta,
  layout,
}: {
  icon?: ReactNode;
  label: string;
  description?: string;
  meta?: ReactNode;
  layout: "stack" | "row";
}) {
  if (layout === "row") {
    // No description line here on purpose (2026-08-28: "todos deberian ser
    // del mismo tamano") - row tiles in the same group need to stay a
    // single line so every tile in the group is the same height; a
    // description forces just that one tile taller and throws off the
    // radio indicator's alignment against its siblings.
    return (
      <span className="flex w-full items-center gap-3">
        {icon && (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-control bg-elevated text-text-secondary transition-colors group-data-[state=checked]:bg-primary-500 group-data-[state=checked]:text-on-color-light">
            {icon}
          </span>
        )}
        <span className="min-w-0 flex-1 font-interface text-body font-medium text-text-primary">
          {label}
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {meta}
          <span className={radioIndicatorClasses}>
            <Check
              className="size-3.5 text-on-color-light opacity-0 transition-opacity group-data-[state=checked]:opacity-100"
              aria-hidden="true"
            />
          </span>
        </span>
      </span>
    );
  }

  return (
    <>
      <div className="flex w-full items-start justify-between gap-2">
        {icon && (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-elevated text-text-secondary transition-colors group-data-[state=checked]:bg-primary-500 group-data-[state=checked]:text-on-color-light">
            {icon}
          </span>
        )}
        <span className={radioIndicatorClasses}>
          <Check
            className="size-3.5 text-on-color-light opacity-0 transition-opacity group-data-[state=checked]:opacity-100"
            aria-hidden="true"
          />
        </span>
      </div>
      <span className="flex w-full items-center justify-between gap-2">
        <span className="font-interface text-body font-medium text-text-primary">
          {label}
        </span>
        {meta}
      </span>
      {description && (
        <span className="font-interface text-supporting text-text-secondary">
          {description}
        </span>
      )}
    </>
  );
}

export interface OptionTileContent {
  value: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  /** Small trailing visual next to the label (e.g. a level-strength meter) - purely decorative, meaning must already be conveyed by the label/description for a11y. */
  meta?: ReactNode;
  /** Defaults to "stack" when an icon is given, "row" otherwise. */
  layout?: "stack" | "row";
  /** Extra classes on the tile root - e.g. a shared `min-h` so every tile in a group stays the same size even when one label wraps to more lines than its siblings. */
  className?: string;
}

/**
 * Large tappable option tiles (2026-08-27 gamified onboarding redesign) -
 * replace the compact 20px Checkbox/RadioGroupItem rows onboarding used
 * before. Both wrap the exact same Radix primitives the old rows used
 * (Checkbox.Root / RadioGroup.Item both already render a real `<button>`
 * and accept arbitrary children - no `asChild` needed), so keyboard nav,
 * focus management, and ARIA roles are unchanged - only the visual size
 * and layout of what's inside changed.
 */
export function CheckboxTile({
  value,
  label,
  description,
  icon,
  meta,
  layout,
  className,
  checked,
  onCheckedChange,
}: OptionTileContent & { checked: boolean; onCheckedChange: () => void }) {
  const id = useId();
  const resolvedLayout = layout ?? (icon ? "stack" : "row");
  return (
    <CheckboxPrimitive.Root
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      value={value}
      className={cn(tileClasses(resolvedLayout), className)}
    >
      <TileContent
        icon={icon}
        label={label}
        description={description}
        meta={meta}
        layout={resolvedLayout}
      />
    </CheckboxPrimitive.Root>
  );
}

/** Single-select tile - must be rendered inside a `<RadioGroup>` (src/components/ui/radio-group.tsx exports the Root; this is a drop-in alternative to `RadioGroupItem` with the same tile treatment as `CheckboxTile`). */
export function RadioTile({
  value,
  label,
  description,
  icon,
  meta,
  layout,
  className,
}: OptionTileContent) {
  const id = useId();
  const resolvedLayout = layout ?? (icon ? "stack" : "row");
  return (
    <RadioGroupPrimitive.Item
      id={id}
      value={value}
      className={cn(tileClasses(resolvedLayout), className)}
    >
      <TileContent
        icon={icon}
        label={label}
        description={description}
        meta={meta}
        layout={resolvedLayout}
      />
    </RadioGroupPrimitive.Item>
  );
}
