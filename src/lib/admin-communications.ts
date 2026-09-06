import "server-only";

import { db } from "@/lib/db";

const ADMIN_EMAIL = "arean.mendoza@unmsm.edu.pe";

export async function getAdminCommunications() {
  const [announcements, grants, users] = await Promise.all([
    db.announcement.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        status: true,
        priority: true,
        startsAt: true,
        endsAt: true,
        ctaLabel: true,
        ctaHref: true,
        createdAt: true,
        createdBy: { select: { name: true, email: true } },
        _count: { select: { receipts: true } },
        receipts: {
          where: { acknowledgedAt: { not: null } },
          select: { id: true },
        },
      },
    }),
    db.adminCoinGrant.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        amount: true,
        message: true,
        internalNote: true,
        createdAt: true,
        recipient: {
          select: {
            id: true,
            name: true,
            email: true,
            learnerProfile: { select: { displayName: true, nickname: true } },
          },
        },
        grantedBy: { select: { name: true, email: true } },
      },
    }),
    db.user.findMany({
      where: { email: { not: ADMIN_EMAIL } },
      orderBy: [{ learnerProfile: { displayName: "asc" } }, { email: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        learnerProfile: { select: { displayName: true, nickname: true } },
      },
    }),
  ]);

  return {
    announcements: announcements.map(({ receipts, ...announcement }) => ({
      ...announcement,
      shownCount: announcement._count.receipts,
      acknowledgedCount: receipts.length,
    })),
    grants,
    users: users.map((user) => ({
      id: user.id,
      email: user.email,
      name:
        user.learnerProfile?.displayName ??
        user.name ??
        user.email ??
        "Sin nombre",
      nickname: user.learnerProfile?.nickname ?? null,
    })),
  };
}

export async function grantAdminCoins({
  recipientUserId,
  grantedByUserId,
  requestId,
  amount,
  message,
  internalNote,
}: {
  recipientUserId: string;
  grantedByUserId: string;
  requestId: string;
  amount: number;
  message: string;
  internalNote?: string | null;
}): Promise<{ alreadyProcessed: boolean }> {
  const sourceKey = `admin_grant:${requestId}`;
  const existing = await db.coinLedgerEntry.findUnique({
    where: { userId_sourceKey: { userId: recipientUserId, sourceKey } },
    select: { id: true },
  });
  if (existing) return { alreadyProcessed: true };

  try {
    await db.$transaction(async (tx) => {
      const ledgerEntry = await tx.coinLedgerEntry.create({
        data: {
          userId: recipientUserId,
          amount,
          reason: "admin_grant",
          sourceKey,
        },
        select: { id: true },
      });
      await tx.adminCoinGrant.create({
        data: {
          recipientUserId,
          grantedByUserId,
          coinLedgerEntryId: ledgerEntry.id,
          amount,
          message,
          internalNote: internalNote || null,
        },
      });
    });
  } catch (error) {
    const retried = await db.coinLedgerEntry.findUnique({
      where: { userId_sourceKey: { userId: recipientUserId, sourceKey } },
      select: { id: true },
    });
    if (!retried) throw error;
    return { alreadyProcessed: true };
  }

  return { alreadyProcessed: false };
}
