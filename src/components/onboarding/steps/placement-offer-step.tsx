"use client";

import { useState } from "react";
import { startPlacementExamAction } from "@/lib/actions/placement-exam";
import { acknowledgePlacementOfferAction } from "@/lib/actions/onboarding";
import { PlacementExamHome } from "@/components/placement/placement-exam-home";
import type { PlacementQuestionView } from "@/lib/placement-exam-data";
import { Button } from "@/components/ui/button";
import { InformationBanner } from "@/components/ui/banner";
import { SectionTitle, Body } from "@/components/ui/typography";
import type { AppLocale } from "@/i18n/config";
import type { OnboardingMessages } from "@/i18n/messages/types";

export interface PlacementOfferStepProps {
  onNext: () => void;
  onBack: () => void;
  locale: AppLocale;
  messages: OnboardingMessages["placementOffer"];
  examMessages: OnboardingMessages["placementExam"];
  commonMessages: OnboardingMessages["common"];
}

/**
 * One-time placement-exam offer (2026-08-24 request), replacing the old
 * "AI Preferences" step in the onboarding order. Skipping or starting the
 * exam both mark placementExamOfferAcknowledgedAt (via
 * acknowledgePlacementOfferAction) so resolveResumeStep never shows this
 * again - "como unica vez". The exam itself runs inline via
 * PlacementExamHome (same component the standalone /placement-exam page
 * uses) rather than navigating away, since (app)'s layout would otherwise
 * redirect an onboarding-incomplete learner straight back here.
 */
export function PlacementOfferStep({
  onNext,
  onBack,
  locale,
  messages,
  examMessages,
  commonMessages,
}: PlacementOfferStepProps) {
  const [exam, setExam] = useState<{
    sessionId: string;
    question: PlacementQuestionView | null;
  } | null>(null);
  const [starting, setStarting] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    setStarting(true);
    setError(null);
    const result = await startPlacementExamAction();
    setStarting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    await acknowledgePlacementOfferAction(locale);
    setExam({
      sessionId: result.value.sessionId,
      question: result.value.question,
    });
  }

  async function handleSkip() {
    setSkipping(true);
    await acknowledgePlacementOfferAction(locale);
    setSkipping(false);
    onNext();
  }

  if (exam) {
    return (
      <PlacementExamHome
        locale={locale}
        messages={examMessages}
        sessionId={exam.sessionId}
        initialQuestion={exam.question}
        footer={
          <Button type="button" onClick={onNext} className="self-start">
            {commonMessages.continue}
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 text-center">
      <SectionTitle>{messages.title}</SectionTitle>
      <Body className="text-text-secondary">{messages.description}</Body>

      {error && <InformationBanner variant="error">{error}</InformationBanner>}

      <div className="flex justify-between gap-3">
        <Button variant="tertiary" onClick={onBack} type="button">
          {commonMessages.back}
        </Button>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={handleSkip}
            loading={skipping}
            type="button"
          >
            {messages.skip}
          </Button>
          <Button
            size="lg"
            onClick={handleStart}
            loading={starting}
            type="button"
          >
            {messages.takeExam}
          </Button>
        </div>
      </div>
    </div>
  );
}
