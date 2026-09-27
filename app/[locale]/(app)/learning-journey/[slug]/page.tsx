import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ChevronRight, Star, Target } from "lucide-react";
import { auth } from "@/lib/auth";
import { PageTitle, Supporting, Caption } from "@/components/ui/typography";
import { HanAvatar } from "@/components/ui/han-mascot";
import { LessonPath } from "@/components/learning-journey/lesson-path";
import { CHAPTER_TONES } from "@/components/learning-journey/journey-hub";
import { ScenarioFinalMission } from "@/components/mission/scenario-final-mission";
import { ScenarioCompletionSummary } from "@/components/learning-journey/scenario-completion-summary";
import { getScenarioDetailWithProgress } from "@/lib/content/learning-journey-data";
import {
  CHAPTER_CONFIG,
  JOURNEY_CHAPTER_ORDER,
  resolveJourneyChapter,
} from "@/lib/content/learning-journey";
import { cn } from "@/lib/cn";
import { isAppLocale, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { formatMessage } from "@/i18n/format";
import { isJourneyChapterAccessible } from "@/lib/beta-learning-scope";

/**
 * One scenario (2026-09-23 redesign, the user's pick of two mocked
 * directions). The page used to be four stacked text blocks with nothing
 * contained in anything: a domain caption, a title, a blurb, and the
 * communication outcomes as a bare `<ul>` whose `display:flex` silently
 * removed its own bullets, so the scenario's four selling points rendered
 * as four naked lines. Under them a section heading repeated the chapter
 * the learner had just tapped through - for a BEGINNER scenario the page
 * literally printed "Fundamentos" twice - and there was no primary action
 * anywhere: continuing meant finding the one coloured node inside the path.
 *
 * So: a hero that says where you are and what you are doing next, the
 * outcomes reframed as the promise they already were, and the path left
 * exactly as it was (the one part the user liked).
 *
 * The outcomes are marked with a target, never a check: nothing tracks them
 * per-outcome, and a checkmark would claim progress the app cannot know.
 */
export default async function ScenarioDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isAppLocale(locale)) return null;
  const session = await auth();
  const [scenario, dictionary] = await Promise.all([
    getScenarioDetailWithProgress(slug, session!.user!.id!, locale),
    getDictionary(locale),
  ]);

  if (!scenario) notFound();

  const messages = dictionary.learningJourney;
  const finalMission = scenario.missions.find((m) => m.lessonId === null);

  // Same resolution the hub and the chapter screen use, so a scenario wears
  // the colour and the number of the chapter it was reached through.
  const chapter = resolveJourneyChapter(
    scenario.levels.map((level) => level.difficulty),
  );
  if (!isJourneyChapterAccessible(chapter, session!.user!.role)) {
    redirect(localePath(locale, `/learning-journey/chapter/${chapter}`));
  }
  const chapterCopy = messages.chapters[chapter];
  const tone = CHAPTER_TONES[CHAPTER_CONFIG[chapter].accent];
  const chapterNumber = JOURNEY_CHAPTER_ORDER.indexOf(chapter) + 1;

  // The lesson the path would send them to anyway - surfaced as a real
  // button so the screen has one obvious thing to do. Null once every
  // lesson is done, and the button simply isn't rendered.
  const nextLesson = scenario.levels
    .flatMap((level) => level.lessons)
    .find((lesson) => lesson.availability === "AVAILABLE");

  return (
    <div className="flex flex-col gap-4">
      <Link
        href={localePath(locale, `/learning-journey/chapter/${chapter}`)}
        className="flex w-fit items-center gap-1.5 font-interface text-supporting font-medium text-text-secondary transition-colors duration-fast ease-standard hover:text-text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {chapterCopy.title}
      </Link>

      <div
        className={cn(
          "relative flex flex-col gap-3 overflow-hidden rounded-panel border p-[18px]",
          tone.hero,
        )}
      >
        {/* Decoration only - the chapter's number is carried in words by
            the chip right below it. Right corner, above Han's disc, with
            enough clearance between them that the two don't touch - this
            exact position is what the user confirmed as correct (a device
            screenshot showing daylight between the "1" and the avatar), so
            it stays here rather than moving again on my own judgment. */}
        <span
          className={cn(
            "pointer-events-none absolute -top-2 right-3 font-display text-[4.5rem] leading-none font-bold",
            tone.ghost,
          )}
          aria-hidden="true"
        >
          {chapterNumber}
        </span>

        <span className="relative flex">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-interface text-caption font-semibold uppercase tracking-wide",
              tone.chip,
            )}
          >
            <span
              className={cn("size-1.5 shrink-0 rounded-full", tone.segment)}
              aria-hidden="true"
            />
            {formatMessage(messages.detail.chapterBadge, {
              number: chapterNumber,
              name: chapterCopy.title,
            })}
          </span>
        </span>

        <div className="relative flex items-start gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <PageTitle className="text-[1.75rem] leading-tight">
              {scenario.name}
            </PageTitle>
            {scenario.description && (
              <Supporting>{scenario.description}</Supporting>
            )}
          </div>
          {/* The solid tinted disc is load-bearing, not decoration
              (2026-09-23 fix): Han's art is a transparent PNG, so without a
              fill behind it the watermark numeral showed straight through
              the mascot and the card's top-right corner turned to mush. */}
          <span
            className={cn(
              "flex size-14 shrink-0 items-center justify-center rounded-full",
              tone.tint,
            )}
          >
            <HanAvatar pose="idle" size={36} />
          </span>
        </div>

        {/* Segments, not a percentage: one block per lesson, the same
            language the hub uses for situations. */}
        <span className="relative flex items-center gap-2.5">
          <span className="flex min-w-0 flex-1 items-center gap-1">
            {Array.from({ length: scenario.totalLessons }).map(
              (_, position) => (
                <span
                  key={position}
                  className={cn(
                    "h-1.5 flex-1 rounded-full",
                    position < scenario.completedLessons
                      ? tone.segment
                      : "bg-text-muted/25",
                  )}
                />
              ),
            )}
          </span>
          <Caption className="shrink-0 font-semibold text-text-secondary">
            {formatMessage(messages.detail.lessonsProgress, {
              completed: scenario.completedLessons,
              total: scenario.totalLessons,
            })}
          </Caption>
        </span>

        {nextLesson && (
          <Link
            href={localePath(locale, `/lesson/${nextLesson.slug}`)}
            className="relative flex min-h-12 items-center justify-between gap-2.5 rounded-card bg-primary-500 px-3.5 py-2.5 text-on-color-light transition-colors duration-fast ease-standard hover:bg-primary-600"
          >
            <span className="flex min-w-0 flex-col">
              <span className="font-interface text-caption font-semibold uppercase tracking-wide text-on-color-light/75">
                {messages.continueLabel}
              </span>
              <span className="truncate font-interface text-supporting font-semibold">
                {nextLesson.title}
              </span>
            </span>
            <ChevronRight className="size-5 shrink-0" aria-hidden="true" />
          </Link>
        )}
      </div>

      {scenario.status === "COMPLETED" && (
        <ScenarioCompletionSummary
          scenarioId={scenario.id}
          scenarioSlug={scenario.slug}
          lessons={scenario.levels.flatMap((level) =>
            level.lessons.map((lesson) => ({
              id: lesson.id,
              title: lesson.title,
              reflectionTotalScore: lesson.reflectionTotalScore,
            })),
          )}
        />
      )}

      {(scenario.communicationOutcomes.length > 0 || finalMission) && (
        <div className="flex flex-col gap-3 rounded-panel border border-border bg-surface p-4">
          {scenario.communicationOutcomes.length > 0 && (
            <>
              <Caption
                className={cn(
                  "font-semibold uppercase tracking-[0.08em]",
                  tone.label,
                )}
              >
                {messages.detail.outcomes}
              </Caption>
              <ul className="flex flex-col gap-2.5">
                {scenario.communicationOutcomes.map((outcome) => (
                  <li key={outcome} className="flex items-start gap-2.5">
                    <Target
                      className={cn("mt-0.5 size-4 shrink-0", tone.mark)}
                      aria-hidden="true"
                    />
                    <Supporting className="text-text-primary">
                      {outcome}
                    </Supporting>
                  </li>
                ))}
              </ul>
            </>
          )}

          {finalMission && (
            <>
              {scenario.communicationOutcomes.length > 0 && (
                <span className="h-px bg-border" aria-hidden="true" />
              )}
              {/* Always gold, whatever the chapter's colour - it matches
                  the star node that closes the path below. */}
              <span className="flex items-start gap-2.5">
                <Star
                  className="mt-0.5 size-4 shrink-0 fill-accent-300 text-accent-300"
                  aria-hidden="true"
                />
                <Supporting>
                  {messages.detail.finalMission}:{" "}
                  <span className="font-semibold text-accent-300">
                    {finalMission.title}
                  </span>
                </Supporting>
              </span>
            </>
          )}
        </div>
      )}

      {scenario.levels.map((level, index) => (
        <div key={level.id} className="flex flex-col gap-1">
          {/* One level (all 41 published scenarios today): the heading says
              what the path is. Two or more: it has to name each tier apart,
              so the difficulty label earns its place again. */}
          <Caption className="font-semibold uppercase tracking-[0.08em] text-text-muted">
            {scenario.levels.length > 1
              ? (dictionary.learningJourney.detail.difficulty[
                  level.difficulty as keyof typeof dictionary.learningJourney.detail.difficulty
                ] ?? level.difficulty)
              : formatMessage(messages.detail.pathLabel, {
                  count: level.lessons.length,
                })}
          </Caption>
          <LessonPath
            locale={locale}
            lessons={level.lessons}
            messages={dictionary.learningJourney.lessonPath}
            finalMissionTitle={
              index === scenario.levels.length - 1
                ? finalMission?.title
                : undefined
            }
          />
        </div>
      ))}

      {/* No section heading of its own any more: the goal is announced in
          the card above and the star node directly above this names it, so
          a third "Final Mission" line would be the same redundancy this
          redesign set out to remove. MissionRuntime titles itself. */}
      {finalMission && (
        <ScenarioFinalMission
          mission={{
            id: finalMission.id,
            title: finalMission.title,
            context: finalMission.context,
            objective: finalMission.objective,
            learnerRole: finalMission.learnerRole,
            aiRole: finalMission.aiRole,
            successConditions: finalMission.successConditions.map(
              (condition) => condition.description,
            ),
          }}
        />
      )}
    </div>
  );
}
