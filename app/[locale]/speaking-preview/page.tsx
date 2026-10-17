import { notFound } from "next/navigation";
import { isAppLocale } from "@/i18n/config";
import { JourneySpeakingPreview } from "@/components/lesson/journey-speaking-preview";

export default async function SpeakingPreviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  if (process.env.NODE_ENV !== "development") notFound();
  const { locale } = await params;
  if (!isAppLocale(locale)) notFound();
  return <JourneySpeakingPreview locale={locale} />;
}
