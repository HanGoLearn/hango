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
import { isAppLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export default async function ScenarioDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isAppLocale(locale)) return null;
  const session = await auth();
  const [scenario, dictionary] = await Promise.all([
    getScenarioDetailWithProgress(slug, session!.user!.id!, locale),
    getDictionary(locale),
  ]);

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
          <SectionTitle>
            {dictionary.learningJourney.detail.outcomes}
          </SectionTitle>
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
            {dictionary.learningJourney.detail.difficulty[
              level.difficulty as keyof typeof dictionary.learningJourney.detail.difficulty
            ] ?? level.difficulty}
          </SectionTitle>
          <LessonPath
            locale={locale}
            lessons={level.lessons}
            messages={dictionary.learningJourney.lessonPath}
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
          <SectionTitle>
            {dictionary.learningJourney.detail.finalMission}
          </SectionTitle>
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
