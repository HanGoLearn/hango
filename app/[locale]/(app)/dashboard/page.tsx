import Link from "next/link";
import {
  ChevronRight,
  CircleCheck,
  Mic,
  PenLine,
  Sparkles,
  Trophy,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard-data";
import { Button } from "@/components/ui/button";
import {
  PageTitle,
  SectionTitle,
  CardTitle,
  Body,
  Caption,
} from "@/components/ui/typography";
import { ProgressBar } from "@/components/ui/progress-bar";
import { CompetencyList } from "@/components/progress/competency-list";
import { ReviewQueueList } from "@/components/progress/review-queue-list";
import { LevelUpBanner } from "@/components/progress/level-up-banner";
import { HanMascot, HanAvatar } from "@/components/ui/han-mascot";
import { Chip } from "@/components/ui/chip";
import { HanCoinsIcon } from "@/components/ui/hancoins-icon";
import { AchievementIcon } from "@/components/achievements/achievement-icon";
import { AvatarDisplay } from "@/components/avatar/avatar-display";
import { WordsOfTheDayCard } from "@/components/dashboard/words-of-the-day-card";
import { CURRENT_MAX_GENERAL_LEVEL_POINTS } from "@/lib/points-system";
import { getDailyHanTip } from "@/lib/han-tips";
import { cn } from "@/lib/cn";
import { isAppLocale, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { formatMessage } from "@/i18n/format";
import { localizeReviewItem } from "@/i18n/review";

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
  const data = await getDashboardData(userId, locale);

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

  const totalLessons = data.scenarios.reduce(
    (sum, s) => sum + s.totalLessons,
    0,
  );
  const totalCompletedLessons = data.scenarios.reduce(
    (sum, s) => sum + s.completedLessons,
    0,
  );
  const journeyProgressPercent =
    totalLessons > 0
      ? Math.round((totalCompletedLessons / totalLessons) * 100)
      : 0;
  const generalLevelPercent = Math.round(
    (data.generalLevel.points / CURRENT_MAX_GENERAL_LEVEL_POINTS) * 100,
  );
  const tip = getDailyHanTip();
  const localizedLevelLabel =
    messages.levels[
      data.generalLevel.levelLabel as keyof typeof messages.levels
    ] ?? data.generalLevel.levelLabel;
  const localizedTip =
    messages.hanTip.tips[tip.id as keyof typeof messages.hanTip.tips] ??
    tip.text;

  const streakLine = formatMessage(messages.hero.streak, {
    count: data.streak.currentStreak,
  });

  return (
    <div className="flex flex-col gap-8">
      <PageTitle>
        {data.displayName
          ? formatMessage(messages.titleNamed, { name: data.displayName })
          : messages.title}
      </PageTitle>

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
          just another block in the stack. */}
      <div className="flex flex-col items-center gap-4 rounded-panel bg-linear-to-br from-primary-500/10 to-secondary-500/10 p-6 text-center sm:flex-row sm:items-start sm:p-8 sm:text-left">
        <HanMascot
          pose={data.streak.activeToday ? "heart" : "wave"}
          size={96}
          className="shrink-0"
        />
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

          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
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

          {/* Suggested next - now shows the same `reason` field
              ReviewQueueList already shows for every other item in the full
              queue below (review-data.ts); the hero pill previously only
              showed the bare title, dropping the one part that actually
              explains the suggestion. Zero extra queries - `reason` was
              already sitting on this same reviewQueue[0] object. */}
          {data.recommendation && (
            <div className="rounded-control bg-elevated px-3 py-2 text-left">
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

          {/* Weekly activity strip - the streak pill above already gives
              the exact count; this adds the shape of the week at a glance
              (which days, not just how many), zero extra queries (see
              dashboard-data.ts's weeklyActivity - reuses the same cached
              activity dates getStudyStreak already fetches). */}
          <div
            className="flex items-center gap-2.5 self-center sm:self-start"
            role="img"
            aria-label={formatMessage(messages.hero.weeklyActivity, {
              active: data.weeklyActivity.filter((d) => d.active).length,
            })}
          >
            {data.weeklyActivity.map((day) => (
              <div key={day.date} className="flex flex-col items-center gap-1">
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

          {data.continueTarget && (
            <Link
              href={localePath(
                locale,
                `/lesson/${data.continueTarget.lessonSlug}`,
              )}
              className="self-center sm:self-start"
            >
              <Button type="button">{messages.hero.continueAction}</Button>
            </Link>
          )}
        </div>
      </div>

      {/* Quick actions — de-emphasized on purpose: no card wrapper, small
          icon badges reusing the same color mapping the nav already uses
          for these two destinations (secondary/info), so they read as
          secondary utilities rather than competing with the hero's CTA. */}
      <div className="flex gap-5">
        <Link
          href={localePath(locale, "/speaking-lab")}
          className="flex items-center gap-2 text-text-secondary transition-colors duration-fast ease-standard hover:text-text-primary"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-secondary-500/15 text-secondary-300">
            <Mic className="size-4" aria-hidden="true" />
          </span>
          <span className="font-interface text-body font-medium">
            {messages.quickActions.speaking}
          </span>
        </Link>
        <Link
          href={localePath(locale, "/writing-lab")}
          className="flex items-center gap-2 text-text-secondary transition-colors duration-fast ease-standard hover:text-text-primary"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-info-500/15 text-info-500">
            <PenLine className="size-4" aria-hidden="true" />
          </span>
          <span className="font-interface text-body font-medium">
            {messages.quickActions.writing}
          </span>
        </Link>
        {/* Permanent entry point (2026-08-24), same low-key treatment as
            the two links above - deliberately never gated or hidden after
            the first visit (unlike LevelUpBanner's dismiss-and-remember
            pattern): the page has standing reference value - the tone demo
            and courtesy phrases - not just onboarding value. */}
        <Link
          href={localePath(locale, "/welcome-to-chinese")}
          className="flex items-center gap-2 text-text-secondary transition-colors duration-fast ease-standard hover:text-text-primary"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-accent-500/15 text-accent-300">
            <Sparkles className="size-4" aria-hidden="true" />
          </span>
          <span className="font-interface text-body font-medium">
            {messages.quickActions.primer}
          </span>
        </Link>
      </div>

      {/* Two-column split: a primary learning-path column (genuine list
          content - a bordered Card per item is earned here) and a
          glanceable competency "scorecard" sidebar, instead of one long
          undifferentiated stream. */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-8 lg:col-span-2">
          {data.scenarios.length > 0 && (
            <Link
              href={localePath(locale, "/learning-journey")}
              className="group flex flex-col gap-3 rounded-panel border border-border bg-surface p-5 transition-colors duration-fast ease-standard hover:border-primary-500/40"
            >
              <div className="flex items-center justify-between gap-4">
                <SectionTitle>{messages.journey.title}</SectionTitle>
                <ChevronRight
                  className="size-5 shrink-0 text-text-secondary transition-transform duration-fast ease-standard group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </div>
              <ProgressBar
                value={journeyProgressPercent}
                label={formatMessage(messages.journey.progress, {
                  completed: totalCompletedLessons,
                  total: totalLessons,
                })}
              />
            </Link>
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

        <div className="flex flex-col gap-6 lg:col-span-1">
          {/* General Level - the Points & Leveling System's headline
              score (points-system.md), surfaced on the Dashboard for the
              first time (2026-08-21). Headline number only, no explanation
              text - that stays on Progress (the detail view this links to),
              same "glanceable summary vs. full detail" split as the
              Learning Journey panel above. */}
          <Link
            href={localePath(locale, "/progress")}
            className="group flex flex-col gap-2 rounded-panel border-none bg-elevated p-5 shadow-none transition-colors duration-fast ease-standard hover:bg-elevated/70"
          >
            <div className="flex items-center justify-between gap-2">
              <Caption className="font-semibold uppercase tracking-wide text-text-muted">
                {messages.generalLevel}
              </Caption>
              <ChevronRight
                className="size-4 shrink-0 text-text-secondary transition-transform duration-fast ease-standard group-hover:translate-x-1"
                aria-hidden="true"
              />
            </div>
            <div className="flex items-baseline gap-2">
              {/* text-text-primary, not text-primary-300 (2026-08-21) - no
                  fixed primary shade clears WCAG AA against bg-elevated in
                  both themes at once (checked the full 300-700 range;
                  primary-300 itself measured 5.14:1 dark but only 2.22:1
                  light). A real, previously-undetected bug - found while
                  fixing the same pairing on the Progress page. */}
              <CardTitle className="font-display text-text-primary">
                {Math.round(data.generalLevel.points)}
              </CardTitle>
              <Body className="text-text-secondary">
                / {CURRENT_MAX_GENERAL_LEVEL_POINTS} &middot;{" "}
                {localizedLevelLabel}
              </Body>
            </div>
            <ProgressBar value={generalLevelPercent} />
          </Link>

          {/* Words of the Day (2026-09-01) - the one sidebar entry that
              works for a learner with zero points and zero rank yet: 3
              words picked for their real level, shared with everyone else
              at that level today (words-of-the-day.ts), zero AI cost to
              show. Placed right after General Level, before the
              Leaderboard/Achievements/Avatar teasers below - those reward
              progress a brand-new learner doesn't have yet. */}
          <WordsOfTheDayCard
            locale={locale}
            words={data.wordsOfTheDay}
            messages={messages.words}
            vocabularyMessages={dictionary.hanVocabulary}
          />

          {/* Leaderboard teaser (2026-08-29) - top 3 + "your rank" only;
              the full ranked list lives on its own page (getLeaderboardTop
              is called separately, differently-sized, there - not shared
              data). Renders even with an empty top 3 (encourages being
              first) since generalLevelPoints/nickname eligibility is the
              same real data every learner already has. */}
          <Link
            href={localePath(locale, "/leaderboard")}
            className="group flex flex-col gap-2 rounded-panel border-none bg-elevated p-5 shadow-none transition-colors duration-fast ease-standard hover:bg-elevated/70"
          >
            <div className="flex items-center justify-between gap-2">
              <Caption className="font-semibold uppercase tracking-wide text-text-muted">
                {messages.leaderboard.title}
              </Caption>
              <ChevronRight
                className="size-4 shrink-0 text-text-secondary transition-transform duration-fast ease-standard group-hover:translate-x-1"
                aria-hidden="true"
              />
            </div>
            {data.leaderboardTop.length > 0 ? (
              <ul className="flex flex-col gap-1.5">
                {data.leaderboardTop.map((entry) => (
                  <li
                    key={entry.userId}
                    className="flex items-center gap-2 text-supporting"
                  >
                    <span
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-full text-caption font-semibold",
                        entry.rank === 1
                          ? "bg-accent-500 text-on-color-dark"
                          : "bg-surface text-text-muted",
                      )}
                      aria-hidden="true"
                    >
                      {entry.rank === 1 ? (
                        <Trophy className="size-3" />
                      ) : (
                        entry.rank
                      )}
                    </span>
                    {entry.animal && (
                      <AvatarDisplay
                        animal={entry.animal}
                        equipped={entry.equipped}
                        size={20}
                      />
                    )}
                    <span className="flex-1 truncate text-text-primary">
                      @{entry.accountName}
                    </span>
                    <span className="text-text-muted">{entry.points}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <Body className="text-text-secondary">
                {messages.leaderboard.empty}
              </Body>
            )}
            {data.leaderboardRank && (
              <Caption className="text-accent-300">
                {formatMessage(messages.leaderboard.rank, {
                  rank: data.leaderboardRank.rank,
                  total: data.leaderboardRank.totalRanked,
                })}
              </Caption>
            )}
          </Link>

          {/* Achievements teaser (2026-08-29) - same "small taste, full
              catalog lives on its own page" shape as the Leaderboard teaser
              above. */}
          <Link
            href={localePath(locale, "/achievements")}
            className="group flex flex-col gap-2 rounded-panel border-none bg-elevated p-5 shadow-none transition-colors duration-fast ease-standard hover:bg-elevated/70"
          >
            <div className="flex items-center justify-between gap-2">
              <Caption className="font-semibold uppercase tracking-wide text-text-muted">
                {messages.achievements.title}
              </Caption>
              <ChevronRight
                className="size-4 shrink-0 text-text-secondary transition-transform duration-fast ease-standard group-hover:translate-x-1"
                aria-hidden="true"
              />
            </div>
            <Body className="text-text-primary">
              {formatMessage(messages.achievements.unlocked, {
                unlocked: data.achievementSummary.unlockedCount,
                total: data.achievementSummary.totalCount,
              })}
            </Body>
            {data.achievementSummary.recent.length > 0 && (
              <div className="flex items-center gap-2">
                {data.achievementSummary.recent.map((achievement) => (
                  <span
                    key={achievement.key}
                    className="flex size-8 items-center justify-center rounded-full bg-accent-500 text-on-color-dark"
                    title={achievement.title}
                  >
                    <AchievementIcon
                      name={achievement.iconName}
                      className="size-4"
                    />
                  </span>
                ))}
              </div>
            )}
          </Link>

          {/* Avatar/HanCoins teaser (2026-08-30) - same teaser shape as
              Leaderboard/Achievements above. Works before the learner has
              picked an animal too (the tienda page itself is the
              retroactive entry point for that, same as Account Name). */}
          <Link
            href={localePath(locale, "/tienda")}
            className="group flex flex-col gap-2 rounded-panel border-none bg-elevated p-5 shadow-none transition-colors duration-fast ease-standard hover:bg-elevated/70"
          >
            <div className="flex items-center justify-between gap-2">
              <Caption className="font-semibold uppercase tracking-wide text-text-muted">
                {messages.avatar.title}
              </Caption>
              <ChevronRight
                className="size-4 shrink-0 text-text-secondary transition-transform duration-fast ease-standard group-hover:translate-x-1"
                aria-hidden="true"
              />
            </div>
            <div className="flex items-center gap-3">
              {data.avatar.animal ? (
                <AvatarDisplay
                  animal={data.avatar.animal}
                  equipped={data.avatar.equipped}
                  size={40}
                />
              ) : (
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface text-text-muted">
                  ?
                </span>
              )}
              {data.avatar.animal ? (
                <Body className="flex items-center gap-1.5 text-text-primary">
                  <HanCoinsIcon size={16} />
                  {data.avatar.coinBalance}
                </Body>
              ) : (
                <Body className="text-text-primary">
                  {messages.avatar.choose}
                </Body>
              )}
            </div>
          </Link>

          {data.competencies.length > 0 && (
            <div className="flex flex-col gap-2">
              <SectionTitle>{messages.competency.title}</SectionTitle>
              <CompetencyList
                competencies={data.competencies.slice(0, 4)}
                className="rounded-panel border-none bg-elevated p-5 shadow-none"
                messages={messages.competency}
              />
            </div>
          )}

          {/* Han's tip - static, rotates daily by date only, zero database
              cost (src/lib/han-tips.ts). Placed last in the sidebar so it
              reads as a small closing touch of personality, not competing
              with the two data-driven scorecards above it. */}
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
