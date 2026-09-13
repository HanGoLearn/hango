import { Waves } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Body, Caption, CardTitle } from "@/components/ui/typography";
import type { SpeakingFeedback } from "@/lib/speaking-feedback";
import type { SpeakingLabMessages } from "@/i18n/messages/types";
import { formatMessage } from "@/i18n/format";

// DESIGN_TASKS.md Phase 6, Option A: each dimension gets its own color
// instead of a uniform primary-500 bar, same "colorful scorecard" language
// as the nav badges (Phase 3) and lesson exercises (Phase 5).
type DimensionKey = keyof SpeakingLabMessages["feedback"]["dimensions"];

const DIMENSIONS: {
  key: DimensionKey;
  indicatorClassName: string;
}[] = [
  {
    key: "pronunciation",
    indicatorClassName: "bg-primary-500",
  },
  { key: "fluency", indicatorClassName: "bg-secondary-500" },
  { key: "accuracy", indicatorClassName: "bg-accent-500" },
  {
    key: "complexity",
    indicatorClassName: "bg-info-500",
  },
  {
    key: "communicationEffectiveness",
    indicatorClassName: "bg-success-500",
  },
];

export function SpeakingFeedbackDisplay({
  transcript,
  feedback,
  messages,
}: {
  transcript: string;
  feedback: SpeakingFeedback;
  messages: SpeakingLabMessages["feedback"];
}) {
  return (
    // Scorecard pattern (design_system.md) - border-none/bg-elevated/
    // shadow-none, not the default bordered Card - this is a static
    // results readout, not an interactive element, the same distinction
    // Dashboard's General Level/Competency Summary already draw.
    <Card className="flex flex-col gap-4 rounded-panel border-none bg-elevated p-5 shadow-none">
      <div className="flex flex-col gap-1">
        <Caption>{messages.heard}</Caption>
        <Body className="font-chinese">{transcript || messages.noSpeech}</Body>
      </div>

      {typeof feedback.toneScore === "number" && (
        <div className="flex items-center gap-3 rounded-panel border border-accent-500/30 bg-accent-500/10 p-3">
          {/* text-accent-600 doesn't exist in the palette (only
              50/100/300/500/700 are defined) - was silently inert.
              accent-300 is the step re-tuned per theme specifically for
              direct text/icon use on a page/surface-adjacent background. */}
          <Waves
            className="size-6 shrink-0 text-accent-300"
            aria-hidden="true"
          />
          <div className="flex flex-col gap-0.5">
            <Body className="font-semibold text-text-primary">
              {formatMessage(messages.toneMatch, {
                score: feedback.toneScore,
              })}
            </Body>
            <Caption className="text-text-secondary">
              {messages.toneExplanation}
            </Caption>
          </div>
        </div>
      )}
      {feedback.toneScore === null && (
        <Caption className="text-text-secondary">
          {messages.toneUnavailable}
        </Caption>
      )}

      <div className="flex flex-col gap-2">
        {DIMENSIONS.map(({ key, indicatorClassName }) => (
          <ProgressBar
            key={key}
            value={feedback[key] as number}
            label={messages.dimensions[key]}
            className="h-3"
            indicatorClassName={indicatorClassName}
          />
        ))}
      </div>

      <div className="flex flex-col gap-1">
        <CardTitle className="text-body">{messages.feedback}</CardTitle>
        <Body className="text-text-secondary">{feedback.notes}</Body>
      </div>

      <div className="flex flex-col gap-1">
        <Caption>{messages.recommendedNext}</Caption>
        <Body>{feedback.recommendedNextStep}</Body>
      </div>
    </Card>
  );
}
