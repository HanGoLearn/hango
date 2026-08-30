import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { ProgressBar } from "@/components/ui/progress-bar";
import { CardTitle } from "@/components/ui/typography";
import { cn } from "@/lib/cn";
import type { CompetencyProgressSummary } from "@/lib/progress-data";

const STAGE_LABELS: Record<string, string> = {
  EXPOSURE: "Exposure",
  PRACTICE: "Practicing",
  FUNCTIONAL: "Developing",
  CONFIDENT: "Confident",
  MASTERY: "Mastered",
};

const NAME_LABELS: Record<string, string> = {
  LISTENING: "Listening",
  SPEAKING: "Speaking",
  READING: "Reading",
  WRITING: "Writing",
  DAILY_COMMUNICATION: "Daily Communication",
  SOCIAL_COMMUNICATION: "Social Communication",
  TRAVEL_COMMUNICATION: "Travel Communication",
  PROFESSIONAL_COMMUNICATION: "Professional Communication",
  ACADEMIC_COMMUNICATION: "Academic Communication",
};

// DESIGN_TASKS.md Phase 7, Option A: cycle through the same "scorecard"
// palette as the Phase 6 feedback dimensions, instead of every bar being
// an identical primary-500. Cyclical (not a fixed per-competency mapping)
// since the list length varies (all competencies vs. a 2-item strengths/
// priorities slice).
const BAR_COLORS = [
  "bg-primary-500",
  "bg-secondary-500",
  "bg-accent-500",
  "bg-info-500",
  "bg-success-500",
];

export function CompetencyList({
  competencies,
  className,
  strengthNames,
  priorityNames,
}: {
  competencies: CompetencyProgressSummary[];
  /** Optional override for the wrapping Card - e.g. Dashboard's sidebar "scorecard" treatment (rounded-panel/bg-elevated instead of the default bordered card). */
  className?: string;
  /**
   * Names to tag "Strong"/"Focus area" inline (2026-08-21, Progress page) -
   * replaces the old separate Strengths/Priorities CompetencyList cards,
   * which could re-render up to 100% of the same rows already visible in
   * the full list above them, just re-sorted under a different heading.
   */
  strengthNames?: ReadonlySet<string>;
  priorityNames?: ReadonlySet<string>;
}) {
  return (
    <Card className={cn("flex flex-col gap-3", className)}>
      {competencies.map((competency, index) => (
        <div key={competency.name} className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-body">
              {NAME_LABELS[competency.name] ?? competency.name}
            </CardTitle>
            {strengthNames?.has(competency.name) && (
              <Chip tone="secondary" variant="solid" size="sm" className="shrink-0">
                Strong
              </Chip>
            )}
            {priorityNames?.has(competency.name) && (
              <Chip tone="accent" variant="solid" size="sm" className="shrink-0">
                Focus area
              </Chip>
            )}
          </div>
          <ProgressBar
            value={Math.round(competency.weightedScore * 100)}
            label={STAGE_LABELS[competency.stage]}
            className="h-3"
            indicatorClassName={BAR_COLORS[index % BAR_COLORS.length]}
          />
        </div>
      ))}
    </Card>
  );
}
