import "server-only";

import { db } from "@/lib/db";

export interface LearnerAnnouncement {
  id: string;
  title: string;
  message: string;
  type: "INFO" | "UPDATE" | "MAINTENANCE" | "CELEBRATION" | "IMPORTANT";
  priority: "NORMAL" | "IMPORTANT" | "URGENT";
  ctaLabel: string | null;
  ctaHref: string | null;
}

export async function getPendingAnnouncementsForUser(
  userId: string,
  locale: "ES" | "EN",
): Promise<LearnerAnnouncement[]> {
  const now = new Date();
  const announcements = await db.announcement.findMany({
    where: {
      status: "PUBLISHED",
      startsAt: { lte: now },
      AND: [
        { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
        { OR: [{ locale: null }, { locale }] },
      ],
      receipts: { none: { userId, acknowledgedAt: { not: null } } },
    },
    orderBy: [{ createdAt: "asc" }],
    take: 10,
    select: {
      id: true,
      title: true,
      message: true,
      type: true,
      priority: true,
      ctaLabel: true,
      ctaHref: true,
    },
  });

  if (announcements.length) {
    await db.announcementReceipt.createMany({
      data: announcements.map((announcement) => ({
        announcementId: announcement.id,
        userId,
      })),
      skipDuplicates: true,
    });
  }
  return announcements;
}

export async function acknowledgeAnnouncementForUser(
  userId: string,
  announcementId: string,
): Promise<void> {
  await db.announcementReceipt.updateMany({
    where: { announcementId, userId, acknowledgedAt: null },
    data: { acknowledgedAt: new Date() },
  });
}
