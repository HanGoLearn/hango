import { Award } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { CardTitle } from "@/components/ui/typography";
import type { ScenarioMasterySummary } from "@/lib/progress-data";

export function ScenarioMasteryList({
  scenarios,
}: {
  scenarios: ScenarioMasterySummary[];
}) {
  return (
    <div className="flex flex-col gap-2">
      {scenarios.map((scenario) => (
        <Card key={scenario.slug} className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <CardTitle>{scenario.name}</CardTitle>
            {scenario.mastered && (
              // The earlier fix here (Phase 3, text-primary-600 -> text-neutral-0)
              // landed on the exact anti-pattern design_system.md's on-color-token
              // rule warns about: neutral-0/900 invert between themes, but this
              // accent-500->primary-500 gradient doesn't - text-neutral-0 reads
              // fine in dark (white-on-color) but breaks in light (near-black
              // #13100c on a still-bright gradient). text-on-color-light is the
              // fixed, theme-invariant token this gradient actually needs -
              // lesson-path.tsx's identical gradient already uses it correctly.
              <div className="flex items-center gap-1 rounded-full bg-linear-to-br from-accent-500 to-primary-500 px-2.5 py-1 text-on-color-light">
                <Award className="size-3.5" aria-hidden="true" />
                <span className="font-interface text-caption font-semibold">
                  Mastered
                </span>
              </div>
            )}
          </div>
          <ProgressBar
            value={scenario.completionPercent}
            label={`${scenario.completionPercent}% complete`}
            className="h-3"
            indicatorClassName="bg-secondary-500"
          />
        </Card>
      ))}
    </div>
  );
}
