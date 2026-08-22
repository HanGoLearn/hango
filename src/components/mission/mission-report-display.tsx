import { Check, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Body, Caption, CardTitle } from "@/components/ui/typography";
import type { MissionReport } from "@/lib/mission-evaluation";

// DESIGN_TASKS.md Phase 8 (consistency pass): same colored-dimension
// scorecard as SpeakingFeedbackDisplay/WritingFeedbackDisplay (Phase 6/7)
// — this component has the identical DIMENSIONS-array pattern but was
// missed when that treatment was first applied.
const DIMENSIONS: {
  key: keyof MissionReport;
  label: string;
  indicatorClassName: string;
}[] = [
  {
    key: "communicationSuccess",
    label: "Communication success",
    indicatorClassName: "bg-primary-500",
  },
  {
    key: "taskCompletion",
    label: "Task completion",
    indicatorClassName: "bg-secondary-500",
  },
  {
    key: "vocabularyUsage",
    label: "Vocabulary usage",
    indicatorClassName: "bg-accent-500",
  },
  {
    key: "grammarUsage",
    label: "Grammar usage",
    indicatorClassName: "bg-info-500",
  },
  { key: "clarity", label: "Clarity", indicatorClassName: "bg-success-500" },
];

export function MissionReportDisplay({ report }: { report: MissionReport }) {
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {DIMENSIONS.map(({ key, label, indicatorClassName }) => (
          <ProgressBar
            key={key}
            value={report[key] as number}
            label={label}
            className="h-3"
            indicatorClassName={indicatorClassName}
          />
        ))}
      </div>

      {report.successConditions.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <CardTitle className="text-body">Success conditions</CardTitle>
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
        <Caption>Notes</Caption>
        <Body>{report.overallNotes}</Body>
      </div>

      <div className="flex flex-col gap-1">
        <Caption>Recommended next step</Caption>
        <Body>{report.recommendedNextStep}</Body>
      </div>
    </Card>
  );
}
