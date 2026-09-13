import { Check, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Body, Caption, CardTitle } from "@/components/ui/typography";
import type { MissionReport } from "@/lib/mission-evaluation";
import { useLessonMessages } from "@/components/lesson/lesson-messages";

// DESIGN_TASKS.md Phase 8 (consistency pass): same colored-dimension
// scorecard as SpeakingFeedbackDisplay/WritingFeedbackDisplay (Phase 6/7)
// — this component has the identical DIMENSIONS-array pattern but was
// missed when that treatment was first applied.
type MissionDimensionKey =
  | "communicationSuccess"
  | "taskCompletion"
  | "vocabularyUsage"
  | "grammarUsage"
  | "clarity";

const DIMENSIONS: {
  key: MissionDimensionKey;
  indicatorClassName: string;
}[] = [
  {
    key: "communicationSuccess",
    indicatorClassName: "bg-primary-500",
  },
  {
    key: "taskCompletion",
    indicatorClassName: "bg-secondary-500",
  },
  {
    key: "vocabularyUsage",
    indicatorClassName: "bg-accent-500",
  },
  {
    key: "grammarUsage",
    indicatorClassName: "bg-info-500",
  },
  { key: "clarity", indicatorClassName: "bg-success-500" },
];

export function MissionReportDisplay({ report }: { report: MissionReport }) {
  const messages = useLessonMessages();
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {DIMENSIONS.map(({ key, indicatorClassName }) => (
          <ProgressBar
            key={key}
            value={report[key] as number}
            label={messages.mission.reportDimensions[key]}
            className="h-3"
            indicatorClassName={indicatorClassName}
          />
        ))}
      </div>

      {report.successConditions.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <CardTitle className="text-body">
            {messages.mission.successConditions}
          </CardTitle>
          <ul className="flex flex-col gap-1.5">
            {report.successConditions.map((condition) => (
              <li
                key={condition.description}
                className="flex items-start gap-2"
              >
                {condition.met ? (
                  <Check
                    className="mt-0.5 size-4 shrink-0 text-success-500"
                    aria-hidden="true"
                  />
                ) : (
                  <X
                    className="mt-0.5 size-4 shrink-0 text-error-500"
                    aria-hidden="true"
                  />
                )}
                <Body>{condition.description}</Body>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <Caption>{messages.mission.notes}</Caption>
        <Body>{report.overallNotes}</Body>
      </div>

      <div className="flex flex-col gap-1">
        <Caption>{messages.mission.recommendedNextStep}</Caption>
        <Body>{report.recommendedNextStep}</Body>
      </div>
    </Card>
  );
}
