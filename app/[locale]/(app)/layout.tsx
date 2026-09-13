import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { getOrCreateLearnerProfile } from "@/lib/learner-profile";
import { AppShell } from "@/components/shell/app-shell";
import {
  interfaceLanguageFromLocale,
  isAppLocale,
  localePath,
} from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

/**
 * Backend enforcement for every authenticated route, independent of
 * proxy.ts (authentication.md — "Authorization should always be verified
 * on the backend"). Proxy is the first line of defense (and only reads the
 * session cookie, per Next's own guidance); this is the second, database-
 * backed layer, since a Server Component layout cannot be bypassed the way
 * an edge proxy's matcher could theoretically be misconfigured to skip a
 * route.
 */
export default async function AppGroupLayout({
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

  // Core MVP learning loop (mvp.md): Create Account -> Complete Onboarding
  // -> Receive Recommendation -> Enter Learning Journey. A learner with no
  // profile yet shouldn't land on the Dashboard first.
  let profile;
  try {
    profile = await getOrCreateLearnerProfile(
      session.user.id,
      interfaceLanguageFromLocale(locale),
    );
  } catch (error) {
    // A session can outlive its user (found 2026-09-05) - JWT sessions are
    // stateless, so deleting a user on one device (deleteAccountAction, or
    // a manual DB operation) can't invalidate an already-issued cookie
    // sitting on another device/tab. Rather than crash on every request
    // with a raw FK violation, treat "this session's user doesn't actually
    // exist" as an invalid session and force a clean re-login - same
    // Prisma-error-code check convention as reflection.ts's P2002 handling.
    // Can't call signOut() directly here (corrected same day) - it mutates
    // the session cookie, which Next only allows from a Server Action or
    // Route Handler, not this Server Component - redirect to one instead.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      redirect("/api/auth/invalid-session");
    }
    throw error;
  }
  if (!profile.onboardingCompletedAt) {
    redirect(localePath(locale, "/onboarding"));
  }

  const dictionary = await getDictionary(locale);
  return (
    <AppShell
      locale={locale}
      messages={dictionary.shell}
      languageSwitcherLabel={dictionary.common.languageSwitcher}
      achievementMessages={dictionary.achievements}
      lessonMessages={dictionary.lesson}
    >
      {children}
    </AppShell>
  );
}
