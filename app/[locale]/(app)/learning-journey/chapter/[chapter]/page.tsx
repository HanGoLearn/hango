import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Circle, Lock, Play } from "lucide-react";
import { auth } from "@/lib/auth";
import {
  PageTitle,
  SectionTitle,
  Body,
  Caption,
} from "@/components/ui/typography";
import { getScenariosWithProgress } from "@/lib/content/learning-journey-data";
import {
  JOURNEY_CHAPTER_ORDER,
  CHAPTER_CONFIG,
  resolveJourneyChapter,
  type JourneyChapter,
} from "@/lib/content/learning-journey";
import { cn } from "@/lib/cn";
import { isAppLocale, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { formatMessage } from "@/i18n/format";
import { isJourneyChapterAccessible } from "@/lib/beta-learning-scope";

function isJourneyChapter(value: string): value is JourneyChapter {
  return (JOURNEY_CHAPTER_ORDER as readonly string[]).includes(value);
}

/**
 * One chapter's situations (2026-09-22). Split out of the Learning Journey
 * page so each chapter gets a screen of ~15 rows instead of all three
 * stacking 41 nodes onto one.
 *
 * A plain ordered list, not a path: scenarios are not gated, so drawing a
 * track through them would imply an order the app does not enforce. What
 * the learner needs here is which ones are unfinished, and that is what
 * leads.
 *
 * Static `chapter/` wins over the sibling `[slug]` route in Next's
 * matching, so a scenario would only collide if one were ever slugged
 * "chapter".
 */
export default async function JourneyChapterPage({
  params,
}: {
  params: Promise<{ locale: string; chapter: string }>;
}) {
  const { locale: localeParam, chapter } = await params;
  if (!isAppLocale(localeParam)) return null;
  if (!isJourneyChapter(chapter)) notFound();

  const session = await auth();
  const [scenarios, dictionary] = await Promise.all([
    getScenariosWithProgress(session!.user!.id!, localeParam),
    getDictionary(localeParam),
  ]);
  const messages = dictionary.learningJourney;
  const copy = messages.chapters[chapter];
  const isAccessible = isJourneyChapterAccessible(chapter, session!.user!.role);

  const inChapter = scenarios.filter(
    (scenario) =>
      resolveJourneyChapter(
        scenario.levels.map((level) => level.difficulty),
      ) === chapter,
  );
  if (inChapter.length === 0) notFound();

  if (!isAccessible) {
    return (
      <div className="flex flex-col gap-5">
        <Link
          href={localePath(localeParam, "/learning-journey")}
          className="flex w-fit items-center gap-1.5 font-interface text-supporting font-medium text-text-secondary transition-colors hover:text-text-primary"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {messages.title}
        </Link>

        <div className="flex flex-col gap-4 rounded-panel border border-primary-500/30 bg-surface p-5 sm:p-6">
          <span className="flex size-10 items-center justify-center rounded-full bg-primary-500/15 text-primary-300">
            <Lock className="size-5" aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-1.5">
            <Caption className="font-semibold uppercase tracking-[0.1em] text-primary-300">
              {messages.beta.nextPhase}
            </Caption>
            <PageTitle>{copy.title}</PageTitle>
            <SectionTitle>{messages.beta.previewTitle}</SectionTitle>
            <Body className="text-text-secondary">{copy.blurb}</Body>
            <Body className="text-text-muted">
              {messages.beta.reviewMessage}
            </Body>
          </div>
          <Link
            href={localePath(localeParam, "/learning-journey/chapter/BEGINNER")}
            className="flex min-h-11 w-fit items-center justify-center rounded-control bg-primary-500 px-4 py-2 font-interface text-supporting font-semibold text-on-color-light transition-colors hover:bg-primary-600"
          >
            {messages.beta.backToFoundations}
          </Link>
        </div>
      </div>
    );
  }

  // Unfinished first, in curriculum order; finished ones sink to the
  // bottom rather than being hidden - a learner still wants to reopen one.
  const pending = inChapter.filter((s) => s.status !== "COMPLETED");
  const done = inChapter.filter((s) => s.status === "COMPLETED");
  const ordered = [...pending, ...done];

  return (
    <div className="flex flex-col gap-5">
      <Link
        href={localePath(localeParam, "/learning-journey")}
        className="flex w-fit items-center gap-1.5 font-interface text-supporting font-medium text-text-secondary transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {messages.title}
      </Link>

      <div className="flex flex-col gap-1.5">
        <Caption className="font-semibold uppercase tracking-[0.1em] text-text-muted">
          {CHAPTER_CONFIG[chapter].badge} · {copy.subtitle}
        </Caption>
        <PageTitle>{copy.title}</PageTitle>
        <Body className="text-text-secondary">{copy.blurb}</Body>
        <Caption className="text-text-muted">
          {formatMessage(messages.scenarioProgress, {
            completed: done.length,
            total: inChapter.length,
          })}
        </Caption>
      </div>

      <ul className="flex flex-col gap-2">
        {ordered.map((scenario) => {
          const isDone = scenario.status === "COMPLETED";
          const isStarted = scenario.status === "IN_PROGRESS";
          const Icon = isDone ? Check : isStarted ? Play : Circle;
          return (
            <li key={scenario.slug}>
              <Link
                href={localePath(
                  localeParam,
                  `/learning-journey/${scenario.slug}`,
                )}
                className={cn(
                  "flex min-h-14 items-center gap-3 rounded-panel border bg-surface px-4 py-3 transition-colors duration-fast ease-standard",
                  isStarted
                    ? "border-primary-500/50"
                    : "border-border hover:border-border-strong",
                )}
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full",
                    isDone
                      ? "bg-secondary-700 text-on-color-light"
                      : isStarted
                        ? "bg-primary-500 text-on-color-light"
                        : "bg-elevated text-text-muted",
                  )}
                  aria-hidden="true"
                >
                  <Icon className="size-4" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <SectionTitle
                    className={cn(
                      "truncate text-card-title",
                      isDone && "text-text-muted",
                    )}
                  >
                    {scenario.name}
                  </SectionTitle>
                  <Caption className="text-text-secondary">
                    {formatMessage(messages.lessonProgress, {
                      current: scenario.completedLessons,
                      total: scenario.totalLessons,
                    })}
                  </Caption>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
