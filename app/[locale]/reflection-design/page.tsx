import { notFound } from "next/navigation";
import { isAppLocale } from "@/i18n/config";
import { JourneyReflectionDesignPreview } from "@/components/lesson/journey-reflection-design-preview";

// Isolated local design review. No auth/session, database, learner actions or AI.
export default async function ReflectionDesignPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ palette?: string | string[] }>;
}) {
  if (process.env.NODE_ENV !== "development") notFound();
  const { locale } = await params;
  if (!isAppLocale(locale)) notFound();
  const query = await searchParams;
  return (
    <JourneyReflectionDesignPreview
      locale={locale}
      palette={query?.palette === "light" ? "light" : undefined}
    />
  );
}
