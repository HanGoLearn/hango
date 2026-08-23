import { auth } from "@/lib/auth";
import {
  getTranslationChallenges,
  getRecentAttempts,
} from "@/lib/writing-data";
import { WritingLabHome } from "@/components/writing/writing-lab-home";
import type { CustomWritingCharacteristics } from "@/lib/writing-feedback";

export default async function WritingLabPage() {
  const session = await auth();
  const [translationChallenges, recentAttempts] = await Promise.all([
    getTranslationChallenges(),
    getRecentAttempts(session!.user!.id!),
  ]);

  const toSummary = (task: {
    id: string;
    type: string;
    title: string;
    prompt: string;
  }) => ({
    id: task.id,
    type: task.type,
    title: task.title,
    prompt: task.prompt,
  });

  return (
    <WritingLabHome
      translationChallenges={translationChallenges.map(toSummary)}
      recentAttempts={recentAttempts.map((attempt) => ({
        id: attempt.id,
        taskTitle:
          attempt.task?.title ??
          (attempt.customPrompt as CustomWritingCharacteristics | null)
            ?.topic ??
          "Custom writing",
        submittedAt: attempt.submittedAt!.toISOString(),
      }))}
    />
  );
}
