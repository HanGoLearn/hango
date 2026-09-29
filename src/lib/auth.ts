import "server-only";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import { serverEnv } from "@/lib/env/server";
import { verifyCredentials } from "@/lib/auth-credentials";
import { ensureGoogleAccountLinked } from "@/lib/auth-google-link";
import { authConfig } from "@/lib/auth.config";
import { resolveAuthSessionState } from "@/lib/auth-session-state";
import {
  activateBetaInvitationForUser,
  isBetaInviteOnly,
} from "@/lib/beta-access";

const googleProvider =
  serverEnv.GOOGLE_CLIENT_ID && serverEnv.GOOGLE_CLIENT_SECRET
    ? [
        Google({
          clientId: serverEnv.GOOGLE_CLIENT_ID,
          clientSecret: serverEnv.GOOGLE_CLIENT_SECRET,
        }),
      ]
    : [];

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  // Required: database sessions are not supported alongside the Credentials
  // provider (authentication.md's email/password flow) — Auth.js issues a
  // signed JWT instead. The Prisma adapter still persists User/Account,
  // which Google Sign-In (below) relies on.
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: (credentials) =>
        verifyCredentials(credentials?.email, credentials?.password),
    }),
    ...googleProvider,
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "google") {
        return true;
      }
      return ensureGoogleAccountLinked(
        profile?.email,
        profile?.email_verified ?? undefined,
        {
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          access_token: account.access_token,
          refresh_token: account.refresh_token ?? undefined,
          expires_at: account.expires_at,
          token_type: account.token_type ?? undefined,
          scope: account.scope,
          id_token: account.id_token,
          session_state: account.session_state as string | undefined,
        },
      );
    },
    async jwt({ token, user }) {
      const userId = user?.id ?? token.sub;
      if (!userId) return token;

      const currentUser = await resolveAuthSessionState(
        userId,
        token.sessionVersion,
        Boolean(user),
      );
      if (!currentUser) return null;

      token.role = currentUser.role;
      token.sessionVersion = currentUser.sessionVersion;
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
  events: {
    async createUser({ user }) {
      if (user.id && user.email) {
        const activated = await activateBetaInvitationForUser({
          userId: user.id,
          email: user.email,
        });
        if (!activated && isBetaInviteOnly()) {
          // The invitation may have expired or been revoked in the brief gap
          // between OAuth authorization and adapter persistence. Remove the
          // still-unlinked user so that race cannot bypass the allowlist.
          await db.user.deleteMany({
            where: { id: user.id, accounts: { none: {} } },
          });
          throw new Error("Beta invitation is no longer available");
        }
      }
    },
  },
});
