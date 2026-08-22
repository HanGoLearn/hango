import {
  LayoutDashboard,
  Map,
  Mic,
  PenLine,
  TrendingUp,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  /** Shorter label for constrained mobile bottom-nav width (ui.md lists "Home" there for Dashboard). */
  mobileLabel?: string;
  href: string;
  icon: LucideIcon;
  /**
   * DESIGN_TASKS.md Phase 3, Option A: each section gets its own badge
   * color (Duolingo reference) instead of one flat icon color everywhere.
   * `badgeIconClassName` picks dark-ink vs. porcelain per badge so the
   * icon stays legible against its own background.
   */
  badgeClassName: string;
  badgeIconClassName: string;
}

/**
 * Official product terminology (docs/04_design/branding.md) — do not rename.
 *
 * `badgeIconClassName` (2026-08-21): every entry except Settings pairs a
 * brand-color fill (accent/primary/secondary/info, which stay roughly the
 * same lightness in both themes) with a *fixed* on-color token
 * (`on-color-light`/`on-color-dark`, globals.css) rather than the
 * inverting `text-neutral-0`/`text-neutral-900` these used before - those
 * invert white<->near-black between the dark/light themes by design,
 * which silently dropped 4 of these 5 badges below WCAG AA contrast in
 * whichever theme the fill/text combination flipped the wrong way
 * (confirmed via real contrast-ratio checks, not assumed). Speaking Lab's
 * fill also moved from secondary-500 to secondary-700: at -500, neither a
 * fixed light nor dark icon color cleared 4.5:1 in both themes at once
 * (the fill itself is too close to mid-lightness in both), so it needed a
 * darker anchor instead of a text-color choice. Settings' badge is
 * neutral-on-neutral (bg-neutral-600/text-neutral-50), which inverts
 * consistently together and needs no change.
 */
export const primaryNavItems: NavItem[] = [
  {
    label: "Dashboard",
    mobileLabel: "Home",
    href: "/dashboard",
    icon: LayoutDashboard,
    badgeClassName: "bg-accent-500",
    badgeIconClassName: "text-on-color-dark",
  },
  {
    label: "Learning Journey",
    mobileLabel: "Journey",
    href: "/learning-journey",
    icon: Map,
    badgeClassName: "bg-primary-500",
    badgeIconClassName: "text-on-color-light",
  },
  {
    label: "Speaking Lab",
    mobileLabel: "Speaking",
    href: "/speaking-lab",
    icon: Mic,
    badgeClassName: "bg-secondary-700",
    badgeIconClassName: "text-on-color-light",
  },
  {
    label: "Writing Lab",
    mobileLabel: "Writing",
    href: "/writing-lab",
    icon: PenLine,
    badgeClassName: "bg-info-500",
    badgeIconClassName: "text-on-color-light",
  },
  {
    label: "Progress",
    href: "/progress",
    icon: TrendingUp,
    badgeClassName: "bg-secondary-300",
    badgeIconClassName: "text-on-color-dark",
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    badgeClassName: "bg-neutral-600",
    badgeIconClassName: "text-neutral-50",
  },
];

/** Mobile bottom navigation omits Settings (docs/04_design/components.md). */
export const mobileNavItems: NavItem[] = primaryNavItems.filter(
  (item) => item.label !== "Settings",
);

/**
 * Human-readable label for the current route, for Han's own text/voice page
 * awareness (2026-08-21) - matches the longest `primaryNavItems.href`
 * that prefixes `pathname`, so a sub-route like `/learning-journey/family`
 * still resolves to "Learning Journey" rather than missing entirely.
 * Returns null for a route with no match (e.g. `/lesson/[slug]`) instead
 * of a wrong guess - lesson pages already have their own, richer
 * scenario/lesson/step context (ai-context.ts's AiTeacherContext), so a
 * generic page label would only ever be redundant or stale there, never
 * additive.
 */
export function resolveCurrentPageName(pathname: string): string | null {
  const match = primaryNavItems
    .filter(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    )
    .sort((a, b) => b.href.length - a.href.length)[0];
  return match?.label ?? null;
}
