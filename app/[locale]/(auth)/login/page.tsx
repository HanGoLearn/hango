import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { serverEnv } from "@/lib/env/server";
import { getAuthErrorMessage } from "@/lib/auth-error-messages";
import { getSafeRedirectPath } from "@/lib/safe-redirect";
import { LoginForm } from "@/components/auth/login-form";
import { getDictionary } from "@/i18n/get-dictionary";
import { isAppLocale, localePath } from "@/i18n/config";

export default async function LoginPage({
  searchParams,
  params,
}: {
  searchParams: Promise<{
    verified?: string;
    verifyError?: string;
    error?: string;
    callbackUrl?: string;
  }>;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isAppLocale(locale)) notFound();
  const { auth: authMessages } = await getDictionary(locale);
  const session = await auth();
  const query = await searchParams;
  const googleEnabled = Boolean(
    serverEnv.GOOGLE_CLIENT_ID && serverEnv.GOOGLE_CLIENT_SECRET,
  );
  const redirectTo = getSafeRedirectPath(
    query.callbackUrl,
    localePath(locale, "/dashboard"),
  );
  const postLoginRedirect = `${localePath(locale, "/post-login")}?callbackUrl=${encodeURIComponent(redirectTo)}`;
  if (session) {
    redirect(postLoginRedirect);
  }

  return (
    <LoginForm
      googleEnabled={googleEnabled}
      redirectTo={postLoginRedirect}
      locale={locale}
      messages={authMessages}
      notice={query.verified ? authMessages.login.verified : undefined}
      errorNotice={
        query.verifyError
          ? authMessages.login.verificationError
          : getAuthErrorMessage(query.error, locale)
      }
    />
  );
}
