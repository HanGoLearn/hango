import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  PageTitle,
  SectionTitle,
  Body,
  Caption,
} from "@/components/ui/typography";
import { LessonPath } from "@/components/learning-journey/lesson-path";
import { ScenarioFinalMission } from "@/components/mission/scenario-final-mission";
import { ScenarioCompletionSummary } from "@/components/learning-journey/scenario-completion-summary";
import { getScenarioDetailWithProgress } from "@/lib/content/learning-journey-data";
import { DIFFICULTY_LABELS } from "@/lib/content/learning-journey";

export default async function ScenarioDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  const scenario = await getScenarioDetailWithProgress(
    slug,
    session!.user!.id!,
  );

  if (!scenario) notFound();

  const finalMission = scenario.missions.find((m) => m.lessonId === null);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <Caption>{scenario.domain.name}</Caption>
        <PageTitle>{scenario.name}</PageTitle>
        {scenario.description && (
          <Body className="text-text-secondary">{scenario.description}</Body>
        )}
      </div>

      {scenario.status === "COMPLETED" && (
        <ScenarioCompletionSummary
          scenarioId={scenario.id}
          scenarioSlug={scenario.slug}
          lessons={scenario.levels.flatMap((level) =>
            level.lessons.map((lesson) => ({
              id: lesson.id,
              title: lesson.title,
              reflectionTotalScore: lesson.reflectionTotalScore,
            })),
          )}
        />
      )}

      {scenario.communicationOutcomes.length > 0 && (
        <div className="flex flex-col gap-2">
          <SectionTitle>What you&apos;ll be able to do</SectionTitle>
          <ul className="flex flex-col gap-1">
            {scenario.communicationOutcomes.map((outcome) => (
              <li key={outcome}>
                <Body>{outcome}</Body>
              </li>
            ))}
          </ul>
        </div>
      )}

      {scenario.levels.map((level, index) => (
        <div key={level.id} className="flex flex-col gap-3">
          <SectionTitle>
            {DIFFICULTY_LABELS[level.difficulty] ?? level.difficulty}
          </SectionTitle>
          <LessonPath
            lessons={level.lessons}
            finalMissionTitle={
              index === scenario.levels.length - 1
                ? finalMission?.title
                : undefined
            }
          />
        </div>
      ))}

      {finalMission && (
        <div className="flex flex-col gap-2">
          <SectionTitle>Final Mission</SectionTitle>
          <ScenarioFinalMission
            mission={{
              id: finalMission.id,
              title: finalMission.title,
              context: finalMission.context,
              objective: finalMission.objective,
              learnerRole: finalMission.learnerRole,
              aiRole: finalMission.aiRole,
              successConditions: finalMission.successConditions.map(
                (condition) => condition.description,
              ),
            }}
          />
        </div>
      )}
    </div>
  );
}
