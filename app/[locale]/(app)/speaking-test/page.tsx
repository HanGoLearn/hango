import { notFound } from "next/navigation";
import { SpeakingTestHarness } from "@/components/speaking/speaking-test-harness";
import { getLessonWithContent } from "@/lib/content/lesson-data";
import { getSpeakingLessonOptions } from "@/lib/content/speaking-prompts";
import { isAppLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

/**
 * Internal QA harness (2026-09-05 audit note) - lets a developer open any
 * lesson's Speaking step directly, via a lesson picker, without touching a
 * real learner's Learning Journey progress. Dev-only by design, not a
 * learner feature: 404s outright in production (the check below), and its
 * only in-app entry point (a "Speaking test mode" card in
 * speaking-lab-home.tsx) is itself only rendered when NODE_ENV is
 * development, so there's no path to it in a real deployment either way.
 */
export default async function SpeakingTestPage({
  searchParams,
  params,
}: {
  searchParams: Promise<{ lessonId?: string }>;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isAppLocale(locale)) notFound();
  if (process.env.NODE_ENV !== "development") notFound();
  const dictionary = await getDictionary(locale);

  const lessonOptions = await getSpeakingLessonOptions();
  if (lessonOptions.length === 0) notFound();

  const { lessonId } = await searchParams;
  const activeOption =
    lessonOptions.find((option) => option.id === lessonId) ?? lessonOptions[0]!;
  const lesson = await getLessonWithContent(activeOption.slug, locale);
  if (!lesson) notFound();

  return (
    <SpeakingTestHarness
      locale={locale}
      key={lesson.id}
      lesson={lesson}
      lessonOptions={lessonOptions}
      messages={dictionary.speakingLab.testHarness}
    />
  );
}
