import { auth } from "@/lib/auth";
import {
  getWritingTasks,
  getWritingLessonOptions,
  getTranslationChallenges,
  getRecentAttempts,
} from "@/lib/writing-data";
import { WritingLabHome } from "@/components/writing/writing-lab-home";
import type { CustomWritingCharacteristics } from "@/lib/writing-feedback";

export default async function WritingLabPage({
  searchParams,
}: {
  searchParams: Promise<{ lessonId?: string }>;
}) {
  const { lessonId } = await searchParams;
  const session = await auth();
  const [paragraphTasks, lessonOptions, translationChallenges, recentAttempts] =
    await Promise.all([
      getWritingTasks(lessonId),
      getWritingLessonOptions(),
      getTranslationChallenges(),
      getRecentAttempts(session!.user!.id!),
    ]);
  const activeLessonId = lessonId ?? lessonOptions[0]?.id ?? null;

  const toSummary = (task: { id: string; type: string; title: string; prompt: string }) => ({
    id: task.id,
    type: task.type,
    title: task.title,
    prompt: task.prompt,
  });

  return (
    <WritingLabHome
      paragraphTasks={paragraphTasks.map(toSummary)}
      lessonOptions={lessonOptions}
      activeLessonId={activeLessonId}
      translationChallenges={translationChallenges.map(toSummary)}
      recentAttempts={recentAttempts.map((attempt) => ({
        id: attempt.id,
        taskTitle:
          attempt.task?.title ??
          (attempt.customPrompt as CustomWritingCharacteristics | null)?.topic ??
          "Custom writing",
        submittedAt: attempt.submittedAt!.toISOString(),
      }))}
    />
  );
}
