import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n/get-dictionary";
import { isAppLocale } from "@/i18n/config";

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isAppLocale(locale)) notFound();
  const { auth } = await getDictionary(locale);
  return <ForgotPasswordForm locale={locale} messages={auth} />;
}
