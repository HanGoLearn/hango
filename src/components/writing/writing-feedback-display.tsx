import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  Body,
  Caption,
  CardTitle,
  ChineseText,
} from "@/components/ui/typography";
import type { WritingFeedback } from "@/lib/writing-feedback";

// DESIGN_TASKS.md Phase 6, Option A: each dimension gets its own color,
// same treatment as SpeakingFeedbackDisplay's scorecard.
const DIMENSIONS: {
  key: keyof WritingFeedback;
  label: string;
  indicatorClassName: string;
}[] = [
  { key: "grammar", label: "Grammar", indicatorClassName: "bg-primary-500" },
  {
    key: "vocabulary",
    label: "Vocabulary",
    indicatorClassName: "bg-secondary-500",
  },
  {
    key: "naturalness",
    label: "Naturalness",
    indicatorClassName: "bg-accent-500",
  },
  {
    key: "communicationClarity",
    label: "Communication clarity",
    indicatorClassName: "bg-info-500",
  },
];

export function WritingFeedbackDisplay({
  original,
  feedback,
}: {
  original: string;
  feedback: WritingFeedback;
}) {
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Caption>Your response</Caption>
        <ChineseText>{original}</ChineseText>
      </div>

      {feedback.correctedVersion && (
        <div className="flex flex-col gap-1">
          <Caption>Corrected version</Caption>
          <ChineseText>{feedback.correctedVersion}</ChineseText>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {DIMENSIONS.map(({ key, label, indicatorClassName }) => (
          <ProgressBar
            key={key}
            value={feedback[key] as number}
            label={label}
            className="h-3"
            indicatorClassName={indicatorClassName}
          />
        ))}
      </div>

      {feedback.importantChanges.length > 0 && (
        <div className="flex flex-col gap-1">
          <CardTitle className="text-body">Important changes</CardTitle>
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
        <Caption>Notes</Caption>
        <Body>{feedback.overallNotes}</Body>
      </div>
    </Card>
  );
}
