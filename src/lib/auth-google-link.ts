import "server-only";
import { db } from "@/lib/db";
import {
  canCreateBetaAccount,
  normalizeBetaInvitationEmail,
} from "@/lib/beta-access";
import { isAdministratorEmail } from "@/lib/admin-identity";

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

type GoogleLinkDecision = {
  allowed: boolean;
  reason:
    | "missing_email"
    | "new_email_unverified"
    | "new_administrator_allowed"
    | "new_beta_allowed"
    | "new_beta_rejected"
    | "linked_verified"
    | "linked_unverified"
    | "linked_identity_mismatch"
    | "new_link_unverified"
    | "new_link_created";
};

function reportGoogleLinkDecision(decision: GoogleLinkDecision): void {
  if (process.env.NODE_ENV !== "production") return;
  console.info("[auth][google-link-decision]", decision);
}

function reportGoogleLinkFailure(error: unknown): void {
  if (process.env.NODE_ENV !== "production") return;
  const code =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
      ? error.code
      : undefined;
  console.error("[auth][google-link-failure]", {
    name: error instanceof Error ? error.name : "UnknownError",
    code,
  });
}

async function decideGoogleAccountLink(
  email: string | null | undefined,
  emailVerified: boolean | undefined,
  account: GoogleAccountDetails,
): Promise<GoogleLinkDecision> {
  if (!email) return { allowed: false, reason: "missing_email" };

  const normalizedEmail = normalizeBetaInvitationEmail(email);
  const existingUser = await db.user.findFirst({
    where: { email: { equals: normalizedEmail, mode: "insensitive" } },
    select: { id: true, emailVerified: true },
  });
  if (!existingUser) {
    if (!emailVerified) {
      return { allowed: false, reason: "new_email_unverified" };
    }

    // The configured administrator may bootstrap the production database
    // through Google only after Google verifies ownership of the exact email.
    // Every other new account remains behind the closed-beta invitation gate.
    if (isAdministratorEmail(normalizedEmail)) {
      return { allowed: true, reason: "new_administrator_allowed" };
    }

    const betaAllowed = await canCreateBetaAccount(normalizedEmail);
    return {
      allowed: betaAllowed,
      reason: betaAllowed ? "new_beta_allowed" : "new_beta_rejected",
    };
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
    if (alreadyLinked.userId !== existingUser.id) {
      return { allowed: false, reason: "linked_identity_mismatch" };
    }

    const verified =
      emailVerified === true || existingUser.emailVerified !== null;
    return {
      allowed: verified,
      reason: verified ? "linked_verified" : "linked_unverified",
    };
  }

  if (!emailVerified) {
    return { allowed: false, reason: "new_link_unverified" };
  }

  await db.account.create({
    data: { userId: existingUser.id, ...account },
  });

  return { allowed: true, reason: "new_link_created" };
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
  try {
    const decision = await decideGoogleAccountLink(
      email,
      emailVerified,
      account,
    );
    reportGoogleLinkDecision(decision);
    return decision.allowed;
  } catch (error) {
    reportGoogleLinkFailure(error);
    throw error;
  }
}
