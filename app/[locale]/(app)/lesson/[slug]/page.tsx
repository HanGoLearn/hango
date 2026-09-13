import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getLessonWithContent } from "@/lib/content/lesson-data";
import {
  getLessonAccess,
  getOrCreateLessonProgress,
} from "@/lib/lesson-progress-data";
import { LessonEngine } from "@/components/lesson/lesson-engine";
import { LessonResultsView } from "@/components/lesson/lesson-results-view";
import { isAppLocale, localePath } from "@/i18n/config";

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
    return (
      <LessonResultsView
        lessonId={lesson.id}
        lessonTitle={lesson.title}
        lessonSlug={lesson.slug}
        scenarioSlug={lesson.scenarioLevel.scenario.slug}
      />
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
