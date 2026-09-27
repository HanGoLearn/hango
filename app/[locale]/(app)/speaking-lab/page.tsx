import {
  getSpeakingPrompts,
  getSpeakingLessonOptions,
} from "@/lib/content/speaking-prompts";
import { SpeakingLabHome } from "@/components/speaking/speaking-lab-home";
import { isAppLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { auth } from "@/lib/auth";
import { hasFullBetaLearningAccess } from "@/lib/beta-learning-scope";
import { getBetaSpeakingStations } from "@/lib/beta-speaking-stations";
import { BetaSpeakingStations } from "@/components/speaking/beta-speaking-stations";

export default async function SpeakingLabPage({
  searchParams,
  params,
}: {
  searchParams: Promise<{ lessonId?: string; station?: string }>;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isAppLocale(locale)) return null;
  const [dictionary, session] = await Promise.all([
    getDictionary(locale),
    auth(),
  ]);
  const { lessonId, station: requestedStation } = await searchParams;

  if (!hasFullBetaLearningAccess(session!.user!.role)) {
    const stations = await getBetaSpeakingStations(session!.user!.id!, locale);
    const selectedStation =
      stations.find(
        (station) => station.id === requestedStation && station.unlocked,
      ) ?? null;
    const selectedPrompt = selectedStation
      ? (await getSpeakingPrompts(selectedStation.lessonId)).SHADOWING
      : null;

    return (
      <BetaSpeakingStations
        locale={locale}
        stations={stations}
        selectedStation={selectedStation}
        selectedPrompt={selectedPrompt}
        messages={dictionary.speakingLab}
      />
    );
  }

  const [prompts, lessonOptions] = await Promise.all([
    getSpeakingPrompts(lessonId),
    getSpeakingLessonOptions(locale),
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
      journeyMessages={dictionary.learningJourney}
      levelMessages={dictionary.dashboard.levels}
    />
  );
}
