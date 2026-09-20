import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { clientEnv } from "@/lib/env/client";
import { DEFAULT_LOCALE, isAppLocale, localePath } from "@/i18n/config";
import { opaqueAuthTokenCandidates } from "@/lib/auth-tokens";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const email = request.nextUrl.searchParams.get("email");
  const requestedLocale = request.nextUrl.searchParams.get("locale");
  const locale = isAppLocale(requestedLocale)
    ? requestedLocale
    : DEFAULT_LOCALE;

  const loginUrl = new URL(
    localePath(locale, "/login"),
    clientEnv.NEXT_PUBLIC_APP_URL,
  );

  if (!token || !email) {
    loginUrl.searchParams.set("verifyError", "missing");
    return NextResponse.redirect(loginUrl);
  }

  const verificationToken = await db.verificationToken.findFirst({
    where: {
      identifier: email,
      token: { in: opaqueAuthTokenCandidates(token) },
    },
  });

  if (!verificationToken || verificationToken.expires < new Date()) {
    // Prevent reuse: delete an expired token if it happens to still exist.
    if (verificationToken) {
      await db.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: email,
            token: verificationToken.token,
          },
        },
      });
    }
    loginUrl.searchParams.set("verifyError", "invalid");
    return NextResponse.redirect(loginUrl);
  }

  await db.$transaction([
    db.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    }),
    db.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: email,
          token: verificationToken.token,
        },
      },
    }),
  ]);

  loginUrl.searchParams.set("verified", "true");
  return NextResponse.redirect(loginUrl);
}
