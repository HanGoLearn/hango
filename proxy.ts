import NextAuth from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import { authConfig } from "@/lib/auth.config";
import {
  isAppLocale,
  LOCALE_COOKIE_NAME,
  localeFromAcceptLanguage,
  localeFromPathname,
  type AppLocale,
} from "@/i18n/config";

const { auth } = NextAuth(authConfig);

const PROTECTED_PATHS = [
  "/dashboard",
  "/learning-journey",
  "/lesson",
  "/speaking-lab",
  "/speaking-test",
  "/writing-lab",
  "/progress",
  "/settings",
  "/achievements",
  "/leaderboard",
  "/tienda",
  "/han",
  "/placement-exam",
  "/welcome-to-chinese",
  "/onboarding",
];

function preferredLocale(request: NextRequest): AppLocale {
  const cookieLocale = request.cookies.get(LOCALE_COOKIE_NAME)?.value;
  if (isAppLocale(cookieLocale)) return cookieLocale;
  return localeFromAcceptLanguage(request.headers.get("accept-language"));
}

function pathWithoutLocale(pathname: string): string {
  const segments = pathname.split("/");
  segments.splice(1, 1);
  return segments.join("/") || "/";
}

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function withLocaleCookie(response: NextResponse, locale: AppLocale) {
  response.cookies.set(LOCALE_COOKIE_NAME, locale, {
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}

export default auth((request) => {
  const pathname = request.nextUrl.pathname;

  // The private back-office remains intentionally Spanish-only. Its own
  // server layout still performs the authoritative administrator check.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return NextResponse.next();
  }

  const locale = localeFromPathname(pathname);
  if (!locale) {
    const target = request.nextUrl.clone();
    const selectedLocale = preferredLocale(request);
    target.pathname = `/${selectedLocale}${pathname === "/" ? "" : pathname}`;
    return withLocaleCookie(NextResponse.redirect(target), selectedLocale);
  }

  const learnerPath = pathWithoutLocale(pathname);
  if (isProtectedPath(learnerPath) && !request.auth) {
    const loginUrl = new URL(`/${locale}/login`, request.nextUrl.origin);
    loginUrl.searchParams.set(
      "callbackUrl",
      `${pathname}${request.nextUrl.search}`,
    );
    return withLocaleCookie(NextResponse.redirect(loginUrl), locale);
  }

  return withLocaleCookie(NextResponse.next(), locale);
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)",
  ],
};
