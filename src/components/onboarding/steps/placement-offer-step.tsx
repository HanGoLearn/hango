"use client";

import { useState } from "react";
import { startPlacementExamAction } from "@/lib/actions/placement-exam";
import { acknowledgePlacementOfferAction } from "@/lib/actions/onboarding";
import { PlacementExamHome } from "@/components/placement/placement-exam-home";
import type { PlacementQuestionView } from "@/lib/placement-exam-data";
import { Button } from "@/components/ui/button";
import { InformationBanner } from "@/components/ui/banner";
import { SectionTitle, Body } from "@/components/ui/typography";

export interface PlacementOfferStepProps {
  onNext: () => void;
  onBack: () => void;
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
export function PlacementOfferStep({ onNext, onBack }: PlacementOfferStepProps) {
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
    await acknowledgePlacementOfferAction();
    setExam({ sessionId: result.value.sessionId, question: result.value.question });
  }

  async function handleSkip() {
    setSkipping(true);
    await acknowledgePlacementOfferAction();
    setSkipping(false);
    onNext();
  }

  if (exam) {
    return (
      <PlacementExamHome
        sessionId={exam.sessionId}
        initialQuestion={exam.question}
        footer={
          <Button type="button" onClick={onNext} className="self-start">
            Continue
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 text-center">
      <SectionTitle>Want a more precise starting point?</SectionTitle>
      <Body className="text-text-secondary">
        Take a quick placement exam across Vocabulary, Grammar, Reading,
        Listening, and Speaking - about 10-15 minutes. Every lesson at or
        below your real level gets credited with General Level points
        automatically, marked with a badge so you can still redo any of
        them for real, anytime.
      </Body>

      {error && <InformationBanner variant="error">{error}</InformationBanner>}

      <div className="flex justify-between gap-3">
        <Button variant="tertiary" onClick={onBack} type="button">
          Back
        </Button>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={handleSkip}
            loading={skipping}
            type="button"
          >
            Skip for now
          </Button>
          <Button size="lg" onClick={handleStart} loading={starting} type="button">
            Take the placement exam
          </Button>
        </div>
      </div>
    </div>
  );
}
