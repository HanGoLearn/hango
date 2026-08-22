import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export type UserRole = "LEARNER" | "PREMIUM_LEARNER" | "ADMINISTRATOR";

/**
 * Basic role verification (2.6). No route currently requires an elevated
 * role — this exists so future admin-only routes (FASE 14+) have a single,
 * tested place to enforce it rather than reimplementing the check per page.
 * Redirects rather than throwing, matching how the rest of the app handles
 * unauthorized access to a page.
 */
export async function requireRole(allowedRoles: UserRole[]) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }
  if (!allowedRoles.includes(session.user.role as UserRole)) {
    redirect("/dashboard");
  }
  return session;
}
