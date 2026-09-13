import Link from "next/link";
import { notFound } from "next/navigation";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { InformationBanner } from "@/components/ui/banner";
import { PageTitle, Body } from "@/components/ui/typography";
import { getDictionary } from "@/i18n/get-dictionary";
import { isAppLocale, localePath } from "@/i18n/config";

export default async function ResetPasswordPage({
  searchParams,
  params,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isAppLocale(locale)) notFound();
  const { auth } = await getDictionary(locale);
  const { token, email } = await searchParams;

  if (!token || !email) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <PageTitle>{auth.resetPassword.invalidTitle}</PageTitle>
        <InformationBanner variant="error">
          {auth.resetPassword.invalidDescription}
        </InformationBanner>
        <Link
          href={localePath(locale, "/forgot-password")}
          className="font-interface text-supporting text-primary-300 hover:underline"
        >
          {auth.resetPassword.requestNew}
        </Link>
        <Body className="text-text-secondary">
          <Link
            href={localePath(locale, "/login")}
            className="text-primary-300 hover:underline"
          >
            {auth.resetPassword.backToLogin}
          </Link>
        </Body>
      </div>
    );
  }

  return (
    <ResetPasswordForm
      email={email}
      token={token}
      locale={locale}
      messages={auth}
    />
  );
}
