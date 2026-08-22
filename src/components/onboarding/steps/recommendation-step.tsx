"use client";

import { useState } from "react";
import { computeInitialRecommendation } from "@/lib/recommendation";
import { completeOnboardingAction } from "@/lib/actions/onboarding";
import { Button } from "@/components/ui/button";
import { InformationBanner } from "@/components/ui/banner";
import { PageTitle, Body, CardTitle } from "@/components/ui/typography";
import type { OnboardingValues } from "@/components/onboarding/types";

export interface RecommendationStepProps {
  values: OnboardingValues;
  onBack: () => void;
}

export function RecommendationStep({
  values,
  onBack,
}: RecommendationStepProps) {
  const [isPending, setIsPending] = useState(false);
  const recommendation = computeInitialRecommendation({
    currentLevel: values.currentLevel as never,
    learningGoals: values.learningGoals,
    skillPriorities: values.skillPriorities,
  });

  const handleStart = async () => {
    setIsPending(true);
    await completeOnboardingAction();
  };

  return (
    <div className="flex flex-col gap-4 text-center">
      <PageTitle>You&apos;re ready to start</PageTitle>

      <InformationBanner variant="info" title="Recommended for you">
        <CardTitle className="mb-1 text-card-title">
          {recommendation.scenarioName}
        </CardTitle>
        <Body className="text-text-secondary">{recommendation.reason}</Body>
      </InformationBanner>

      <div className="flex justify-between gap-3">
        <Button variant="tertiary" onClick={onBack} type="button">
          Back
        </Button>
        <Button onClick={handleStart} loading={isPending} className="flex-1">
          Start learning
        </Button>
      </div>
    </div>
  );
}
