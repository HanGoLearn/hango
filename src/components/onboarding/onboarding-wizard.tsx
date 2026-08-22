"use client";

import { useState } from "react";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  STEP_ORDER,
  type OnboardingStep,
  type OnboardingValues,
} from "@/components/onboarding/types";
import { WelcomeStep } from "@/components/onboarding/steps/welcome-step";
import { GoalStep } from "@/components/onboarding/steps/goal-step";
import { LevelStep } from "@/components/onboarding/steps/level-step";
import { ExplanationLanguageStep } from "@/components/onboarding/steps/explanation-language-step";
import { SkillsStep } from "@/components/onboarding/steps/skills-step";
import { DailyTargetStep } from "@/components/onboarding/steps/daily-target-step";
import { AiPreferencesStep } from "@/components/onboarding/steps/ai-preferences-step";
import { RecommendationStep } from "@/components/onboarding/steps/recommendation-step";

export interface OnboardingWizardProps {
  initialStep: OnboardingStep;
  initialValues: OnboardingValues;
}

export function OnboardingWizard({
  initialStep,
  initialValues,
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
          label={`Step ${stepIndex} of ${STEP_ORDER.length - 1}`}
        />
      )}

      {step === "welcome" && <WelcomeStep onNext={() => goNext()} />}
      {step === "goal" && (
        <GoalStep
          initialValue={values.learningGoals}
          onNext={(learningGoals) => goNext({ learningGoals })}
          onBack={goBack}
        />
      )}
      {step === "level" && (
        <LevelStep
          initialValue={values.currentLevel}
          onNext={(currentLevel) => goNext({ currentLevel })}
          onBack={goBack}
        />
      )}
      {step === "explanation-language" && (
        <ExplanationLanguageStep
          initialValue={values.explanationLanguage}
          onNext={(explanationLanguage) => goNext({ explanationLanguage })}
          onBack={goBack}
        />
      )}
      {step === "skills" && (
        <SkillsStep
          initialValue={values.skillPriorities}
          onNext={(skillPriorities) => goNext({ skillPriorities })}
          onBack={goBack}
        />
      )}
      {step === "daily-target" && (
        <DailyTargetStep
          initialValue={values.dailyStudyTargetMinutes}
          onNext={(dailyStudyTargetMinutes) =>
            goNext({ dailyStudyTargetMinutes })
          }
          onBack={goBack}
        />
      )}
      {step === "ai-preferences" && (
        <AiPreferencesStep
          initialValue={values.correctionStyle}
          onNext={(correctionStyle) => goNext({ correctionStyle })}
          onBack={goBack}
        />
      )}
      {step === "recommendation" && (
        <RecommendationStep values={values} onBack={goBack} />
      )}
    </div>
  );
}
