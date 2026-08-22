import { auth } from "@/lib/auth";
import { PageTitle, Body } from "@/components/ui/typography";
import { EmptyState } from "@/components/ui/states";
import { JourneyChapters } from "@/components/learning-journey/journey-chapters";
import { getScenariosWithProgress } from "@/lib/content/learning-journey-data";

export default async function LearningJourneyPage() {
  const session = await auth();
  const scenarios = await getScenariosWithProgress(session!.user!.id!);

  if (scenarios.length === 0) {
    return (
      <EmptyState
        headingLevel="h1"
        title="Learning Journey"
        description="Scenarios like Restaurant, Hotel, and Shopping will appear here once the curriculum content is available."
      />
    );
  }

  const cardScenarios = scenarios.map((scenario) => ({
    slug: scenario.slug,
    domainSlug: scenario.domain.slug,
    name: scenario.name,
    domainName: scenario.domain.name,
    description: scenario.description,
    difficultyLevels: scenario.levels.map((level) => level.difficulty),
    totalLessons: scenario.totalLessons,
    completedLessons: scenario.completedLessons,
    status: scenario.status,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <PageTitle>Learning Journey</PageTitle>
        <Body className="text-text-secondary">
          Pick a real-world scenario and work through its lessons.
        </Body>
      </div>

      <JourneyChapters scenarios={cardScenarios} />
    </div>
  );
}
