import { HanHub } from "@/components/han/han-hub";
import { isAppLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

/** Han Companion as its own destination — see `han/tutor/page.tsx`. */
export default async function HanCompanionPage({
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
      initialView="companion"
    />
  );
}
