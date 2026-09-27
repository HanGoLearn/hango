"use client";

import { useEffect, useRef } from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Caption } from "@/components/ui/typography";
import { HanAvatar, HanMascot } from "@/components/ui/han-mascot";
import { useTour } from "@/components/tour/tour-provider";
import type { TourStepCopy } from "@/components/tour/tour-steps";
import type { HanPose } from "@/components/ui/han-mascot";
import { cn } from "@/lib/cn";
import { formatMessage } from "@/i18n/format";
import type { AppMessages } from "@/i18n/messages/types";

/**
 * One tour card, in the two layouts the whole tour is built from
 * (2026-09-23): the centred welcome, where Han is the hero and breaks the
 * card's top edge, and the anchored card, where he sits at 44px on the
 * left, aligned with the *first line* of the text rather than centred
 * against the block - centred, he floats at mid-height next to nothing.
 *
 * Han speaks in the first person throughout. He is the product's real
 * differentiator and today nobody meets him until they go looking; saying
 * hello here builds the relationship before the learner ever opens the chat.
 */
export function TourCard({
  copy,
  pose,
  centred,
  messages,
}: {
  copy: TourStepCopy;
  pose: HanPose;
  centred: boolean;
  messages: AppMessages["tour"];
}) {
  const {
    leg,
    stepIndex,
    totalSteps,
    next,
    back,
    skip,
    startSections,
    finishWelcome,
  } = useTour();
  const headingRef = useRef<HTMLParagraphElement>(null);
  const isLastStep = stepIndex === totalSteps - 1;
  // Only the first welcome is the large, two-choice invitation. Other
  // unanchored steps (notably the closing Settings card in the second leg)
  // are centred for placement, but still need the normal Back / Finish
  // controls. Treating every centred card as the welcome made the final
  // 6-of-6 screen say "Show me / Not right now" after the walkthrough had
  // already finished.
  const isOpeningWelcome = leg === "welcome" && stepIndex === 0;
  // The first leg does not end, it branches: keep going through the app, or
  // go and study. Offering both is what stops the walkthrough being either
  // compulsory or invisible.
  const isBranch = leg === "welcome" && isLastStep;

  // Focus moves to the card's own text on every step change, so a keyboard
  // or screen-reader user is reading the new step rather than wherever the
  // previous step's button left them.
  useEffect(() => {
    headingRef.current?.focus();
  }, [stepIndex]);

  /**
   * One segment per step, each `flex-1` so the row spans the card
   * (2026-09-23 fix): as fixed-width dots they bunched into a short cluster
   * on the left with dead space beside them, which read as a stray mark
   * rather than as progress. Stretching them is also the same segmented
   * language the journey hub and the scenario card already use for
   * "how far along am I", so the app says it one way everywhere.
   */
  const progress = (
    <span className="flex items-center gap-2.5" aria-hidden="true">
      <span className="flex min-w-0 flex-1 items-center gap-1">
        {Array.from({ length: totalSteps }).map((_, position) => (
          <span
            key={position}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors duration-fast ease-standard",
              position === stepIndex
                ? "bg-primary-500"
                : position < stepIndex
                  ? "bg-primary-500/45"
                  : "bg-text-muted/30",
            )}
          />
        ))}
      </span>
      <Caption className="shrink-0 text-text-muted">
        {formatMessage(messages.common.progress, {
          current: stepIndex + 1,
          total: totalSteps,
        })}
      </Caption>
    </span>
  );

  if (centred && isOpeningWelcome) {
    return (
      <div className="flex flex-col items-center rounded-panel border border-primary-500/35 bg-surface px-5 pb-5 shadow-modal">
        {/* Breaks the top edge rather than sitting inside it - this is the
            one moment Han is the subject, not the narrator. */}
        <HanMascot pose={pose} size={186} className="-mt-9" />

        {copy.eyebrow && (
          <Caption className="-mt-1.5 font-semibold uppercase tracking-[0.1em] text-accent-300">
            {copy.eyebrow}
          </Caption>
        )}

        {copy.title && (
          <p
            ref={headingRef}
            tabIndex={-1}
            className="mt-2 text-center font-display text-page-title leading-tight font-semibold text-text-primary outline-none"
          >
            {copy.title}
          </p>
        )}

        <p className="mt-2.5 text-center font-interface text-body text-text-secondary">
          {copy.body}
        </p>

        <span className="mt-4 w-full">{progress}</span>

        <Button type="button" size="lg" className="mt-4 w-full" onClick={next}>
          {messages.common.start}
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>

        <Button
          type="button"
          variant="tertiary"
          className="mt-2"
          onClick={skip}
        >
          {messages.common.notNow}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-panel border border-border-strong bg-surface p-4 shadow-modal">
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-500/15">
          <HanAvatar pose={pose} size={44} />
        </span>
        <div className="flex min-w-0 flex-col gap-1.5">
          {copy.eyebrow && (
            <Caption className="font-semibold uppercase tracking-[0.1em] text-accent-300">
              {copy.eyebrow}
            </Caption>
          )}
          <p
            ref={headingRef}
            tabIndex={-1}
            className="font-interface text-supporting leading-relaxed text-text-primary outline-none"
          >
            {copy.body}
          </p>
        </div>
      </div>

      <span className="mt-4 w-full">{progress}</span>

      {isBranch ? (
        <>
          <Button type="button" className="mt-3.5" onClick={startSections}>
            {messages.common.showTheRest}
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="mt-2"
            onClick={finishWelcome}
          >
            {messages.common.finish}
          </Button>
          {/* Takes away the sense that declining loses something. */}
          <Caption className="mt-2.5 self-center text-text-muted">
            {messages.common.laterFromSettings}
          </Caption>
        </>
      ) : (
        <>
          <span className="mt-3.5 flex items-center gap-2.5">
            <Button
              type="button"
              variant="secondary"
              onClick={back}
              disabled={stepIndex === 0}
            >
              {messages.common.back}
            </Button>
            <Button type="button" className="flex-1" onClick={next}>
              {isLastStep ? messages.common.finish : messages.common.next}
              {!isLastStep && (
                <ChevronRight className="size-4" aria-hidden="true" />
              )}
            </Button>
          </span>

          <Button
            type="button"
            variant="tertiary"
            className="mt-2 self-center"
            onClick={skip}
          >
            {messages.common.skip}
          </Button>
        </>
      )}
    </div>
  );
}
