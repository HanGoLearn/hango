import { HanHub } from "@/components/han/han-hub";
import { isAppLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export default async function HanPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isAppLocale(locale)) return null;
  const dictionary = await getDictionary(locale);

  return <HanHub messages={dictionary.hanVocabulary} />;
}
