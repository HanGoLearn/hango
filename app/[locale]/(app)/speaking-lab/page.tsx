import { isAppLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import {
  getBetaSpeakingStations,
  getBetaSpeakingStationConversation,
} from "@/lib/beta-speaking-stations";
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
  // Authentication remains enforced by the app layout. Every account uses
  // the same three-station Lab; returning without a query must not expose
  // the retired full Lab, including for administrators or FULL beta scope.
  const dictionary = await getDictionary(locale);
  const { station: requestedStation } = await searchParams;
  const stations = await getBetaSpeakingStations(locale);
  const selectedStation =
    stations.find((station) => station.id === requestedStation) ?? null;
  const selectedConversation = selectedStation
    ? await getBetaSpeakingStationConversation(selectedStation, locale)
    : null;

  return (
    <BetaSpeakingStations
      locale={locale}
      stations={stations}
      selectedStation={selectedStation}
      selectedConversation={selectedConversation}
      messages={dictionary.speakingLab}
    />
  );
}
