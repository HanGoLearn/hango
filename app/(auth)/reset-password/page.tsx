import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { InformationBanner } from "@/components/ui/banner";
import { PageTitle, Body } from "@/components/ui/typography";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const { token, email } = await searchParams;

  if (!token || !email) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <PageTitle>Invalid link</PageTitle>
        <InformationBanner variant="error">
          This password reset link is missing required information. Request a
          new one.
        </InformationBanner>
        <Link
          href="/forgot-password"
          className="font-interface text-supporting text-primary-300 hover:underline"
        >
          Request a new link
        </Link>
        <Body className="text-text-secondary">
          <Link href="/login" className="text-primary-300 hover:underline">
            Back to login
          </Link>
        </Body>
      </div>
    );
  }

  return <ResetPasswordForm email={email} token={token} />;
}
