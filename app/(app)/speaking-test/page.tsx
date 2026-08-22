import { notFound } from "next/navigation";
import { SpeakingTestHarness } from "@/components/speaking/speaking-test-harness";
import { getLessonWithContent } from "@/lib/content/lesson-data";
import { getSpeakingLessonOptions } from "@/lib/content/speaking-prompts";

export default async function SpeakingTestPage({
  searchParams,
}: {
  searchParams: Promise<{ lessonId?: string }>;
}) {
  if (process.env.NODE_ENV !== "development") notFound();

  const lessonOptions = await getSpeakingLessonOptions();
  if (lessonOptions.length === 0) notFound();

  const { lessonId } = await searchParams;
  const activeOption =
    lessonOptions.find((option) => option.id === lessonId) ?? lessonOptions[0]!;
  const lesson = await getLessonWithContent(activeOption.slug);
  if (!lesson) notFound();

  return (
    <SpeakingTestHarness
      key={lesson.id}
      lesson={lesson}
      lessonOptions={lessonOptions}
    />
  );
}
