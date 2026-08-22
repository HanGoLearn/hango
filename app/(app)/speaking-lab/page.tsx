import {
  getSpeakingPrompts,
  getSpeakingLessonOptions,
} from "@/lib/content/speaking-prompts";
import { SpeakingLabHome } from "@/components/speaking/speaking-lab-home";

export default async function SpeakingLabPage({
  searchParams,
}: {
  searchParams: Promise<{ lessonId?: string }>;
}) {
  const { lessonId } = await searchParams;
  const [prompts, lessonOptions] = await Promise.all([
    getSpeakingPrompts(lessonId),
    getSpeakingLessonOptions(),
  ]);
  const activeLessonId = lessonId ?? lessonOptions[0]?.id ?? null;

  return (
    <SpeakingLabHome
      prompts={prompts}
      lessonOptions={lessonOptions}
      activeLessonId={activeLessonId}
      showSpeakingTestMode={process.env.NODE_ENV === "development"}
    />
  );
}
