import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOrCreateLearnerProfile } from "@/lib/learner-profile";
import { AppShell } from "@/components/shell/app-shell";

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
}: {
  children: ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Core MVP learning loop (mvp.md): Create Account -> Complete Onboarding
  // -> Receive Recommendation -> Enter Learning Journey. A learner with no
  // profile yet shouldn't land on the Dashboard first.
  const profile = await getOrCreateLearnerProfile(session.user.id);
  if (!profile.onboardingCompletedAt) {
    redirect("/onboarding");
  }

  return <AppShell>{children}</AppShell>;
}
