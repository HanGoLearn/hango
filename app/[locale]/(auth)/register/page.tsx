import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { serverEnv } from "@/lib/env/server";
import { RegisterForm } from "@/components/auth/register-form";
import { getDictionary } from "@/i18n/get-dictionary";
import { isAppLocale, localePath } from "@/i18n/config";

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isAppLocale(locale)) notFound();
  const { auth: authMessages } = await getDictionary(locale);
  const session = await auth();
  if (session) {
    redirect(localePath(locale, "/dashboard"));
  }

  const googleEnabled = Boolean(
    serverEnv.GOOGLE_CLIENT_ID && serverEnv.GOOGLE_CLIENT_SECRET,
  );

  return (
    <RegisterForm
      googleEnabled={googleEnabled}
      inviteOnly={serverEnv.HANGO_BETA_ACCESS_MODE === "INVITE_ONLY"}
      locale={locale}
      messages={authMessages}
    />
  );
}
