import Link from "next/link";
import { auth } from "@/lib/auth";
import { EmptyState } from "@/components/ui/states";
import {
  PageTitle,
  SectionTitle,
  Body,
  Caption,
  CardTitle,
} from "@/components/ui/typography";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CompetencyList } from "@/components/progress/competency-list";
import { ScenarioMasteryList } from "@/components/progress/scenario-mastery-list";
import { ReviewQueueList } from "@/components/progress/review-queue-list";
import {
  getCompetencyProgress,
  getVocabularyGrammarExposure,
  getEstimatedLevel,
  getGeneralLevelSummary,
  getScenarioMastery,
  getContinueLearningTarget,
} from "@/lib/progress-data";
import { getReviewQueue } from "@/lib/review-data";
import { getAchievementSummary } from "@/lib/achievements";
import { getLearnerRank } from "@/lib/leaderboard-data";
import { AchievementIcon } from "@/components/achievements/achievement-icon";
import { ChevronRight, Trophy } from "lucide-react";
import { CURRENT_MAX_GENERAL_LEVEL_POINTS } from "@/lib/points-system";
import { isAppLocale, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { formatMessage } from "@/i18n/format";
import { getMaximumJourneyChapter } from "@/lib/beta-learning-scope";

export default async function ProgressPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isAppLocale(localeParam)) return null;
  const locale = localeParam;
  const dictionary = await getDictionary(locale);
  const messages = dictionary.progress;
  const session = await auth();
  const userId = session!.user!.id!;
  const maximumChapter = getMaximumJourneyChapter(session!.user!.role);

  const [
    competencies,
    exposure,
    level,
    generalLevel,
    scenarios,
    continueTarget,
    reviewQueue,
    achievements,
    rank,
  ] = await Promise.all([
    getCompetencyProgress(userId),
    getVocabularyGrammarExposure(userId),
    getEstimatedLevel(userId),
    getGeneralLevelSummary(userId),
    getScenarioMastery(userId, locale),
    getContinueLearningTarget(userId, locale, maximumChapter),
    getReviewQueue(userId),
    // Moved off the Dashboard (2026-09-20): achievements and rank are
    // progress data, and this is the page a learner opens when they want
    // to look at their progress. On the Dashboard they were permanent
    // teasers competing with the one action that page exists for. Both
    // calls are React.cache()'d and cheap.
    getAchievementSummary(userId),
    getLearnerRank(userId),
  ]);

  if (competencies.length === 0 && exposure.vocabularyCount === 0) {
    return (
      <EmptyState
        headingLevel="h1"
        title={messages.title}
        description={messages.emptyDescription}
      />
    );
  }

  // Inline "Strong"/"Focus area" tags on the one Competencies list instead
  // of two more full CompetencyList cards re-rendering the same scores
  // sorted differently (2026-08-21, user feedback) - the old Strengths/
  // Priorities sections could show 100% the same rows already visible
  // above with nothing but a different heading. Only tag once there are
  // enough competencies for "top 2" and "bottom 2" to be genuinely
  // distinct groups (below 4, the two sets overlap - e.g. with 3 items
  // sorted [A,B,C], strengths=[A,B] and priorities=[C,B] both claim B).
  const strengthNames =
    competencies.length >= 4
      ? new Set(
          [...competencies]
            .sort((a, b) => b.weightedScore - a.weightedScore)
            .slice(0, 2)
            .map((c) => c.name),
        )
      : undefined;
  const priorityNames =
    competencies.length >= 4
      ? new Set(
          [...competencies]
            .sort((a, b) => a.weightedScore - b.weightedScore)
            .slice(0, 2)
            .map((c) => c.name),
        )
      : undefined;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <PageTitle>{messages.title}</PageTitle>
        {level && (
          <Body className="text-text-secondary">
            {formatMessage(messages.startingLevel, {
              level:
                dictionary.dashboard.levels[
                  level.startingLevelLabel as keyof typeof dictionary.dashboard.levels
                ] ?? level.startingLevelLabel,
            })}
          </Body>
        )}
      </div>

      {/* Scorecard pattern (design_system.md), matching the Dashboard's
          General Level tile exactly instead of a separately-styled bordered
          Card - same number, same source, same container everywhere it
          appears. Number uses text-text-primary, not a colored -300 shade
          (see the Dashboard fix above) - no fixed primary/secondary/accent
          shade clears WCAG AA against bg-elevated in both themes at once. */}
      <div className="flex flex-col gap-3 rounded-panel border-none bg-elevated p-5 shadow-none">
        <Caption className="font-semibold uppercase tracking-wide text-text-muted">
          {messages.generalLevel}
        </Caption>
        <div className="flex items-baseline gap-2">
          <CardTitle className="font-display text-page-title text-text-primary">
            {generalLevel.points.toFixed(0)}
          </CardTitle>
          <Body className="text-text-secondary">
            / {CURRENT_MAX_GENERAL_LEVEL_POINTS} &middot;{" "}
            {generalLevel.levelLabel}
          </Body>
        </div>
        <Caption className="text-text-muted">
          {formatMessage(messages.generalLevelDescription, {
            max: CURRENT_MAX_GENERAL_LEVEL_POINTS,
          })}
        </Caption>
        {generalLevel.learningJourneyAverage !== null && (
          <div className="mt-1 flex items-center justify-between border-t border-border pt-2">
            <Caption>{messages.weightedAverage}</Caption>
            <Body className="font-semibold">
              {generalLevel.learningJourneyAverage}%
            </Body>
          </div>
        )}
      </div>

      {/* Achievements and rank, moved here from the Dashboard (2026-09-20).
          Two compact tiles side by side rather than two more full-width
          sections - they are entry points to their own pages, not content
          in their own right. Rank only renders once the learner is ranked;
          before that it would just say "unranked", which tells them
          nothing they can act on. */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href={localePath(locale, "/achievements")}
          className="group flex flex-col gap-2 rounded-panel border-none bg-elevated p-5 shadow-none transition-colors duration-fast ease-standard hover:bg-elevated/70"
        >
          <div className="flex items-center justify-between gap-2">
            <Caption className="font-semibold uppercase tracking-wide text-text-muted">
              {dictionary.dashboard.achievements.title}
            </Caption>
            <ChevronRight
              className="size-4 shrink-0 text-text-secondary transition-transform duration-fast ease-standard group-hover:translate-x-1"
              aria-hidden="true"
            />
          </div>
          <Body className="text-text-primary">
            {formatMessage(dictionary.dashboard.achievements.unlocked, {
              unlocked: achievements.unlockedCount,
              total: achievements.totalCount,
            })}
          </Body>
          {achievements.recent.length > 0 && (
            <div className="flex items-center gap-2">
              {achievements.recent.map((achievement) => (
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

        {rank && (
          <Link
            href={localePath(locale, "/leaderboard")}
            className="group flex flex-col gap-2 rounded-panel border-none bg-elevated p-5 shadow-none transition-colors duration-fast ease-standard hover:bg-elevated/70"
          >
            <div className="flex items-center justify-between gap-2">
              <Caption className="font-semibold uppercase tracking-wide text-text-muted">
                {dictionary.dashboard.leaderboard.title}
              </Caption>
              <ChevronRight
                className="size-4 shrink-0 text-text-secondary transition-transform duration-fast ease-standard group-hover:translate-x-1"
                aria-hidden="true"
              />
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="size-5 text-accent-300" aria-hidden="true" />
              <Body className="text-text-primary">
                {formatMessage(dictionary.dashboard.leaderboard.rank, {
                  rank: rank.rank,
                  total: rank.totalRanked,
                })}
              </Body>
            </div>
          </Link>
        )}
      </div>

      {continueTarget && (
        <Card className="flex flex-col gap-2">
          <Caption>{messages.recommendedNext}</Caption>
          <Body className="font-medium">{continueTarget.lessonTitle}</Body>
          <Link
            href={localePath(locale, `/lesson/${continueTarget.lessonSlug}`)}
          >
            <Button type="button" className="w-fit">
              {messages.continueLearning}
            </Button>
          </Link>
        </Card>
      )}

      {competencies.length > 0 && (
        <div className="flex flex-col gap-2">
          <SectionTitle>{messages.competencies}</SectionTitle>
          <CompetencyList
            competencies={competencies}
            strengthNames={strengthNames}
            priorityNames={priorityNames}
            messages={dictionary.dashboard.competency}
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <SectionTitle>{messages.vocabularyGrammar}</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col items-center gap-1 rounded-panel bg-secondary-500/15 p-4 text-center">
            <CardTitle className="font-display text-page-title text-text-primary">
              {exposure.vocabularyCount}
            </CardTitle>
            <Caption>{messages.vocabularyEncountered}</Caption>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-panel bg-accent-500/15 p-4 text-center">
            <CardTitle className="font-display text-page-title text-text-primary">
              {exposure.grammarCount}
            </CardTitle>
            <Caption>{messages.grammarEncountered}</Caption>
          </div>
        </div>
      </div>

      {scenarios.length > 0 && (
        <div className="flex flex-col gap-2">
          <SectionTitle>{messages.scenarioMastery}</SectionTitle>
          <ScenarioMasteryList scenarios={scenarios} messages={messages} />
        </div>
      )}

      {reviewQueue.length > 0 && (
        <div className="flex flex-col gap-2">
          <SectionTitle>{messages.review}</SectionTitle>
          <ReviewQueueList
            items={reviewQueue}
            locale={locale}
            messages={dictionary.dashboard.review}
          />
        </div>
      )}
    </div>
  );
}
