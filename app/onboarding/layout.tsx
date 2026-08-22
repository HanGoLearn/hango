import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOrCreateLearnerProfile } from "@/lib/learner-profile";

/**
 * Full-screen focused flow, deliberately outside AppShell (no sidebar/nav —
 * there's nothing to navigate to until a profile exists). Requires
 * authentication independently of proxy.ts, same defense-in-depth pattern
 * as app/(app)/layout.tsx.
 */
export default async function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const profile = await getOrCreateLearnerProfile(session.user.id);
  if (profile.onboardingCompletedAt) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-page px-4 py-12">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
