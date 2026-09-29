import "server-only";

import { db } from "@/lib/db";

export async function getAdminBetaInvitations() {
  const invitations = await db.betaInvitation.findMany({
    orderBy: { invitedAt: "desc" },
    take: 200,
    select: {
      id: true,
      email: true,
      status: true,
      cohort: true,
      note: true,
      expiresAt: true,
      invitedAt: true,
      activatedAt: true,
      revokedAt: true,
      createdBy: { select: { name: true, email: true } },
      activatedUser: {
        select: {
          id: true,
          name: true,
          email: true,
          learnerProfile: { select: { displayName: true, nickname: true } },
        },
      },
    },
  });

  const now = new Date();
  return {
    invitations,
    counts: {
      total: invitations.length,
      pending: invitations.filter(
        (invitation) =>
          invitation.status === "PENDING" &&
          (!invitation.expiresAt || invitation.expiresAt > now),
      ).length,
      activated: invitations.filter(
        (invitation) => invitation.status === "ACTIVATED",
      ).length,
      revoked: invitations.filter(
        (invitation) => invitation.status === "REVOKED",
      ).length,
      expired: invitations.filter(
        (invitation) =>
          invitation.status === "PENDING" &&
          Boolean(invitation.expiresAt && invitation.expiresAt <= now),
      ).length,
    },
  };
}
