import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getLessonWithContent } from "@/lib/content/lesson-data";
import {
  getLessonAccess,
  getOrCreateLessonProgress,
} from "@/lib/lesson-progress-data";
import { LessonEngine } from "@/components/lesson/lesson-engine";
import { LessonResultsView } from "@/components/lesson/lesson-results-view";
import { LessonRewardsPanel } from "@/components/lesson/lesson-rewards-panel";
import { isAppLocale, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { resolveJourneyChapter } from "@/lib/content/learning-journey";
import { isJourneyChapterAccessible } from "@/lib/beta-learning-scope";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isAppLocale(locale)) return null;
  const session = await auth();
  const userId = session!.user!.id!;

  const lesson = await getLessonWithContent(slug, locale);
  if (!lesson) notFound();
  if (lesson.steps.length === 0) notFound();

  const chapter = resolveJourneyChapter([lesson.scenarioLevel.difficulty]);
  if (!isJourneyChapterAccessible(chapter, session!.user!.role)) {
    redirect(localePath(locale, `/learning-journey/chapter/${chapter}`));
  }

  const { allowed, completed } = await getLessonAccess(userId, lesson);
  if (!allowed) {
    redirect(
      localePath(
        locale,
        `/learning-journey/${lesson.scenarioLevel.scenario.slug}`,
      ),
    );
  }

  if (completed) {
    const dictionary = await getDictionary(locale);
    return (
      <div className="flex flex-col gap-6">
        <LessonResultsView
          lessonId={lesson.id}
          lessonTitle={lesson.title}
          lessonSlug={lesson.slug}
          scenarioSlug={lesson.scenarioLevel.scenario.slug}
        />
        <LessonRewardsPanel
          userId={userId}
          lessonId={lesson.id}
          locale={locale}
          messages={dictionary.lesson.rewards}
        />
      </div>
    );
  }

  const progress = await getOrCreateLessonProgress(
    userId,
    lesson.id,
    lesson.steps[0]!.id,
  );

  return (
    <LessonEngine
      locale={locale}
      lesson={lesson}
      initialCurrentStepId={progress.currentStepId}
      initialCompletedStepIds={progress.completedStepIds}
    />
  );
}
