import Link from "next/link";
import { Check, Play, Circle } from "lucide-react";
import { SectionTitle, Caption } from "@/components/ui/typography";
import { HanAvatar } from "@/components/ui/han-mascot";
import { Chip } from "@/components/ui/chip";
import {
  JOURNEY_CHAPTER_ORDER,
  resolveJourneyChapter,
  CHAPTER_CONFIG,
  type JourneyChapter,
  type ScenarioStatus,
} from "@/lib/content/learning-journey";
import { cn } from "@/lib/cn";
import { localePath, type AppLocale } from "@/i18n/config";

/**
 * Was `ScenarioCardProps` (2026-08-29: `scenario-card.tsx`'s `ScenarioCard`
 * component was dead - a leftover from before the chapter-node redesign,
 * never rendered anywhere - only this type survived as a real dependency,
 * so it moved here instead of leaving a component-less file around just to
 * export a type).
 */
export interface JourneyChapterScenario {
  slug: string;
  domainSlug: string;
  name: string;
  domainName: string;
  description: string | null;
  difficultyLevels: string[];
  totalLessons: number;
  completedLessons: number;
  status: ScenarioStatus;
}

export interface JourneyChaptersProps {
  scenarios: JourneyChapterScenario[];
  locale: AppLocale;
}

/**
 * "Refined path" direction (2026-08-21, approved over two other directions
 * compared in an artifact - project/learning-journey-optimization.md): a
 * contained, editorial-leaning version of the same chapter-node idea, not a
 * departure from it - smaller nodes, a neutral chapter border instead of a
 * saturated colored ring, and a restrained current-item indicator (a ring,
 * not a scale-up + drop shadow) so the page reads less like a game board.
 */
const ACCENT_CLASSES: Record<
  string,
  { badge: string; title: string; node: string; nodeCurrentRing: string }
> = {
  secondary: {
    badge: "bg-secondary-500 text-on-color-light",
    title: "text-secondary-300",
    // Solid fill, not the /70 wash this used before - measured as low as
    // 2.65:1 in the light theme once actually checked (the translucent
    // fill's rendered color depends on what's behind it, same class of bug
    // as the wash-vs-solid-fill rule in design_system.md).
    node: "bg-secondary-500 text-on-color-light",
    nodeCurrentRing: "ring-secondary-500",
  },
  accent: {
    badge: "bg-accent-500 text-on-color-dark",
    title: "text-accent-300",
    node: "bg-accent-500 text-on-color-dark",
    nodeCurrentRing: "ring-accent-500",
  },
  primary: {
    badge: "bg-primary-500 text-on-color-light",
    title: "text-primary-300",
    node: "bg-primary-500 text-on-color-light",
    nodeCurrentRing: "ring-primary-500",
  },
};

/**
 * Chapters replace the old domain Select + flat card grid (8.x): scenarios
 * group and color by difficulty tier (jade/gold/lacquer, reusing the brand
 * palette) so the difficulty curve reads at a glance. Rendered as compact
 * circular nodes (same icon language as `LessonPath`, one level up) rather
 * than full `ScenarioCard`s — the description/progress-bar level of detail
 * lives on the scenario's own page, not this overview. No LOCKED state and
 * no dimming on later chapters: every scenario stays clickable, this is
 * organization, not gating.
 */
export function JourneyChapters({ scenarios, locale }: JourneyChaptersProps) {
  const chapters = new Map<JourneyChapter, JourneyChapterScenario[]>();
  for (const scenario of scenarios) {
    const chapter = resolveJourneyChapter(scenario.difficultyLevels);
    const bucket = chapters.get(chapter) ?? [];
    bucket.push(scenario);
    chapters.set(chapter, bucket);
  }

  const currentChapter = JOURNEY_CHAPTER_ORDER.find((chapter) =>
    (chapters.get(chapter) ?? []).some((s) => s.status !== "COMPLETED"),
  );

  return (
    <div className="flex flex-col gap-5">
      {JOURNEY_CHAPTER_ORDER.map((chapter) => {
        const chapterScenarios = chapters.get(chapter);
        if (!chapterScenarios || chapterScenarios.length === 0) return null;

        const config = CHAPTER_CONFIG[chapter];
        const accent = ACCENT_CLASSES[config.accent]!;
        const isCurrentChapter = chapter === currentChapter;
        const currentSlug = isCurrentChapter
          ? chapterScenarios.find((s) => s.status !== "COMPLETED")?.slug
          : undefined;

        return (
          <section
            key={chapter}
            // Plain neutral border, not a saturated colored ring - the
            // "refined path" direction's whole point is toning down the
            // game-board feel; the accent color still speaks through the
            // badge/title/nodes without needing to outline the entire
            // section too.
            className="rounded-panel border border-border bg-surface p-5 sm:p-6"
          >
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full font-interface text-supporting font-bold",
                  accent.badge,
                )}
              >
                {config.badge}
              </span>
              <div className="flex flex-col">
                <SectionTitle className={cn("text-card-title", accent.title)}>
                  {config.title}
                </SectionTitle>
                <Caption className="text-text-secondary">
                  {config.subtitle} · {chapterScenarios.length} scenarios
                </Caption>
              </div>

              {isCurrentChapter && (
                <Chip size="sm" className="ml-auto">
                  <HanAvatar pose="wave" size={20} />
                  You are here
                </Chip>
              )}
            </div>

            {/* Grid of 5, not flex-wrap (2026-08-21, user feedback: a real
                chapter has ~15 scenarios, and letting them wrap on their
                own read as a wall of loose dots). Same node count, but a
                tidy 3-row grid instead of a ragged wrap - 3 columns below
                sm since 5 columns of icon+multi-word-label is too cramped
                on a phone width. */}
            <div className="grid grid-cols-3 gap-x-4 gap-y-4 sm:grid-cols-5 sm:gap-x-5">
              {chapterScenarios.map((scenario) => {
                const isCurrent = scenario.slug === currentSlug;
                const Icon =
                  scenario.status === "COMPLETED"
                    ? Check
                    : isCurrent
                      ? Play
                      : Circle;

                return (
                  <Link
                    key={scenario.slug}
                    href={localePath(
                      locale,
                      `/learning-journey/${scenario.slug}`,
                    )}
                    className="flex flex-col items-center gap-1.5 rounded-panel text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
                  >
                    {/* size-10, not the old size-14 - smaller, more
                        contained nodes are this direction's main visual
                        change. isCurrent gets a ring instead of a
                        scale-110 + shadow-lg "bounce", a quieter way to say
                        "start here" without the game-board theatrics. */}
                    <span
                      className={cn(
                        "flex size-10 items-center justify-center rounded-full transition-colors",
                        accent.node,
                        isCurrent &&
                          cn(
                            "ring-2 ring-offset-2 ring-offset-surface",
                            accent.nodeCurrentRing,
                          ),
                      )}
                    >
                      <Icon
                        className={cn("size-4", Icon === Circle && "size-2.5")}
                        aria-hidden="true"
                      />
                    </span>
                    <span
                      className={cn(
                        "font-interface text-caption font-medium text-text-secondary",
                        isCurrent && "font-semibold text-text-primary",
                      )}
                    >
                      {scenario.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
