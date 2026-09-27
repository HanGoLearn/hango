"use client";

import { usePathname } from "next/navigation";
import { pathWithoutLocale } from "@/i18n/config";

/**
 * Renders its children on Home and nowhere else (2026-09-22, user
 * decision): the top bar - brand, streak, coins, avatar menu - now belongs
 * to Home alone, so every other screen starts at its own content and gets
 * that 56px band back.
 *
 * A client component because only the client knows the route; AppShell is
 * a Server Component and has no pathname. The children are still rendered
 * on the server either way, so TopBarData's queries - and the daily-login
 * coin grant that rides along with them - keep running on every page
 * exactly as before. This decides what is shown, not what is fetched.
 */
export function HomeOnly({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (!pathWithoutLocale(pathname).startsWith("/dashboard")) return null;
  return <>{children}</>;
}
