import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOrCreateLearnerProfile } from "@/lib/learner-profile";
import {
  interfaceLanguageFromLocale,
  isAppLocale,
  localePath,
} from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";

/**
 * Full-screen focused flow, deliberately outside AppShell (no sidebar/nav —
 * there's nothing to navigate to until a profile exists). Requires
 * authentication independently of proxy.ts, same defense-in-depth pattern
 * as app/(app)/layout.tsx.
 */
export default async function OnboardingLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isAppLocale(localeParam)) return null;
  const locale = localeParam;
  const session = await auth();
  if (!session?.user?.id) {
    redirect(localePath(locale, "/login"));
  }

  const profile = await getOrCreateLearnerProfile(
    session.user.id,
    interfaceLanguageFromLocale(locale),
  );
  if (profile.onboardingCompletedAt) {
    redirect(localePath(locale, "/dashboard"));
  }

  const dictionary = await getDictionary(locale);

  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-page px-4 py-20 sm:py-12">
      <LanguageSwitcher
        locale={locale}
        label={dictionary.common.languageSwitcher}
        className="absolute top-4 right-4"
      />
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
