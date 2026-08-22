import type { HTMLAttributes } from "react";
import { Info, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";

type BannerVariant = "info" | "success" | "warning" | "error";

export interface InformationBannerProps extends HTMLAttributes<HTMLDivElement> {
  variant?: BannerVariant;
  title?: string;
}

// Backgrounds stay a translucent wash of the -500 step (decorative, plus
// the border-l-4 accent stripe and the icon's own distinct shape already
// carry the variant). Text is text-text-primary, not a fixed per-variant
// shade (2026-08-21) - the wash's rendered color depends on what's behind
// it, which inverts with the theme, so no single fixed text shade works in
// both at once. -50 (the old choice) measured ~14.5:1 in dark but ~1.2:1 in
// light; even the mid-tone -500 fix that worked for success/error
// elsewhere this session doesn't generalize here - info-500 specifically
// measured only 2.65:1 against its own wash in the *dark* theme (blue has
// low relative luminance, the opposite failure direction from the others).
// text-text-primary is correct and safe for every variant, in both themes.
const variantConfig: Record<
  BannerVariant,
  { icon: typeof Info; classes: string }
> = {
  info: { icon: Info, classes: "border-info-500 bg-info-500/15 text-text-primary" },
  success: {
    icon: CheckCircle2,
    classes: "border-success-500 bg-success-500/15 text-text-primary",
  },
  warning: {
    icon: AlertTriangle,
    classes: "border-warning-500 bg-warning-500/15 text-text-primary",
  },
  error: {
    icon: XCircle,
    classes: "border-error-500 bg-error-500/15 text-text-primary",
  },
};

/**
 * Used for cultural notes, learning tips, AI recommendations, and important
 * instructions (components.md). Icon + text convey meaning — never color alone.
 */
export function InformationBanner({
  variant = "info",
  title,
  className,
  children,
  ...props
}: InformationBannerProps) {
  const { icon: Icon, classes } = variantConfig[variant];

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "flex gap-3 rounded-card border-l-4 p-4 font-interface text-body",
        classes,
        className,
      )}
      {...props}
    >
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div className="flex flex-col gap-0.5">
        {title && <span className="font-medium">{title}</span>}
        <div>{children}</div>
      </div>
    </div>
  );
}
