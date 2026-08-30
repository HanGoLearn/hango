"use client";

import { useEffect, useState } from "react";
import {
  getRecommendationAction,
  completeOnboardingAction,
} from "@/lib/actions/onboarding";
import { Button } from "@/components/ui/button";
import { InformationBanner } from "@/components/ui/banner";
import {
  PageTitle,
  SectionTitle,
  Body,
  Caption,
  CardTitle,
} from "@/components/ui/typography";
import { Loader2 } from "lucide-react";
import type { OnboardingValues } from "@/components/onboarding/types";
import type { Recommendation } from "@/lib/recommendation";

export interface RecommendationStepProps {
  values: OnboardingValues;
  onBack: () => void;
}

export function RecommendationStep({
  values,
  onBack,
}: RecommendationStepProps) {
  const [isPending, setIsPending] = useState(false);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    void getRecommendationAction(
      values.currentLevel as never,
      values.learningGoals,
      values.skillPriorities,
    ).then((result) => {
      if (!cancelled) setRecommendation(result);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStart = async () => {
    setIsPending(true);
    await completeOnboardingAction();
  };

  if (!recommendation) {
    return (
      <div className="flex min-h-60 flex-col items-center justify-center gap-3 text-center">
        <Loader2 className="size-8 animate-spin text-primary-500" aria-hidden="true" />
        <Body className="text-text-secondary">Finding your starting point...</Body>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 text-center">
      <PageTitle>You&apos;re ready to start</PageTitle>

      {recommendation.primary ? (
        <InformationBanner variant="info" title="Recommended for you">
          <CardTitle className="mb-1 text-card-title">
            {recommendation.primary.scenarioName}
          </CardTitle>
          <Body className="text-text-secondary">{recommendation.reason}</Body>
        </InformationBanner>
      ) : (
        <InformationBanner variant="info">{recommendation.reason}</InformationBanner>
      )}

      {recommendation.goalMatches.length > 0 && (
        <div className="flex flex-col gap-3 text-left">
          <SectionTitle>Sessions that match your goals</SectionTitle>
          {recommendation.goalMatches.map((entry) => (
            <div key={entry.goal} className="flex flex-col gap-1">
              <Caption className="font-semibold text-text-secondary">
                {entry.label}
              </Caption>
              <ul className="flex flex-col gap-0.5">
                {entry.scenarios.map((scenario) => (
                  <li key={scenario.scenarioSlug}>
                    <Body>
                      {scenario.scenarioName}{" "}
                      <span className="text-text-muted">
                        ({scenario.domainName})
                      </span>
                    </Body>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between gap-3">
        <Button variant="tertiary" onClick={onBack} type="button">
          Back
        </Button>
        <Button size="lg" onClick={handleStart} loading={isPending} className="flex-1">
          Start learning
        </Button>
      </div>
    </div>
  );
}
