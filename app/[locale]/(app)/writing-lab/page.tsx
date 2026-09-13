import { auth } from "@/lib/auth";
import {
  getTranslationChallenges,
  getRecentAttempts,
} from "@/lib/writing-data";
import { WritingLabHome } from "@/components/writing/writing-lab-home";
import type { CustomWritingCharacteristics } from "@/lib/writing-feedback";
import { isAppLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export default async function WritingLabPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isAppLocale(locale)) return null;
  const dictionary = await getDictionary(locale);
  const session = await auth();
  const [translationChallenges, recentAttempts] = await Promise.all([
    getTranslationChallenges(locale),
    getRecentAttempts(session!.user!.id!, 5, locale),
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
          dictionary.writingLab.home.customAttemptTitle,
        submittedAt: attempt.submittedAt!.toISOString(),
      }))}
      locale={locale}
      messages={dictionary.writingLab}
      levelMessages={dictionary.dashboard.levels}
    />
  );
}
