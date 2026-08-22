import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

/**
 * First line of defense for authenticated routes (2.6 "Protect authenticated
 * application routes"). Built from the edge-safe auth.config only — this
 * decrypts the session JWT from the cookie and never touches the database
 * (Next.js's own guidance for Proxy: "optimistic checks" only). See
 * app/(app)/layout.tsx for the second, database-backed enforcement layer
 * that doesn't depend on Proxy running at all.
 */
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  if (!req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/learning-journey/:path*",
    "/speaking-lab/:path*",
    "/writing-lab/:path*",
    "/progress/:path*",
    "/settings/:path*",
  ],
};
