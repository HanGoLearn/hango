import "server-only";
import { db } from "@/lib/db";
import {
  canCreateBetaAccount,
  normalizeBetaInvitationEmail,
} from "@/lib/beta-access";

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
  if (!email) return false;

  const normalizedEmail = normalizeBetaInvitationEmail(email);
  const existingUser = await db.user.findFirst({
    where: { email: { equals: normalizedEmail, mode: "insensitive" } },
    select: { id: true, emailVerified: true },
  });
  if (!existingUser) {
    if (!emailVerified) return false;

    // A new OAuth account follows the same closed-beta gate as credentials.
    // The Auth.js createUser event records the activation after the adapter
    // has persisted the new user.
    return canCreateBetaAccount(normalizedEmail);
  }

  const alreadyLinked = await db.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: account.provider,
        providerAccountId: account.providerAccountId,
      },
    },
    select: { userId: true },
  });

  if (alreadyLinked) {
    // Auth.js can omit the raw `email_verified` claim on a later callback.
    // An account already linked to this same verified HanGo user remains a
    // trusted identity; a link owned by anyone else must never be accepted.
    return (
      alreadyLinked.userId === existingUser.id &&
      (emailVerified === true || existingUser.emailVerified !== null)
    );
  }

  // A new link always requires Google's current verified-email assertion.
  // Database verification alone cannot authorize attaching a new provider
  // identity because that would enable account takeover by email collision.
  if (!emailVerified) return false;

  await db.account.create({
    data: { userId: existingUser.id, ...account },
  });

  return true;
}
