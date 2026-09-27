import { HanHub } from "@/components/han/han-hub";
import { isAppLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

/**
 * Han Tutor as its own destination (2026-09-23) - the nav group opens this
 * directly instead of landing on the picker at `/han`. Same component and
 * same view the picker's Tutor card has always opened; only the entry point
 * is new. Nothing about Han's behaviour, prompts, voice or memory changes
 * here, and the floating bubble is untouched (it already hides itself for
 * anything under `/han`).
 */
export default async function HanTutorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isAppLocale(locale)) return null;
  const dictionary = await getDictionary(locale);

  return (
    <HanHub
      locale={locale}
      messages={dictionary.hanVocabulary}
      initialView="tutor"
    />
  );
}
