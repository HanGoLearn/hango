import { SectionTitle } from "@/components/ui/typography";
import { EmptyState } from "@/components/ui/states";
import { MissionRuntime } from "@/components/mission/mission-runtime";
import type { LessonWithContent } from "@/lib/content/lesson-data";

/** Real interactive mission (12.1), not a placeholder - reuses the same runtime as the Scenario Detail page's final mission. */
export function MissionStep({
  mission,
  onContinue,
}: {
  mission: LessonWithContent["mission"];
  onContinue: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <SectionTitle>Mission</SectionTitle>

      {mission ? (
        <MissionRuntime
          mission={{
            id: mission.id,
            title: mission.title,
            context: mission.context,
            objective: mission.objective,
            learnerRole: mission.learnerRole,
            aiRole: mission.aiRole,
            successConditions: mission.successConditions.map(
              (condition) => condition.description,
            ),
          }}
          onDone={onContinue}
        />
      ) : (
        <EmptyState
          title="No mission yet"
          description="This lesson doesn't have a mission."
          action={{ label: "Continue", onClick: onContinue }}
        />
      )}
    </div>
  );
}
