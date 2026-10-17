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
import { usesJourneyLessonReport } from "@/lib/journey-report-routing";
import {
  getLocalJourneyRollout,
  needsJourneyLessonRestart,
} from "@/lib/journey-local-rollout";
import { JourneyRolloutNotice } from "@/components/lesson/journey-rollout-notice";

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

  const journeyReport = await usesJourneyLessonReport(userId, lesson.id);
  const rollout = await getLocalJourneyRollout();
  if (
    rollout === "UNAVAILABLE" ||
    (rollout === "READY" &&
      !journeyReport &&
      (completed || (await needsJourneyLessonRestart(userId, lesson.id))))
  )
    return (
      <JourneyRolloutNotice
        locale={locale}
        lessonId={lesson.id}
        lessonSlug={lesson.slug}
        scenarioSlug={lesson.scenarioLevel.scenario.slug}
        unavailable={rollout === "UNAVAILABLE"}
      />
    );
  if (completed) {
    const dictionary = await getDictionary(locale);
    return (
      <div className="flex flex-col gap-6">
        <LessonResultsView
          lessonId={lesson.id}
          lessonTitle={lesson.title}
          lessonSlug={lesson.slug}
          scenarioSlug={lesson.scenarioLevel.scenario.slug}
          locale={locale}
          journeyReport={journeyReport}
        />
        <LessonRewardsPanel
          userId={userId}
          lessonId={lesson.id}
          locale={locale}
          messages={dictionary.lesson.rewards}
          journeyReport={journeyReport}
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
      key={`${progress.id}:${progress.startedAt.toISOString()}`}
      locale={locale}
      lesson={lesson}
      initialCurrentStepId={progress.currentStepId}
      initialCompletedStepIds={progress.completedStepIds}
      journeyReport={journeyReport}
      journeyEvidenceCapture={rollout === "READY"}
    />
  );
}
