import { signOut } from "@/lib/auth";

/**
 * Clears a session whose user no longer exists (2026-09-05 fix, corrected
 * same day - see app/(app)/layout.tsx). signOut() mutates the session
 * cookie, which Next only allows from a Server Action or Route Handler,
 * not a Server Component - AppGroupLayout can't call it directly, so it
 * redirects here instead, and this GET handler does the actual sign-out.
 */
export async function GET() {
  await signOut({ redirectTo: "/login" });
}
