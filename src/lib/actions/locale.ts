"use server";

import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  interfaceLanguageFromLocale,
  isAppLocale,
  LOCALE_COOKIE_NAME,
  type AppLocale,
} from "@/i18n/config";

export async function setInterfaceLocaleAction(locale: string): Promise<void> {
  if (!isAppLocale(locale)) throw new Error("Unsupported locale");

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE_NAME, locale, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  const session = await auth();
  if (!session?.user?.id) return;

  await db.learnerProfile.updateMany({
    where: { userId: session.user.id },
    data: {
      interfaceLanguage: interfaceLanguageFromLocale(locale as AppLocale),
    },
  });
}
