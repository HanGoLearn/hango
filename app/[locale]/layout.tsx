import type { Metadata } from "next";
import Script from "next/script";
import { notFound } from "next/navigation";
import "../globals.css";
import "@/lib/env/server";
import { clientEnv } from "@/lib/env/client";
import {
  RootDocument,
  THEME_INIT_SCRIPT,
} from "@/components/root-document";
import { isAppLocale, SUPPORTED_LOCALES } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isAppLocale(locale)) return {};
  const { metadata } = await getDictionary(locale);

  return {
    metadataBase: new URL(clientEnv.NEXT_PUBLIC_APP_URL),
    title: {
      default: metadata.title,
      template: "%s | HanGo",
    },
    description: metadata.description,
    openGraph: {
      type: "website",
      siteName: "HanGo",
      locale: locale === "es" ? "es_ES" : "en_US",
      title: metadata.socialTitle,
      description: metadata.socialDescription,
      images: [
        {
          url: "/og.png",
          width: 1200,
          height: 630,
          alt: metadata.socialImageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: metadata.socialTitle,
      description: metadata.socialDescription,
      images: ["/og.png"],
    },
  };
}

export default async function LocalizedRootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!isAppLocale(locale)) notFound();

  return (
    <RootDocument lang={locale}>
      <Script
        id="theme-init"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
      />
      {children}
    </RootDocument>
  );
}
