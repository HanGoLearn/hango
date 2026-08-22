import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { serverEnv } from "@/lib/env/server";
import { getAuthErrorMessage } from "@/lib/auth-error-messages";
import { getSafeRedirectPath } from "@/lib/safe-redirect";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    verified?: string;
    verifyError?: string;
    error?: string;
    callbackUrl?: string;
  }>;
}) {
  const session = await auth();
  if (session) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const googleEnabled = Boolean(
    serverEnv.GOOGLE_CLIENT_ID && serverEnv.GOOGLE_CLIENT_SECRET,
  );
  const redirectTo = getSafeRedirectPath(params.callbackUrl, "/dashboard");

  return (
    <LoginForm
      googleEnabled={googleEnabled}
      redirectTo={redirectTo}
      notice={
        params.verified ? "Email verified. You can now log in." : undefined
      }
      errorNotice={
        params.verifyError
          ? "That verification link is invalid or has expired. Please register again."
          : getAuthErrorMessage(params.error)
      }
    />
  );
}
