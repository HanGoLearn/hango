import { auth } from "@/lib/auth";
import { PageTitle, Body } from "@/components/ui/typography";
import { EmptyState } from "@/components/ui/states";
import { JourneyChapters } from "@/components/learning-journey/journey-chapters";
import { getScenariosWithProgress } from "@/lib/content/learning-journey-data";
import { isAppLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export default async function LearningJourneyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isAppLocale(localeParam)) return null;
  const session = await auth();
  const [scenarios, dictionary] = await Promise.all([
    getScenariosWithProgress(session!.user!.id!, localeParam),
    getDictionary(localeParam),
  ]);
  const messages = dictionary.learningJourney;

  if (scenarios.length === 0) {
    return (
      <EmptyState
        headingLevel="h1"
        title={messages.title}
        description={messages.emptyDescription}
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
        <PageTitle>{messages.title}</PageTitle>
        <Body className="text-text-secondary">{messages.description}</Body>
      </div>

      <JourneyChapters
        scenarios={cardScenarios}
        locale={localeParam}
        messages={messages}
      />
    </div>
  );
}
