"use client";

import { useState } from "react";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  STEP_ORDER,
  type OnboardingStep,
  type OnboardingValues,
} from "@/components/onboarding/types";
import { WelcomeStep } from "@/components/onboarding/steps/welcome-step";
import { ProfileStep } from "@/components/onboarding/steps/profile-step";
import { AvatarStep } from "@/components/onboarding/steps/avatar-step";
import { GoalStep } from "@/components/onboarding/steps/goal-step";
import { LevelStep } from "@/components/onboarding/steps/level-step";
import { ExplanationLanguageStep } from "@/components/onboarding/steps/explanation-language-step";
import { SkillsStep } from "@/components/onboarding/steps/skills-step";
import { DailyTargetStep } from "@/components/onboarding/steps/daily-target-step";
import { PlacementOfferStep } from "@/components/onboarding/steps/placement-offer-step";
import { RecommendationStep } from "@/components/onboarding/steps/recommendation-step";
import type { AppLocale } from "@/i18n/config";
import type { OnboardingMessages } from "@/i18n/messages/types";

export interface OnboardingWizardProps {
  initialStep: OnboardingStep;
  initialValues: OnboardingValues;
  locale: AppLocale;
  messages: OnboardingMessages;
}

export function OnboardingWizard({
  initialStep,
  initialValues,
  locale,
  messages,
}: OnboardingWizardProps) {
  const [step, setStep] = useState<OnboardingStep>(initialStep);
  const [values, setValues] = useState<OnboardingValues>(initialValues);

  const stepIndex = STEP_ORDER.indexOf(step);
  const goNext = (patch: Partial<OnboardingValues> = {}) => {
    setValues((prev) => ({ ...prev, ...patch }));
    const nextIndex = Math.min(stepIndex + 1, STEP_ORDER.length - 1);
    setStep(STEP_ORDER[nextIndex]!);
  };
  const goBack = () => {
    const prevIndex = Math.max(stepIndex - 1, 0);
    setStep(STEP_ORDER[prevIndex]!);
  };

  return (
    <div className="flex flex-col gap-6">
      {step !== "welcome" && (
        <ProgressBar
          value={(stepIndex / (STEP_ORDER.length - 1)) * 100}
          label={`${messages.progress.step} ${stepIndex} ${messages.progress.of} ${STEP_ORDER.length - 1}`}
        />
      )}

      {step === "welcome" && (
        <WelcomeStep messages={messages.welcome} onNext={() => goNext()} />
      )}
      {step === "profile" && (
        <ProfileStep
          initialDisplayName={values.displayName}
          initialNickname={values.nickname}
          onNext={({ displayName, nickname }) =>
            goNext({ displayName, nickname })
          }
          onBack={goBack}
          locale={locale}
          messages={messages.profile}
          commonMessages={messages.common}
        />
      )}
      {step === "avatar" && (
        <AvatarStep
          initialAnimal={values.avatarAnimal}
          onNext={(avatarAnimal) => goNext({ avatarAnimal })}
          onBack={goBack}
          locale={locale}
          messages={messages.avatar}
          commonMessages={messages.common}
        />
      )}
      {step === "goal" && (
        <GoalStep
          initialValue={values.learningGoals}
          onNext={(learningGoals) => goNext({ learningGoals })}
          onBack={goBack}
          locale={locale}
          messages={messages.goal}
          commonMessages={messages.common}
        />
      )}
      {step === "level" && (
        <LevelStep
          initialValue={values.currentLevel}
          onNext={(currentLevel) => goNext({ currentLevel })}
          onBack={goBack}
          locale={locale}
          messages={messages.level}
          commonMessages={messages.common}
        />
      )}
      {step === "explanation-language" && (
        <ExplanationLanguageStep
          initialValue={values.explanationLanguage}
          onNext={(explanationLanguage) => goNext({ explanationLanguage })}
          onBack={goBack}
          locale={locale}
          messages={messages.explanationLanguage}
          commonMessages={messages.common}
        />
      )}
      {step === "skills" && (
        <SkillsStep
          initialValue={values.skillPriorities}
          onNext={(skillPriorities) => goNext({ skillPriorities })}
          onBack={goBack}
          locale={locale}
          messages={messages.skills}
          commonMessages={messages.common}
        />
      )}
      {step === "daily-target" && (
        <DailyTargetStep
          initialValue={values.dailyStudyTargetMinutes}
          onNext={(dailyStudyTargetMinutes) =>
            goNext({ dailyStudyTargetMinutes })
          }
          onBack={goBack}
          locale={locale}
          messages={messages.dailyTarget}
          commonMessages={messages.common}
        />
      )}
      {step === "placement-offer" && (
        <PlacementOfferStep
          locale={locale}
          messages={messages.placementOffer}
          examMessages={messages.placementExam}
          commonMessages={messages.common}
          onNext={() => goNext()}
          onBack={goBack}
        />
      )}
      {step === "recommendation" && (
        <RecommendationStep
          locale={locale}
          messages={messages.recommendation}
          commonMessages={messages.common}
          values={values}
          onBack={goBack}
        />
      )}
    </div>
  );
}
