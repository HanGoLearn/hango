import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOrCreateLearnerProfile } from "@/lib/learner-profile";
import { getSafeRedirectPath } from "@/lib/safe-redirect";
import {
  interfaceLanguageFromLocale,
  isAppLocale,
  localeFromInterfaceLanguage,
  localePath,
  pathWithoutLocale,
} from "@/i18n/config";

/**
 * Resolves the learner's saved interface language after either credentials
 * or Google sign-in. Keeping this as a server-only handoff means a new
 * device can honor the profile preference before the private app renders,
 * while the language used for Han's explanations remains independent.
 */
export default async function PostLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { locale: routeLocale } = await params;
  if (!isAppLocale(routeLocale)) notFound();

  const query = await searchParams;
  const requestedPath = getSafeRedirectPath(query.callbackUrl, "/dashboard");
  const session = await auth();
  if (!session?.user?.id) {
    redirect(
      `${localePath(routeLocale, "/login")}?callbackUrl=${encodeURIComponent(requestedPath)}`,
    );
  }

  const profile = await getOrCreateLearnerProfile(
    session.user.id,
    interfaceLanguageFromLocale(routeLocale),
  );
  const preferredLocale = localeFromInterfaceLanguage(
    profile.interfaceLanguage,
  );

  if (requestedPath === "/admin" || requestedPath.startsWith("/admin/")) {
    redirect(requestedPath);
  }

  redirect(localePath(preferredLocale, pathWithoutLocale(requestedPath)));
}
