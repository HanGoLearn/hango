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
import { CURRENT_MAX_GENERAL_LEVEL_POINTS } from "@/lib/points-system";

export default async function ProgressPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const [
    competencies,
    exposure,
    level,
    generalLevel,
    scenarios,
    continueTarget,
    reviewQueue,
  ] = await Promise.all([
    getCompetencyProgress(userId),
    getVocabularyGrammarExposure(userId),
    getEstimatedLevel(userId),
    getGeneralLevelSummary(userId),
    getScenarioMastery(userId),
    getContinueLearningTarget(userId),
    getReviewQueue(userId),
  ]);

  if (competencies.length === 0 && exposure.vocabularyCount === 0) {
    return (
      <EmptyState
        headingLevel="h1"
        title="Progress"
        description="Complete your first lesson to begin building your competency profile."
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
        <PageTitle>Progress</PageTitle>
        {level && (
          <Body className="text-text-secondary">
            Starting level selected: {level.hskLabel}
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
          General Level
        </Caption>
        <div className="flex items-baseline gap-2">
          <CardTitle className="font-display text-page-title text-text-primary">
            {generalLevel.points.toFixed(0)}
          </CardTitle>
          <Body className="text-text-secondary">
            / {CURRENT_MAX_GENERAL_LEVEL_POINTS} &middot; {generalLevel.hskLevel}
          </Body>
        </div>
        <Caption className="text-text-muted">
          Earned from completed scenarios and Lab practice, not
          self-reported — this is what Han actually adapts to. The max is{" "}
          {CURRENT_MAX_GENERAL_LEVEL_POINTS}, not 2000, until Reading Lab
          launches.
        </Caption>
        {generalLevel.learningJourneyAverage !== null && (
          <div className="mt-1 flex items-center justify-between border-t border-border pt-2">
            <Caption>Learning Journey weighted average</Caption>
            <Body className="font-semibold">
              {generalLevel.learningJourneyAverage}%
            </Body>
          </div>
        )}
      </div>

      {continueTarget && (
        <Card className="flex flex-col gap-2">
          <Caption>Recommended next step</Caption>
          <Body className="font-medium">{continueTarget.lessonTitle}</Body>
          <Link href={`/lesson/${continueTarget.lessonSlug}`}>
            <Button type="button" className="w-fit">
              Continue Learning
            </Button>
          </Link>
        </Card>
      )}

      {competencies.length > 0 && (
        <div className="flex flex-col gap-2">
          <SectionTitle>Competencies</SectionTitle>
          <CompetencyList
            competencies={competencies}
            strengthNames={strengthNames}
            priorityNames={priorityNames}
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <SectionTitle>Vocabulary and Grammar</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col items-center gap-1 rounded-panel bg-secondary-500/15 p-4 text-center">
            <CardTitle className="font-display text-page-title text-text-primary">
              {exposure.vocabularyCount}
            </CardTitle>
            <Caption>Vocabulary items encountered</Caption>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-panel bg-accent-500/15 p-4 text-center">
            <CardTitle className="font-display text-page-title text-text-primary">
              {exposure.grammarCount}
            </CardTitle>
            <Caption>Grammar points encountered</Caption>
          </div>
        </div>
      </div>

      {scenarios.length > 0 && (
        <div className="flex flex-col gap-2">
          <SectionTitle>Scenario Mastery</SectionTitle>
          <ScenarioMasteryList scenarios={scenarios} />
        </div>
      )}

      {reviewQueue.length > 0 && (
        <div className="flex flex-col gap-2">
          <SectionTitle>Review</SectionTitle>
          <ReviewQueueList items={reviewQueue} />
        </div>
      )}
    </div>
  );
}
