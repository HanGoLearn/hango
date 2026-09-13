"use server";

import { signOut } from "@/lib/auth";
import { isAppLocale, localePath } from "@/i18n/config";

export async function logoutAction(locale?: string): Promise<void> {
  await signOut({
    redirectTo: isAppLocale(locale) ? localePath(locale) : "/",
  });
}
