import {
  getSpeakingPrompts,
  getSpeakingLessonOptions,
} from "@/lib/content/speaking-prompts";
import { SpeakingLabHome } from "@/components/speaking/speaking-lab-home";
import { isAppLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export default async function SpeakingLabPage({
  searchParams,
  params,
}: {
  searchParams: Promise<{ lessonId?: string }>;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isAppLocale(locale)) return null;
  const dictionary = await getDictionary(locale);
  const { lessonId } = await searchParams;
  const [prompts, lessonOptions] = await Promise.all([
    getSpeakingPrompts(lessonId),
    getSpeakingLessonOptions(),
  ]);
  const activeLessonId = lessonId ?? lessonOptions[0]?.id ?? null;

  return (
    <SpeakingLabHome
      locale={locale}
      prompts={prompts}
      lessonOptions={lessonOptions}
      activeLessonId={activeLessonId}
      showSpeakingTestMode={process.env.NODE_ENV === "development"}
      messages={dictionary.speakingLab}
      levelMessages={dictionary.dashboard.levels}
    />
  );
}
