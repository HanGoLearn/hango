import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  Body,
  Caption,
  CardTitle,
  ChineseText,
} from "@/components/ui/typography";
import type { WritingFeedback } from "@/lib/writing-feedback";
import type { WritingLabMessages } from "@/i18n/messages/types";

// DESIGN_TASKS.md Phase 6, Option A: each dimension gets its own color,
// same treatment as SpeakingFeedbackDisplay's scorecard.
const DIMENSIONS: {
  key: keyof WritingLabMessages["feedback"]["dimensions"];
  indicatorClassName: string;
}[] = [
  { key: "grammar", indicatorClassName: "bg-primary-500" },
  {
    key: "vocabulary",
    indicatorClassName: "bg-secondary-500",
  },
  {
    key: "naturalness",
    indicatorClassName: "bg-accent-500",
  },
  {
    key: "communicationClarity",
    indicatorClassName: "bg-info-500",
  },
];

export function WritingFeedbackDisplay({
  original,
  feedback,
  messages,
}: {
  original: string;
  feedback: WritingFeedback;
  messages: WritingLabMessages["feedback"];
}) {
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Caption>{messages.yourResponse}</Caption>
        <ChineseText>{original}</ChineseText>
      </div>

      {feedback.correctedVersion && (
        <div className="flex flex-col gap-1">
          <Caption>{messages.correctedVersion}</Caption>
          <ChineseText>{feedback.correctedVersion}</ChineseText>
        </div>
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

      {feedback.importantChanges.length > 0 && (
        <div className="flex flex-col gap-1">
          <CardTitle className="text-body">
            {messages.importantChanges}
          </CardTitle>
          <ul className="flex flex-col gap-1">
            {feedback.importantChanges.map((change) => (
              <li key={change}>
                <Body className="text-text-secondary">{change}</Body>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <Caption>{messages.notes}</Caption>
        <Body>{feedback.overallNotes}</Body>
      </div>
    </Card>
  );
}
