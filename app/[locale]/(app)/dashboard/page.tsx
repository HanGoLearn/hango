import Link from "next/link";
import { Check, CircleCheck, Flame, Gem } from "lucide-react";
import { auth } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard-data";
import { Button } from "@/components/ui/button";
import {
  PageTitle,
  SectionTitle,
  Body,
  Caption,
} from "@/components/ui/typography";
import { ReviewQueueList } from "@/components/progress/review-queue-list";
import { LevelUpBanner } from "@/components/progress/level-up-banner";
import { HanMascot, HanAvatar } from "@/components/ui/han-mascot";
import { Chip } from "@/components/ui/chip";
import { WordsOfTheDayCard } from "@/components/dashboard/words-of-the-day-card";
import { hskNumberForPoints } from "@/lib/points-system";
import { getDailyHanTip } from "@/lib/han-tips";
import { cn } from "@/lib/cn";
import { isAppLocale, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { formatMessage } from "@/i18n/format";
import { localizeReviewItem } from "@/i18n/review";
import { getMaximumJourneyChapter } from "@/lib/beta-learning-scope";

/**
 * Redesigned 2026-08-21 (Direction A "Tinta Cálida" / Direction B
 * "Porcelana" reference screen - project/learning-journey-optimization.md):
 * same `getDashboardData` call, same fields, only the composition changes.
 * The previous version was a flat stack of near-identical bordered Cards
 * (hero, a redundant recommendation card duplicating reviewQueue[0], two
 * orphaned buttons, then more cards) with no size/emphasis hierarchy. This
 * version: one confident hero panel (recommendation folded in as an inline
 * line instead of its own block), de-emphasized quick actions with no card
 * wrapper, then a two-column split below - a primary learning-path column
 * and a glanceable competency "scorecard" sidebar, instead of one long
 * undifferentiated stream.
 *
 * 2026-08-21 follow-up: the full per-scenario grid (one ScenarioCard per
 * scenario) was replaced with a single "Learning Journey" entry panel
 * showing an aggregate progress bar - the home screen was showing every
 * scenario at once, which is the Learning Journey page's job, not the
 * Dashboard's. `data.scenarios` is still fetched (unchanged query - shared
 * via getContinueLearningTarget's cached scenario tree, see
 * learning-journey-data.ts) but only aggregated here, never mapped 1:1.
 */
export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isAppLocale(localeParam)) return null;
  const locale = localeParam;
  const dictionary = await getDictionary(locale);
  const messages = dictionary.dashboard;
  const session = await auth();
  const userId = session!.user!.id!;
  const data = await getDashboardData(
    userId,
    locale,
    getMaximumJourneyChapter(session!.user!.role),
  );

  const isNewLearner = data.scenarios.every((s) => s.completedLessons === 0);

  if (isNewLearner && !data.continueTarget) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <HanMascot pose="curious" size={140} />
        <PageTitle>
          {data.displayName
            ? formatMessage(messages.newLearner.welcomeNamed, {
                name: data.displayName,
              })
            : messages.newLearner.welcome}
        </PageTitle>
        <Body className="max-w-sm text-text-secondary">
          {messages.newLearner.description}
        </Body>
        <Link href={localePath(locale, "/learning-journey")}>
          <Button type="button" className="mt-2">
            {messages.newLearner.journeyAction}
          </Button>
        </Link>
        {/* New-learner nudge toward Welcome to Chinese (2026-08-24) - the
            page fills a real gap the curriculum itself never covers
            (pronouns, numbers, tones - see the informe's Section 10.4
            audit), so a brand-new learner is pointed at it before their
            first scenario, not after. Ungraded and permanent - see the
            quick-actions row below for where returning learners find it. */}
        <Link
          href={localePath(locale, "/welcome-to-chinese")}
          className="text-supporting font-medium text-secondary-400 underline-offset-4 hover:underline"
        >
          {messages.newLearner.primerAction}
        </Link>
      </div>
    );
  }

  const tip = getDailyHanTip();
  const localizedLevelLabel =
    messages.levels[
      data.generalLevel.levelLabel as keyof typeof messages.levels
    ] ?? data.generalLevel.levelLabel;
  const localizedTip =
    messages.hanTip.tips[tip.id as keyof typeof messages.hanTip.tips] ??
    tip.text;

  // Three cases, not one template: "Racha de 1 días" is wrong in Spanish,
  // and a learner with no streak yet needs an invitation rather than a
  // hidden row - the flame should teach the mechanic from day one, not
  // appear only once they already understand it.
  const streakLine =
    data.streak.currentStreak === 0
      ? messages.hero.streakStart
      : data.streak.currentStreak === 1
        ? messages.hero.streakOne
        : formatMessage(messages.hero.streak, {
            count: data.streak.currentStreak,
          });

  // Seven steps over the ten tiers of HSK_POINT_THRESHOLDS, rising grey ->
  // green -> blue -> orange -> gold, so the colour itself reads as advance.
  // Every step is a token already used as a text colour elsewhere in the
  // app (checked, not assumed): inventing shades here would mean shipping
  // unverified contrast on a number the learner is meant to read at a
  // glance. Ten distinct colours would be noise; each boundary below still
  // falls on a real tier the learner is told they reached.
  const experienceTone = [
    "text-text-muted", // 0 · Just Starting Out
    "text-secondary-400", // 1 · Getting By
    "text-secondary-300", // 2 · Finding Your Footing
    "text-info-500", // 3 · Speaking with Ease
    "text-info-500", // 4 · Easily Understood
    "text-warning-500", // 5 · Handling Real Situations
    "text-warning-500", // 6 · Speaking Like a Professional
    "text-accent-300", // 7 · Nearing Mastery
    "text-accent-300", // 8 · Refined Fluency
    "text-accent-200", // 9 · Mastering the Language
  ][hskNumberForPoints(data.generalLevel.points)]!;

  // The scenario the learner is actually inside, and where they are in it.
  // `data.scenarios` was already fetched and, until now, collapsed into a
  // single "0 of 164" - an abstraction that means nothing on day one.
  // Zero extra queries: the lesson list was sitting in that same object.
  //
  // Completion per lesson isn't returned by getScenariosWithProgress (only
  // a count), but the journey is strictly sequential and continueTarget is
  // by definition the first unfinished lesson, so everything before it is
  // done and everything after is pending.
  const currentScenario = data.continueTarget
    ? data.scenarios.find((s) => s.slug === data.continueTarget!.scenarioSlug)
    : undefined;
  const scenarioLessons = currentScenario
    ? currentScenario.levels.flatMap((level) => level.lessons)
    : [];
  const currentLessonIndex = scenarioLessons.findIndex(
    (lesson) => lesson.slug === data.continueTarget?.lessonSlug,
  );
  // Every published scenario holds exactly 4 lessons (41 scenarios x 4 =
  // the 164 total), so the whole scenario fits: showing a window of 3 only
  // ever chopped one lesson off the end for no reason. Four rows is ~140px
  // and the learner sees the complete arc they're inside.

  return (
    <div className="flex flex-col gap-5">
      {/* A greeting, not a page title (2026-09-20). At page-title size this
          wrapped to two lines on a phone and cost ~107px - 16% of the
          visible screen - to say something that carries no information.
          Kept, because the warmth is worth one small line.

          Still font-display (the follow-up fix): dropping to Body also
          dropped Fraunces for Inter, which read as a different, plainer
          typeface rather than a smaller version of the same greeting. Same
          font, card-title size, lighter weight and colour so it doesn't
          compete with the lesson title inside the hero. */}
      <SectionTitle className="text-card-title font-medium text-text-secondary">
        {data.displayName
          ? formatMessage(messages.titleNamed, { name: data.displayName })
          : messages.title}
      </SectionTitle>

      {/* Renders nothing except right after a real tier level-up (client-
          only comparison, src/components/progress/level-up-banner.tsx) -
          zero extra queries, reuses the generalLevel this page already
          computed. */}
      <LevelUpBanner
        levelLabel={localizedLevelLabel}
        messages={messages.levelUp}
      />

      {/* Today hero — rounded-panel + soft gradient, not a bordered Card,
          so it reads as the page's one clear "primary action" rather than
          just another block in the stack.

          Horizontal on phones too (2026-09-20): stacking a centred mascot
          above centred text cost a full extra row plus its gap, and made the
          card tall enough to push everything else off screen. Han sits
          beside the text instead, and the copy is left-aligned, which is
          also easier to read on a narrow column.

          Continue lives under Han in that same left column (2026-09-20
          follow-up, user request): Han is only ~75px tall while the text
          column runs ~125px, so the space directly below him was dead. The
          button fills it, and the card gets shorter instead of taller for
          it. */}
      <div
        data-tour-id="dashboard-hero"
        className="flex items-start gap-[35px] rounded-panel bg-linear-to-br from-primary-500/10 to-secondary-500/10 p-4 text-left sm:gap-10 sm:p-8"
      >
        <div className="flex shrink-0 flex-col gap-2">
          {/* 112, not 64: the source art carries a wide transparent margin
              around the character (see han-mascot.tsx), so the character
              itself renders far smaller than its declared box - at 64 it
              read as a thumbnail. */}
          <HanMascot
            pose={data.streak.activeToday ? "heart" : "wave"}
            size={112}
          />
          {data.continueTarget && (
            <Link
              href={localePath(
                locale,
                `/lesson/${data.continueTarget.lessonSlug}`,
              )}
              className="w-[112px]"
            >
              <Button type="button" className="w-full">
                {messages.hero.continueAction}
              </Button>
            </Link>
          )}

          {/* Daily goal, phones only (2026-09-20). Correcting an earlier
              wrong assumption in this file: TopBar does NOT carry this on a
              phone - its streak chip is `sm:` and its goal chip is `lg:`,
              so below 640px the top bar shows coins and nothing else. The
              goal was invisible on mobile everywhere. It goes here, in the
              space left under the button, because it is the one signal
              genuinely missing rather than filler. */}
          {data.dailyStudyTargetMinutes && (
            <Chip
              tone={data.streak.activeToday ? "secondary" : "neutral"}
              className="w-full justify-center sm:hidden"
            >
              <CircleCheck className="size-4" aria-hidden="true" />
              {formatMessage(messages.hero.goalShort, {
                minutes: data.dailyStudyTargetMinutes,
              })}
            </Chip>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex flex-col gap-1">
            {data.continueTarget ? (
              <>
                <Caption>{messages.hero.continueLearning}</Caption>
                <SectionTitle className="text-card-title">
                  {data.continueTarget.lessonTitle}
                </SectionTitle>
              </>
            ) : (
              <>
                <Caption>{messages.hero.caughtUp}</Caption>
                <Body>{messages.hero.caughtUpDescription}</Body>
              </>
            )}
          </div>

          {/* Hidden on phones (2026-09-20): at this width the weekly strip
              below already carries the streak, and the daily goal has its
              own compact chip under the Continue button. Desktop keeps the
              full chips - there the hero has room to spare, and TopBar's
              own streak/goal chips only appear at sm:/lg: anyway. */}
          <div className="hidden flex-wrap items-center justify-center gap-2 sm:flex sm:justify-start">
            <Chip tone="accent" className="py-1 pr-3 pl-1">
              <HanAvatar
                pose={data.streak.activeToday ? "heart" : "wave"}
                size={20}
              />
              {streakLine}
            </Chip>
            {/* Binary, not proportional (2026-08-21) - activeToday is a
                boolean, and no field anywhere tracks actual minutes studied
                today, so a true progress ring isn't possible without a new
                query. Reuses TopBar's exact met/not-met visual language
                (CircleCheck + the same color swap) for consistency instead
                of inventing a second style for the same signal. */}
            {data.dailyStudyTargetMinutes && (
              <Chip tone={data.streak.activeToday ? "secondary" : "neutral"}>
                <CircleCheck className="size-4" aria-hidden="true" />
                {data.streak.activeToday
                  ? formatMessage(messages.hero.goalMet, {
                      minutes: data.dailyStudyTargetMinutes,
                    })
                  : formatMessage(messages.hero.goal, {
                      minutes: data.dailyStudyTargetMinutes,
                    })}
              </Chip>
            )}
          </div>

          {/* No whole-course progress bar here (2026-09-20, user decision).
              It read "0 of 164 lessons completed · 0%" over an empty track -
              the most discouraging possible framing on the one screen meant
              to invite a beginner to start, and already said better by the
              scenario card below, where the scale is four lessons rather
              than 164. The big picture lives on Progress. */}

          {/* Suggested next - hidden on phones, where it is the same item
              the Review list below already leads with (it *is*
              reviewQueue[0], see dashboard-data.ts). Desktop has the room
              for the redundancy to read as emphasis rather than clutter. */}
          {data.recommendation && (
            <div className="hidden rounded-control bg-elevated px-3 py-2 text-left sm:block">
              <Body className="text-text-primary">
                {messages.hero.suggestedNext}{" "}
                <span className="font-medium">
                  {
                    localizeReviewItem(data.recommendation, messages.review)
                      .title
                  }
                </span>
              </Body>
              <Caption className="text-text-muted">
                {
                  localizeReviewItem(data.recommendation, messages.review)
                    .reason
                }
              </Caption>
            </div>
          )}

          {/* The streak count, phones only (2026-09-20). The dots below say
              *which* days, never *how many* - and a 30-day streak can't fit
              in a 7-day window at all. TopBar's streak chip starts at sm:,
              so without this the number appeared nowhere on a phone.
              Desktop reads it from the chips row above instead. */}
          <div className="flex flex-col gap-1">
            <Caption className="flex items-center gap-1.5 text-text-secondary sm:hidden">
              {/* Lit only when today already counts: a flame that looks the
                  same whether or not the streak is at risk says nothing.
                  Same met/not-met language the goal chip and TopBar use. */}
              <Flame
                className={cn(
                  "size-4 shrink-0",
                  data.streak.activeToday
                    ? "text-accent-300"
                    : "text-text-muted",
                )}
                aria-hidden="true"
              />
              {streakLine}
            </Caption>

            {/* Weekly activity strip - the shape of the week at a glance
                (which days, not just how many), zero extra queries. Grouped
                with the count above so the pair costs one gap, not two, and
                reads as one idea: how many, and which. */}
            <div
              data-tour-id="dashboard-streak"
              className="flex items-center gap-2.5 self-start"
              role="img"
              aria-label={formatMessage(messages.hero.weeklyActivity, {
                active: data.weeklyActivity.filter((d) => d.active).length,
              })}
            >
              {data.weeklyActivity.map((day) => (
                <div
                  key={day.date}
                  className="flex flex-col items-center gap-1"
                >
                  <span
                    className={cn(
                      "size-2.5 rounded-full",
                      day.active ? "bg-accent-500" : "bg-border",
                    )}
                  />
                  <span className="font-interface text-[0.625rem] text-text-muted">
                    {
                      messages.hero.weekdays[
                        new Date(`${day.date}T00:00:00Z`).getUTCDay()
                      ]
                    }
                  </span>
                </div>
              ))}
            </div>

            {/* Experience, right under the week (2026-09-21). No
                denominator on purpose: "340 / 1850" would reintroduce the
                exact discouragement the whole-course bar was removed for.
                Points only ever go up, so the bare number is always a
                gain.

                The colour follows the ten tiers the points system already
                defines (HSK_POINT_THRESHOLDS), so it changes on a real
                milestone that already has a name - never an invented
                gradient. The tier name sits beside it, so the colour is
                reinforcement, never the only carrier of the meaning. */}
            <div
              data-tour-id="dashboard-experience"
              className="flex items-center gap-1.5"
            >
              <Gem
                className={cn("size-4 shrink-0", experienceTone)}
                aria-hidden="true"
              />
              <span
                className={cn(
                  "font-display text-card-title font-semibold",
                  experienceTone,
                )}
              >
                {Math.round(data.generalLevel.points)}
              </span>
              <Caption className="text-text-muted">
                {messages.hero.experience}
              </Caption>
            </div>
            {/* The tier name on its own line, never only the colour: the
                ramp is reinforcement for people who read it, not the
                carrier of the meaning. */}
            <Caption className="truncate text-text-secondary">
              {localizedLevelLabel}
            </Caption>
          </div>

          {/* Streak-at-risk nudge - zero extra queries, both fields already
              sit on data.streak. No time-of-day gating ("is it late") on
              purpose: the server doesn't know the learner's local timezone
              (study-streak.ts's own documented simplification), so this
              stays honest about *what* is true (streak lapses without
              today's activity) rather than guessing *when* it's urgent. */}
          {data.streak.currentStreak > 0 && !data.streak.activeToday && (
            <Caption className="text-warning-500">
              {formatMessage(messages.hero.streakRisk, {
                count: data.streak.currentStreak,
              })}
            </Caption>
          )}
        </div>
      </div>

      {/* Single column (2026-09-20). This page used to carry a quick-action
          row plus a seven-tile sidebar: General Level (already the Progress
          page's headline), Leaderboard, Achievements, Avatar, Competencies.
          On a phone that stacked into an endless scroll of things a learner
          hasn't earned yet. Each of those now lives on the one page that
          owns it - Progress, Tienda - and the study surfaces are reachable
          from the Learning menu in the nav, so the row duplicated that too.
          What's left here answers one question: what do I do now. */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-8">
          {currentScenario && scenarioLessons.length > 0 && (
            <section className="flex flex-col gap-3 rounded-panel border border-border bg-surface p-5">
              <div className="flex items-baseline justify-between gap-3">
                <div className="flex min-w-0 flex-col">
                  <Caption className="font-semibold uppercase tracking-wide text-text-muted">
                    {messages.journey.currentScenario}
                  </Caption>
                  <SectionTitle className="truncate text-card-title">
                    {currentScenario.name}
                  </SectionTitle>
                </div>
                <Caption className="shrink-0 text-text-muted">
                  {formatMessage(messages.journey.scenarioProgress, {
                    completed: currentScenario.completedLessons,
                    total: currentScenario.totalLessons,
                  })}
                </Caption>
              </div>

              {/* Read as a path, not a list (user's pick, 2026-09-20): one
                  line joins the four nodes so the scenario reads as a route
                  with a position on it. The line is decorative and sits
                  behind the nodes; each node's own state is carried by the
                  icon and the label, never by the line alone. */}
              {/* A grid, not a flex row, so the node column has one fixed
                  width every row shares: the connector can then be placed
                  at that column's exact centre (6px of row padding + half
                  of the 28px node = 20px) instead of a guessed offset that
                  drifted into the label. */}
              <ol className="relative flex flex-col gap-1">
                <span
                  className="absolute top-7 bottom-7 left-[1.1875rem] w-0.5 bg-border"
                  aria-hidden="true"
                />
                {scenarioLessons.map((lesson, index) => {
                  const isCurrent = index === currentLessonIndex;
                  const isDone =
                    currentLessonIndex >= 0 && index < currentLessonIndex;
                  return (
                    <li key={lesson.slug} className="relative">
                      <Link
                        href={localePath(locale, `/lesson/${lesson.slug}`)}
                        className={cn(
                          "grid min-h-11 grid-cols-[1.75rem_1fr] items-center gap-x-4 rounded-control px-1.5 transition-colors duration-fast ease-standard",
                          isCurrent ? "bg-primary-500/10" : "hover:bg-elevated",
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-7 shrink-0 items-center justify-center rounded-full text-caption font-semibold",
                            isCurrent
                              ? // ring, not a bigger dot: the node keeps the
                                // same footprint as its neighbours so the
                                // line still runs through their centres.
                                "bg-primary-500 text-on-color-light ring-4 ring-primary-500/25"
                              : isDone
                                ? // secondary-700, not -500: navigation.ts
                                  // documents that -500 clears AA against
                                  // neither fixed on-colour in both themes.
                                  "bg-secondary-700 text-on-color-light"
                                : "bg-elevated text-text-muted",
                          )}
                          aria-hidden="true"
                        >
                          {isDone ? (
                            <Check className="size-3.5" strokeWidth={3} />
                          ) : (
                            index + 1
                          )}
                        </span>
                        <span className="flex min-w-0 flex-col justify-center">
                          <span
                            className={cn(
                              "truncate font-interface text-body",
                              isCurrent
                                ? "font-semibold text-text-primary"
                                : isDone
                                  ? "text-text-muted"
                                  : "text-text-secondary",
                            )}
                          >
                            {lesson.title}
                          </span>
                          {isCurrent && (
                            <Caption className="text-accent-300">
                              {messages.journey.youAreHere}
                            </Caption>
                          )}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ol>

              <Link
                href={localePath(locale, "/learning-journey")}
                className="self-start font-interface text-supporting font-medium text-secondary-400 underline-offset-4 hover:underline"
              >
                {messages.journey.viewAll}
              </Link>
            </section>
          )}

          {data.reviewQueue.length > 0 && (
            <div className="flex flex-col gap-2">
              <SectionTitle>{messages.review.title}</SectionTitle>
              <ReviewQueueList
                items={data.reviewQueue}
                locale={locale}
                messages={messages.review}
              />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          {/* Words of the Day (2026-09-01) - 3 words picked for the
              learner's real level, shared with everyone else at that level
              today (words-of-the-day.ts), zero AI cost to show. Works from
              day one, unlike anything that rewards progress. */}
          {/* The tour anchors on the words alone, not on this card plus
              Han's tip below it (2026-09-23 fix): the pair is tall enough
              that centring it left too little room either side, and the
              tour card came out squeezed. Han's tip sits directly under
              this one and stays in view anyway, which is all the step's
              copy claims. */}
          <div data-tour-id="dashboard-words">
            <WordsOfTheDayCard
              locale={locale}
              words={data.wordsOfTheDay}
              messages={messages.words}
              vocabularyMessages={dictionary.hanVocabulary}
            />
          </div>

          {/* Han's tip - static, rotates daily by date only, zero database
              cost (src/lib/han-tips.ts). Shown alongside Words of the Day
              rather than alternating with it: once the hero stopped taking
              half the screen, the page needed the density back, and both
              are small. */}
          <div className="flex items-start gap-3 rounded-panel bg-elevated p-4">
            <HanAvatar pose="curious" size={36} className="mt-0.5" />
            <div className="flex flex-col gap-1">
              <Caption className="font-semibold uppercase tracking-wide text-text-muted">
                {messages.hanTip.title}
              </Caption>
              <Body className="text-text-secondary">{localizedTip}</Body>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
