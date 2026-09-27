import Link from "next/link";
import { ChevronRight, Lock } from "lucide-react";
import { SectionTitle, Body, Caption } from "@/components/ui/typography";
import { AvatarDisplay } from "@/components/avatar/avatar-display";
import {
  JOURNEY_CHAPTER_ORDER,
  CHAPTER_CONFIG,
  type JourneyChapter,
} from "@/lib/content/learning-journey";
import type { AccessorySlot } from "@/lib/avatar-catalog";
import { cn } from "@/lib/cn";
import { localePath, type AppLocale } from "@/i18n/config";
import { formatMessage } from "@/i18n/format";
import type { AppMessages } from "@/i18n/messages/types";

export interface JourneyHubChapter {
  chapter: JourneyChapter;
  totalScenarios: number;
  completedScenarios: number;
  isCurrent: boolean;
  isAccessible: boolean;
}

export interface JourneyHubContinue {
  scenarioName: string;
  lessonSlug: string;
  lessonNumber: number;
  lessonTotal: number;
}

/**
 * Learning Journey entry screen (2026-09-22 redesign, user's pick of two
 * mocked directions). The page used to stack all three chapters and their
 * 41 scenario nodes at once - roughly 1180px of dots on a phone before the
 * learner could decide anything. Now each chapter is one card leading to
 * its own screen.
 *
 * Deliberately keeps HanGo's own type and surfaces rather than copying a
 * game-app skin wholesale: the motivating parts (a colour per chapter, the
 * oversized numeral, progress in segments you watch fill, one unmissable
 * continue action) carry over; the saturated blocks and hard drop shadows
 * do not, because every other screen in the app would then read as a
 * different product.
 *
 * During the first closed beta, later chapters remain visible as honest
 * previews while server-side route guards keep the beginner cohort inside
 * Foundations. This is a reversible release scope, not a claim that normal
 * curriculum progress automatically unlocks those chapters.
 */
export function JourneyHub({
  chapters,
  continueTarget,
  avatar,
  locale,
  messages,
}: {
  chapters: JourneyHubChapter[];
  continueTarget: JourneyHubContinue | null;
  avatar: {
    animal: string | null;
    equipped: Record<AccessorySlot, string | null>;
  };
  locale: AppLocale;
  messages: AppMessages["learningJourney"];
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Caption className="font-semibold uppercase tracking-[0.1em] text-text-muted">
          {messages.title}
        </Caption>
        {/* Sells the outcome, not the feature - the section's own name is
            the small label above, where a returning learner needs it and a
            first-time one doesn't. */}
        <SectionTitle className="max-w-[22ch] leading-tight">
          {messages.headline}
        </SectionTitle>
      </div>

      {continueTarget && (
        <Link
          href={localePath(locale, `/lesson/${continueTarget.lessonSlug}`)}
          className="flex items-center gap-3 rounded-panel border border-primary-500/45 bg-linear-to-br from-primary-500/18 to-secondary-500/14 p-3.5 transition-colors duration-fast ease-standard hover:border-primary-500/70"
        >
          {avatar.animal ? (
            <AvatarDisplay
              animal={avatar.animal}
              equipped={avatar.equipped}
              size={46}
            />
          ) : (
            <span
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-elevated font-interface text-body text-text-muted"
              aria-hidden="true"
            >
              ?
            </span>
          )}
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <Caption className="font-semibold uppercase tracking-wide text-accent-300">
              {messages.continueLabel}
            </Caption>
            <SectionTitle className="truncate text-card-title">
              {continueTarget.scenarioName}
            </SectionTitle>
            <Caption className="text-text-secondary">
              {formatMessage(messages.lessonProgress, {
                current: continueTarget.lessonNumber,
                total: continueTarget.lessonTotal,
              })}
            </Caption>
          </span>
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-500 text-on-color-light"
            aria-hidden="true"
          >
            <ChevronRight className="size-5" />
          </span>
        </Link>
      )}

      <ul className="flex flex-col gap-3">
        {JOURNEY_CHAPTER_ORDER.map((chapter, index) => {
          const entry = chapters.find((item) => item.chapter === chapter);
          if (!entry || entry.totalScenarios === 0) return null;
          const config = CHAPTER_CONFIG[chapter];
          const copy = messages.chapters[chapter];
          const tone = CHAPTER_TONES[config.accent];

          return (
            <li key={chapter}>
              <Link
                href={localePath(
                  locale,
                  `/learning-journey/chapter/${chapter}`,
                )}
                className={cn(
                  "relative flex flex-col gap-3 overflow-hidden rounded-panel border bg-surface p-5 transition-colors duration-fast ease-standard",
                  entry.isCurrent
                    ? tone.border
                    : "border-border hover:border-border-strong",
                )}
              >
                {/* Top-right, fully inside the card, with the text below
                    padded clear of its column (2026-09-22): hanging it over
                    the top edge let `overflow-hidden` slice it into a stray
                    bar, and centring it vertically instead parked it
                    exactly where the title and blurb sit. Decoration behind
                    the content, never what carries the number's meaning -
                    the badge does that. */}
                <span
                  className={cn(
                    "pointer-events-none absolute top-1 right-4 font-display text-[5.375rem] leading-none font-bold",
                    tone.ghost,
                  )}
                  aria-hidden="true"
                >
                  {index + 1}
                </span>

                <span className="relative flex items-center gap-2">
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full font-interface text-caption font-bold",
                      tone.badge,
                    )}
                    aria-hidden="true"
                  >
                    {config.badge}
                  </span>
                  {entry.isCurrent && (
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 font-interface text-caption font-semibold uppercase tracking-wide",
                        tone.chip,
                      )}
                    >
                      {messages.inProgress}
                    </span>
                  )}
                  {!entry.isAccessible && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-elevated px-2.5 py-0.5 font-interface text-caption font-semibold uppercase tracking-wide text-text-secondary">
                      <Lock className="size-3" aria-hidden="true" />
                      {messages.beta.nextPhase}
                    </span>
                  )}
                </span>

                <SectionTitle className="relative">{copy.title}</SectionTitle>
                <Body className="relative text-text-secondary">
                  {copy.blurb}
                </Body>

                {!entry.isAccessible && (
                  <Body className="relative text-text-muted">
                    {messages.beta.reviewMessage}
                  </Body>
                )}

                {/* Segments, not a percentage bar: a learner watches one
                    block light up per finished situation, which a 20% read
                    never conveys.

                    Each segment is `flex-1`, not a fixed width (2026-09-22
                    fix): at 15 situations the fixed version overflowed the
                    card and dropped the count onto its own line. Flexible
                    segments always fill exactly one row, whatever the
                    chapter's length or the phone's width. */}
                {entry.isAccessible ? (
                  <span className="relative flex items-center gap-3">
                    <span className="flex min-w-0 flex-1 items-center gap-1">
                      {Array.from({ length: entry.totalScenarios }).map(
                        (_, position) => (
                          <span
                            key={position}
                            className={cn(
                              "h-1.5 flex-1 rounded-full",
                              position < entry.completedScenarios
                                ? tone.segment
                                : "bg-text-muted/25",
                            )}
                          />
                        ),
                      )}
                    </span>
                    <Caption className="shrink-0 text-text-secondary">
                      {formatMessage(messages.scenarioProgress, {
                        completed: entry.completedScenarios,
                        total: entry.totalScenarios,
                      })}
                    </Caption>
                  </span>
                ) : (
                  <Caption className="relative inline-flex items-center gap-1.5 font-semibold text-primary-300">
                    {messages.beta.previewAction}
                    <ChevronRight className="size-3.5" aria-hidden="true" />
                  </Caption>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * One tone per chapter, built only from pairings the app already uses as
 * text or fills elsewhere - `secondary-700`/`accent-500`/`primary-500`
 * against `on-color-light` are the same verified badge combinations
 * navigation.ts documents.
 *
 * Exported (2026-09-23) so the scenario detail screen dresses a scenario in
 * the exact colour of the chapter the learner just tapped through, instead
 * of keeping a second copy here that would drift the first time one hex
 * changes. `hero`/`label`/`mark` are that screen's additions.
 */
export const CHAPTER_TONES: Record<
  "secondary" | "accent" | "primary",
  {
    badge: string;
    chip: string;
    border: string;
    ghost: string;
    segment: string;
    hero: string;
    tint: string;
    label: string;
    mark: string;
  }
> = {
  secondary: {
    badge: "bg-secondary-700 text-on-color-light",
    chip: "bg-secondary-500/20 text-secondary-300",
    border: "border-secondary-500/55",
    ghost: "text-secondary-500/15",
    segment: "bg-secondary-500",
    // `to-secondary-500/0`, never `to-transparent` (2026-09-23 fix): CSS
    // resolves `transparent` to transparent *black*, so a gradient fading
    // to it greys out through its middle instead of dissolving. Fading to
    // the same hue at zero alpha is the clean fade the mock had.
    hero: "border-secondary-500/45 bg-linear-to-br from-secondary-500/20 to-secondary-500/0",
    tint: "bg-secondary-500/20",
    label: "text-secondary-300",
    mark: "text-secondary-500",
  },
  accent: {
    badge: "bg-accent-500 text-on-color-dark",
    chip: "bg-accent-500/20 text-accent-300",
    border: "border-accent-500/55",
    ghost: "text-accent-500/15",
    segment: "bg-accent-500",
    hero: "border-accent-500/45 bg-linear-to-br from-accent-500/20 to-accent-500/0",
    tint: "bg-accent-500/20",
    label: "text-accent-300",
    mark: "text-accent-500",
  },
  primary: {
    badge: "bg-primary-500 text-on-color-light",
    chip: "bg-primary-500/20 text-primary-300",
    border: "border-primary-500/55",
    ghost: "text-primary-500/15",
    segment: "bg-primary-500",
    hero: "border-primary-500/45 bg-linear-to-br from-primary-500/20 to-primary-500/0",
    tint: "bg-primary-500/20",
    label: "text-primary-300",
    mark: "text-primary-500",
  },
};
