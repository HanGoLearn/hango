import {
  AudioLines,
  GraduationCap,
  LayoutDashboard,
  Map,
  Mic,
  PenLine,
  Search,
  TrendingUp,
  Store,
  Trophy,
  Settings,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";
import { pathWithoutLocale } from "@/i18n/config";

export type NavItemKey =
  | "dashboard"
  | "learningJourney"
  | "speakingLab"
  | "writingLab"
  | "han"
  | "hanTutor"
  | "hanCompanion"
  | "hanVocabulary"
  | "progress"
  | "shop"
  | "leaderboard"
  | "settings";

export interface NavItem {
  key: NavItemKey;
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
    key: "dashboard",
    label: "Dashboard",
    mobileLabel: "Home",
    href: "/dashboard",
    icon: LayoutDashboard,
    badgeClassName: "bg-accent-500",
    badgeIconClassName: "text-on-color-dark",
  },
  {
    key: "learningJourney",
    label: "Learning Journey",
    mobileLabel: "Journey",
    href: "/learning-journey",
    icon: Map,
    badgeClassName: "bg-primary-500",
    badgeIconClassName: "text-on-color-light",
  },
  {
    key: "speakingLab",
    label: "Speaking Lab",
    mobileLabel: "Speaking",
    href: "/speaking-lab",
    icon: Mic,
    badgeClassName: "bg-secondary-700",
    badgeIconClassName: "text-on-color-light",
  },
  {
    key: "writingLab",
    label: "Writing Lab",
    mobileLabel: "Writing",
    href: "/writing-lab",
    icon: PenLine,
    badgeClassName: "bg-info-500",
    badgeIconClassName: "text-on-color-light",
  },
  {
    // 2026-08-31 (Han as differentiator) - its own primary-nav slot, not a
    // dashboard teaser, since this is the app's real competitive moat, not
    // a secondary utility. primary-700 (darker than Learning Journey's
    // primary-500), not a new color family - stays in the brand-red
    // territory Han fits, but visually distinct from Learning Journey's
    // badge. Darker fill only increases contrast against on-color-light
    // versus the already-verified primary-500/on-color-light pairing
    // (design_system.md's WCAG audit note above), not a fresh unverified
    // combination.
    key: "han",
    label: "Han",
    href: "/han",
    icon: MessageCircle,
    badgeClassName: "bg-primary-700",
    badgeIconClassName: "text-on-color-light",
  },
  // Han's three surfaces as their own destinations (2026-09-23, user
  // decision): the hub at /han already offered Tutor, Companion and
  // Vocabulary as three cards, but from the nav they were invisible - one
  // "Han" entry gave no hint that there were three different tools behind
  // it. Now they're a group, the same shape Learning uses, so the product
  // explains itself every time the menu opens rather than once in an
  // onboarding tour.
  //
  // All three keep Han's own primary-700/on-color-light badge pairing (the
  // one already verified for the parent entry above) - they're one family,
  // and varying the fill per item would read as three unrelated sections.
  // Han Class stays out: it's still a locked teaser on the hub.
  //
  // Names are not translated, same rule as Speaking Lab/Writing Lab -
  // branding.md's official terminology.
  {
    key: "hanTutor",
    label: "Han Tutor",
    href: "/han/tutor",
    icon: MessageCircle,
    badgeClassName: "bg-primary-700",
    badgeIconClassName: "text-on-color-light",
  },
  {
    key: "hanCompanion",
    label: "Han Companion",
    href: "/han/companion",
    icon: AudioLines,
    badgeClassName: "bg-primary-700",
    badgeIconClassName: "text-on-color-light",
  },
  {
    key: "hanVocabulary",
    label: "Han Vocabulary",
    href: "/han/vocabulary",
    icon: Search,
    badgeClassName: "bg-primary-700",
    badgeIconClassName: "text-on-color-light",
  },
  {
    key: "progress",
    label: "Progress",
    href: "/progress",
    icon: TrendingUp,
    badgeClassName: "bg-secondary-300",
    badgeIconClassName: "text-on-color-dark",
  },
  {
    // 2026-08-30 (user request) - the tienda gets a full primary-nav slot,
    // same as every other section, not just a Dashboard teaser like
    // Leaderboard/Achievements. warning-500/on-color-dark is an
    // already-verified pairing (see Chip's solidClasses), not a new,
    // unchecked contrast combination.
    key: "shop",
    label: "Shop",
    href: "/tienda",
    icon: Store,
    badgeClassName: "bg-warning-500",
    badgeIconClassName: "text-on-color-dark",
  },
  {
    // 2026-09-20 (user request) - its own nav slot beside Shop. Reuses the
    // accent-500/on-color-dark pairing Dashboard's badge already uses: the
    // documented hard constraint on these badges is contrast (that pairing
    // is verified in both themes), and gold reads as the right colour for a
    // trophy. The two are never adjacent in the bar.
    key: "leaderboard",
    label: "Leaderboard",
    href: "/leaderboard",
    icon: Trophy,
    badgeClassName: "bg-accent-500",
    badgeIconClassName: "text-on-color-dark",
  },
  {
    key: "settings",
    label: "Settings",
    href: "/settings",
    icon: Settings,
    badgeClassName: "bg-neutral-600",
    badgeIconClassName: "text-neutral-50",
  },
];

/** Mobile bottom navigation omits Settings (docs/04_design/components.md). */
export const mobileNavItems: NavItem[] = primaryNavItems.filter(
  (item) => item.key !== "settings",
);

/**
 * How navigation is *rendered* (user decision, 2026-09-20): the three study
 * surfaces collapse behind one "Learning" entry, so the bar carries six
 * entries instead of eight. Deliberately a separate structure from
 * `primaryNavItems`, which stays the flat route->label source of truth that
 * `resolveCurrentPageName` (Han's page awareness) and TopBar read - grouping
 * is a presentation choice and must not change how a route resolves.
 *
 * The group keeps Learning Journey, Speaking Lab and Writing Lab as three
 * distinct destinations inside the menu, not merged into one surface.
 */
export type NavEntry =
  | { kind: "item"; item: NavItem }
  | {
      kind: "group";
      key: "learning" | "han";
      icon: LucideIcon;
      badgeClassName: string;
      badgeIconClassName: string;
      items: NavItem[];
    };

function navItem(key: NavItemKey): NavItem {
  const item = primaryNavItems.find((entry) => entry.key === key);
  if (!item) throw new Error(`Unknown nav item: ${key}`);
  return item;
}

export const navEntries: NavEntry[] = [
  { kind: "item", item: navItem("dashboard") },
  {
    kind: "group",
    key: "learning",
    icon: GraduationCap,
    badgeClassName: "bg-primary-500",
    badgeIconClassName: "text-on-color-light",
    items: [
      navItem("learningJourney"),
      navItem("speakingLab"),
      navItem("writingLab"),
    ],
  },
  // Han's own group (2026-09-23): tapping Han opens the three surfaces and
  // each one lands directly on its own route, rather than dropping the
  // learner on a hub they then have to read. `/han` itself stays reachable
  // and unchanged for anyone who arrives there by link or history - it's
  // simply no longer the only way in.
  {
    kind: "group",
    key: "han",
    icon: MessageCircle,
    badgeClassName: "bg-primary-700",
    badgeIconClassName: "text-on-color-light",
    items: [
      navItem("hanTutor"),
      navItem("hanCompanion"),
      navItem("hanVocabulary"),
    ],
  },
  { kind: "item", item: navItem("progress") },
  { kind: "item", item: navItem("shop") },
  { kind: "item", item: navItem("leaderboard") },
  // No Settings entry (2026-09-20, user decision): UserMenu in the top bar
  // already links there from every screen, and a duplicated destination was
  // costing a slot in a bar that only has room for a handful. It stays in
  // `primaryNavItems` because that list is what resolves a route to its
  // label (TopBar's title, Han's page awareness), not what the nav renders.
];

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
  const localeNeutralPathname = pathWithoutLocale(pathname);
  const match = primaryNavItems
    .filter(
      (item) =>
        localeNeutralPathname === item.href ||
        localeNeutralPathname.startsWith(`${item.href}/`),
    )
    .sort((a, b) => b.href.length - a.href.length)[0];
  return match?.label ?? null;
}
