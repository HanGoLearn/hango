import "server-only";

import { db } from "@/lib/db";
import { serverEnv } from "@/lib/env/server";

type InvitationAvailability = {
  status: "PENDING" | "ACTIVATED" | "REVOKED";
  expiresAt: Date | null;
};

export function normalizeBetaInvitationEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isBetaInviteOnly(): boolean {
  return serverEnv.HANGO_BETA_ACCESS_MODE === "INVITE_ONLY";
}

export function isPendingBetaInvitation(
  invitation: InvitationAvailability | null | undefined,
  now = new Date(),
): boolean {
  return Boolean(
    invitation?.status === "PENDING" &&
    (!invitation.expiresAt || invitation.expiresAt > now),
  );
}

/**
 * Checks whether a brand-new account may be created for this email. Existing
 * accounts do not use this function: the allowlist controls registration, not
 * ordinary sign-in or deletion of learner data.
 */
export async function canCreateBetaAccount(email: string): Promise<boolean> {
  if (!isBetaInviteOnly()) return true;

  const invitation = await db.betaInvitation.findUnique({
    where: { email: normalizeBetaInvitationEmail(email) },
    select: { status: true, expiresAt: true },
  });
  return isPendingBetaInvitation(invitation);
}

/** Records OAuth activation after Auth.js creates a new user. */
export async function activateBetaInvitationForUser({
  userId,
  email,
}: {
  userId: string;
  email: string;
}): Promise<boolean> {
  if (!isBetaInviteOnly()) return true;

  const now = new Date();
  const result = await db.betaInvitation.updateMany({
    where: {
      email: normalizeBetaInvitationEmail(email),
      status: "PENDING",
      activatedUserId: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    data: {
      status: "ACTIVATED",
      activatedUserId: userId,
      activatedAt: now,
      revokedAt: null,
    },
  });
  return result.count === 1;
}
