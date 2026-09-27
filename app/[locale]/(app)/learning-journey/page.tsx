import { auth } from "@/lib/auth";
import { EmptyState } from "@/components/ui/states";
import {
  JourneyHub,
  type JourneyHubChapter,
  type JourneyHubContinue,
} from "@/components/learning-journey/journey-hub";
import {
  getScenariosWithProgress,
  getContinueLearningTarget,
} from "@/lib/content/learning-journey-data";
import { getAvatarPageData } from "@/lib/avatar-data";
import {
  JOURNEY_CHAPTER_ORDER,
  resolveJourneyChapter,
} from "@/lib/content/learning-journey";
import { isAppLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import {
  getMaximumJourneyChapter,
  isJourneyChapterAccessible,
} from "@/lib/beta-learning-scope";

export default async function LearningJourneyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isAppLocale(localeParam)) return null;
  const session = await auth();
  const userId = session!.user!.id!;
  const maximumChapter = getMaximumJourneyChapter(session!.user!.role);
  const [scenarios, continueTarget, avatar, dictionary] = await Promise.all([
    getScenariosWithProgress(userId, localeParam),
    getContinueLearningTarget(userId, localeParam, maximumChapter),
    getAvatarPageData(userId),
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

  // One row per chapter, counted from the same scenario list the chapter
  // screens read - no second source that could disagree with them.
  const chapters: JourneyHubChapter[] = JOURNEY_CHAPTER_ORDER.map((chapter) => {
    const inChapter = scenarios.filter(
      (scenario) =>
        resolveJourneyChapter(
          scenario.levels.map((level) => level.difficulty),
        ) === chapter,
    );
    return {
      chapter,
      totalScenarios: inChapter.length,
      completedScenarios: inChapter.filter((s) => s.status === "COMPLETED")
        .length,
      isCurrent: false,
      isAccessible: isJourneyChapterAccessible(chapter, session!.user!.role),
    };
  });

  // "Current" is the first chapter still holding an unfinished scenario -
  // the same rule the old stacked view used to mark where the learner is.
  const currentIndex = chapters.findIndex(
    (entry) =>
      entry.isAccessible &&
      entry.totalScenarios > 0 &&
      entry.completedScenarios < entry.totalScenarios,
  );
  if (currentIndex >= 0) chapters[currentIndex]!.isCurrent = true;

  // The continue banner names the scenario, not the lesson: the lesson
  // title alone ("Entrar y pedir") reads as a fragment out of context.
  let hubContinue: JourneyHubContinue | null = null;
  if (continueTarget) {
    const scenario = scenarios.find(
      (entry) => entry.slug === continueTarget.scenarioSlug,
    );
    const lessons = scenario?.levels.flatMap((level) => level.lessons) ?? [];
    const index = lessons.findIndex(
      (lesson) => lesson.slug === continueTarget.lessonSlug,
    );
    if (scenario && index >= 0) {
      hubContinue = {
        scenarioName: scenario.name,
        lessonSlug: continueTarget.lessonSlug,
        lessonNumber: index + 1,
        lessonTotal: lessons.length,
      };
    }
  }

  return (
    <JourneyHub
      chapters={chapters}
      continueTarget={hubContinue}
      avatar={{ animal: avatar.animal, equipped: avatar.equipped }}
      locale={localeParam}
      messages={messages}
    />
  );
}
