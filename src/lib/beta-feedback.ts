import "server-only";

import { db } from "@/lib/db";

export const BETA_FEEDBACK_CATEGORIES = [
  "BUG",
  "IDEA",
  "CONFUSING",
  "LESSON_CONTENT",
  "HAN",
  "OTHER",
] as const;

export const BETA_FEEDBACK_STATUSES = ["NEW", "REVIEWING", "RESOLVED"] as const;

export type BetaFeedbackCategory = (typeof BETA_FEEDBACK_CATEGORIES)[number];
export type BetaFeedbackStatus = (typeof BETA_FEEDBACK_STATUSES)[number];

const MAX_REPORTS_PER_DAY = 10;

export async function createBetaFeedback({
  userId,
  category,
  rating,
  message,
  path,
  locale,
}: {
  userId: string;
  category: BetaFeedbackCategory;
  rating: number | null;
  message: string;
  path: string;
  locale: "ES" | "EN";
}): Promise<"CREATED" | "RATE_LIMITED"> {
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);

  const reportsToday = await db.betaFeedback.count({
    where: { userId, createdAt: { gte: dayStart } },
  });
  if (reportsToday >= MAX_REPORTS_PER_DAY) return "RATE_LIMITED";

  await db.betaFeedback.create({
    data: {
      userId,
      category,
      rating,
      message,
      path,
      locale,
    },
  });
  return "CREATED";
}

export async function getRecentBetaFeedbackForUser(userId: string) {
  const feedback = await db.betaFeedback.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      category: true,
      rating: true,
      message: true,
      status: true,
      adminResponse: true,
      createdAt: true,
    },
  });

  return feedback.map((item) => ({
    ...item,
    createdAt: item.createdAt.toISOString(),
  }));
}

export async function getAdminBetaFeedback(status?: BetaFeedbackStatus) {
  const [items, grouped] = await Promise.all([
    db.betaFeedback.findMany({
      where: status ? { status } : undefined,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 100,
      select: {
        id: true,
        category: true,
        rating: true,
        message: true,
        path: true,
        locale: true,
        status: true,
        adminResponse: true,
        internalNote: true,
        reviewedAt: true,
        resolvedAt: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            learnerProfile: { select: { displayName: true, nickname: true } },
          },
        },
        reviewedBy: { select: { name: true, email: true } },
      },
    }),
    db.betaFeedback.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  const counts: Record<BetaFeedbackStatus, number> = {
    NEW: 0,
    REVIEWING: 0,
    RESOLVED: 0,
  };
  for (const row of grouped) counts[row.status] = row._count._all;

  return { items, counts };
}
