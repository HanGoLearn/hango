import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HomeHero } from "@/components/marketing/home-hero";
import { getDictionary } from "@/i18n/get-dictionary";
import { isAppLocale } from "@/i18n/config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isAppLocale(locale)) return {};
  return {
    alternates: {
      canonical: `/${locale}`,
      languages: { es: "/es", en: "/en" },
    },
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isAppLocale(locale)) notFound();
  const dictionary = await getDictionary(locale);

  return <HomeHero locale={locale} messages={dictionary.marketing} />;
}
