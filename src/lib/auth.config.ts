import type { NextAuthConfig } from "next-auth";
import { serverEnv } from "@/lib/env/server";

/**
 * Edge-safe subset of the Auth.js config — no Prisma adapter, no bcrypt, no
 * providers with server-only dependencies. This is the ONLY auth config
 * `proxy.ts` may import: Prisma's generated client uses Node built-ins
 * (`node:path`, `node:url`) that error in the Edge Runtime proxy runs in,
 * and Next's own docs recommend Proxy only ever decrypt the session from
 * the cookie, never hit the database (see "Optimistic checks with Proxy").
 *
 * `src/lib/auth.ts` extends this with the adapter and providers for
 * everywhere else (route handlers, Server Components, Server Actions).
 */
export const authConfig = {
  secret: serverEnv.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
