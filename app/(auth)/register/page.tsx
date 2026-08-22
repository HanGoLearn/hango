import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { serverEnv } from "@/lib/env/server";
import { RegisterForm } from "@/components/auth/register-form";

export default async function RegisterPage() {
  const session = await auth();
  if (session) {
    redirect("/dashboard");
  }

  const googleEnabled = Boolean(
    serverEnv.GOOGLE_CLIENT_ID && serverEnv.GOOGLE_CLIENT_SECRET,
  );

  return <RegisterForm googleEnabled={googleEnabled} />;
}
