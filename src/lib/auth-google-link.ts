import "server-only";
import { db } from "@/lib/db";

export interface GoogleAccountDetails {
  type: string;
  provider: string;
  providerAccountId: string;
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
  token_type?: string;
  scope?: string;
  id_token?: string;
  session_state?: string;
}

/**
 * Safely links a Google sign-in to an existing HanGo account with the same
 * email, instead of Auth.js's default (reject with OAuthAccountNotLinked).
 *
 * "Safely" means: only for Google, and only when Google has verified the
 * email itself (`email_verified`) — an unverified email cannot be trusted to
 * prove account ownership, so allowing it to link would be an account
 * takeover vector (authentication.md's "Create or link accounts safely").
 *
 * Returns false to reject the sign-in, true to allow it.
 */
export async function ensureGoogleAccountLinked(
  email: string | null | undefined,
  emailVerified: boolean | undefined,
  account: GoogleAccountDetails,
): Promise<boolean> {
  if (!emailVerified || !email) {
    return false;
  }

  const existingUser = await db.user.findUnique({ where: { email } });
  if (!existingUser) {
    // No existing account — let the adapter create a brand-new User+Account.
    return true;
  }

  const alreadyLinked = await db.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: account.provider,
        providerAccountId: account.providerAccountId,
      },
    },
  });

  if (!alreadyLinked) {
    await db.account.create({
      data: { userId: existingUser.id, ...account },
    });
  }

  return true;
}
