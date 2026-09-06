import "server-only";

import { db } from "@/lib/db";

const ADMIN_EMAIL = "arean.mendoza@unmsm.edu.pe";
export const ADMIN_PAGE_SIZE = 20;

function dayStart(daysAgo = 0): Date {
  const now = new Date();
  const bogotaNow = new Date(now.getTime() - 5 * 60 * 60 * 1000);
  bogotaNow.setUTCHours(0, 0, 0, 0);
  return new Date(
    bogotaNow.getTime() + 5 * 60 * 60 * 1000 - daysAgo * 86_400_000,
  );
}

function monthStart(): Date {
  const now = new Date();
  const bogotaNow = new Date(now.getTime() - 5 * 60 * 60 * 1000);
  return new Date(
    Date.UTC(bogotaNow.getUTCFullYear(), bogotaNow.getUTCMonth(), 1, 5),
  );
}

export async function getAdminOverview() {
  const today = dayStart();
  const sevenDaysAgo = dayStart(6);
  const thirtyDaysAgo = dayStart(29);
  const thisMonth = monthStart();

  const [
    totalUsers,
    verifiedUsers,
    onboardedUsers,
    newToday,
    newSevenDays,
    newThirtyDays,
    activeTodayRows,
    activeSevenDayRows,
    coinTotals,
    aiToday,
    aiMonth,
    lessonsToday,
    scenariosToday,
    speakingToday,
    writingToday,
    topProfiles,
    latestUsers,
    topAiGroups,
  ] = await Promise.all([
    db.user.count({ where: { email: { not: ADMIN_EMAIL } } }),
    db.user.count({
      where: { email: { not: ADMIN_EMAIL }, emailVerified: { not: null } },
    }),
    db.learnerProfile.count({
      where: {
        user: { email: { not: ADMIN_EMAIL } },
        onboardingCompletedAt: { not: null },
      },
    }),
    db.user.count({
      where: { email: { not: ADMIN_EMAIL }, createdAt: { gte: today } },
    }),
    db.user.count({
      where: { email: { not: ADMIN_EMAIL }, createdAt: { gte: sevenDaysAgo } },
    }),
    db.user.count({
      where: { email: { not: ADMIN_EMAIL }, createdAt: { gte: thirtyDaysAgo } },
    }),
    db.coinLedgerEntry.findMany({
      where: {
        reason: "daily_login",
        createdAt: { gte: today },
        user: { email: { not: ADMIN_EMAIL } },
      },
      distinct: ["userId"],
      select: { userId: true },
    }),
    db.coinLedgerEntry.findMany({
      where: {
        reason: "daily_login",
        createdAt: { gte: sevenDaysAgo },
        user: { email: { not: ADMIN_EMAIL } },
      },
      distinct: ["userId"],
      select: { userId: true },
    }),
    db.coinLedgerEntry.aggregate({
      where: { user: { email: { not: ADMIN_EMAIL } } },
      _sum: { amount: true },
    }),
    db.aiUsageLog.aggregate({
      where: {
        createdAt: { gte: today },
        user: { email: { not: ADMIN_EMAIL } },
      },
      _sum: { estimatedCostUsd: true },
      _count: { _all: true },
    }),
    db.aiUsageLog.aggregate({
      where: {
        createdAt: { gte: thisMonth },
        user: { email: { not: ADMIN_EMAIL } },
      },
      _sum: { estimatedCostUsd: true },
      _count: { _all: true },
    }),
    db.learnerLessonCompletion.count({
      where: { completedAt: { gte: today } },
    }),
    db.scenarioCompletion.count({ where: { completedAt: { gte: today } } }),
    db.speakingSession.count({ where: { completedAt: { gte: today } } }),
    db.writingAttempt.count({ where: { submittedAt: { gte: today } } }),
    db.learnerProfile.findMany({
      where: { user: { email: { not: ADMIN_EMAIL } } },
      orderBy: { generalLevelPoints: "desc" },
      take: 5,
      select: {
        displayName: true,
        nickname: true,
        generalLevelPoints: true,
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    db.user.findMany({
      where: { email: { not: ADMIN_EMAIL } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        learnerProfile: { select: { onboardingCompletedAt: true } },
      },
    }),
    db.aiUsageLog.groupBy({
      by: ["userId"],
      where: {
        createdAt: { gte: thirtyDaysAgo },
        user: { email: { not: ADMIN_EMAIL } },
      },
      _sum: { estimatedCostUsd: true },
      _count: { _all: true },
      orderBy: { _sum: { estimatedCostUsd: "desc" } },
      take: 5,
    }),
  ]);

  const topAiUsers = topAiGroups.length
    ? await db.user.findMany({
        where: { id: { in: topAiGroups.map((row) => row.userId) } },
        select: {
          id: true,
          name: true,
          email: true,
          learnerProfile: { select: { displayName: true } },
        },
      })
    : [];
  const aiByUserId = new Map(topAiGroups.map((row) => [row.userId, row]));

  return {
    generatedAt: new Date(),
    users: {
      total: totalUsers,
      verified: verifiedUsers,
      onboarded: onboardedUsers,
      newToday,
      newSevenDays,
      newThirtyDays,
      activeToday: activeTodayRows.length,
      activeSevenDays: activeSevenDayRows.length,
    },
    economy: { circulation: coinTotals._sum.amount ?? 0 },
    ai: {
      todayCostUsd: aiToday._sum.estimatedCostUsd ?? 0,
      todayCalls: aiToday._count._all,
      monthCostUsd: aiMonth._sum.estimatedCostUsd ?? 0,
      monthCalls: aiMonth._count._all,
    },
    activityToday: {
      lessons: lessonsToday,
      scenarios: scenariosToday,
      speaking: speakingToday,
      writing: writingToday,
    },
    topProgress: topProfiles.map((profile) => ({
      id: profile.user.id,
      name:
        profile.displayName ??
        profile.user.name ??
        profile.user.email ??
        "Sin nombre",
      nickname: profile.nickname,
      points: profile.generalLevelPoints,
    })),
    latestUsers,
    topAiUsers: topAiUsers
      .map((user) => ({
        id: user.id,
        name:
          user.learnerProfile?.displayName ??
          user.name ??
          user.email ??
          "Sin nombre",
        email: user.email,
        costUsd: aiByUserId.get(user.id)?._sum.estimatedCostUsd ?? 0,
        calls: aiByUserId.get(user.id)?._count._all ?? 0,
      }))
      .sort((a, b) => b.costUsd - a.costUsd),
  };
}

export type AdminUserStatus = "all" | "onboarded" | "pending" | "unverified";

export async function getAdminUsers({
  query = "",
  status = "all",
  page = 1,
}: {
  query?: string;
  status?: AdminUserStatus;
  page?: number;
}) {
  const normalizedQuery = query.trim();
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const profileStatus =
    status === "onboarded"
      ? { is: { onboardingCompletedAt: { not: null } } }
      : status === "pending"
        ? { isNot: { onboardingCompletedAt: { not: null } } }
        : undefined;

  const where = {
    email: { not: ADMIN_EMAIL },
    ...(normalizedQuery
      ? {
          OR: [
            {
              name: { contains: normalizedQuery, mode: "insensitive" as const },
            },
            {
              email: {
                contains: normalizedQuery,
                mode: "insensitive" as const,
              },
            },
            {
              learnerProfile: {
                is: {
                  OR: [
                    {
                      displayName: {
                        contains: normalizedQuery,
                        mode: "insensitive" as const,
                      },
                    },
                    {
                      nickname: {
                        contains: normalizedQuery,
                        mode: "insensitive" as const,
                      },
                    },
                  ],
                },
              },
            },
          ],
        }
      : {}),
    ...(status === "unverified" ? { emailVerified: null } : {}),
    ...(profileStatus ? { learnerProfile: profileStatus } : {}),
  };

  const [total, users] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        role: true,
        createdAt: true,
        learnerProfile: {
          select: {
            displayName: true,
            nickname: true,
            currentLevel: true,
            generalLevelPoints: true,
            onboardingCompletedAt: true,
          },
        },
      },
    }),
  ]);

  const ids = users.map((user) => user.id);
  const [coinGroups, aiGroups, lastAccessGroups] = ids.length
    ? await Promise.all([
        db.coinLedgerEntry.groupBy({
          by: ["userId"],
          where: { userId: { in: ids } },
          _sum: { amount: true },
        }),
        db.aiUsageLog.groupBy({
          by: ["userId"],
          where: { userId: { in: ids }, createdAt: { gte: monthStart() } },
          _sum: { estimatedCostUsd: true },
        }),
        db.coinLedgerEntry.groupBy({
          by: ["userId"],
          where: { userId: { in: ids }, reason: "daily_login" },
          _max: { createdAt: true },
        }),
      ])
    : [[], [], []];

  const coins = new Map(
    coinGroups.map((row) => [row.userId, row._sum.amount ?? 0]),
  );
  const ai = new Map(
    aiGroups.map((row) => [row.userId, row._sum.estimatedCostUsd ?? 0]),
  );
  const lastAccess = new Map(
    lastAccessGroups.map((row) => [row.userId, row._max.createdAt]),
  );

  return {
    users: users.map((user) => ({
      ...user,
      coinBalance: coins.get(user.id) ?? 0,
      monthAiCostUsd: ai.get(user.id) ?? 0,
      lastAccessAt: lastAccess.get(user.id) ?? null,
    })),
    total,
    page: safePage,
    pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)),
  };
}

export async function getAdminUserDetail(userId: string) {
  const [user, coinTotals, aiMonth, recentCoins, recentAi] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        role: true,
        createdAt: true,
        learnerProfile: true,
        avatar: { select: { animal: true } },
        _count: {
          select: {
            lessonCompletions: true,
            scenarioCompletions: true,
            speakingSessions: true,
            writingAttempts: true,
          },
        },
      },
    }),
    db.coinLedgerEntry.aggregate({ where: { userId }, _sum: { amount: true } }),
    db.aiUsageLog.aggregate({
      where: { userId, createdAt: { gte: monthStart() } },
      _sum: { estimatedCostUsd: true },
      _count: { _all: true },
    }),
    db.coinLedgerEntry.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, amount: true, reason: true, createdAt: true },
    }),
    db.aiUsageLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        feature: true,
        model: true,
        estimatedCostUsd: true,
        createdAt: true,
      },
    }),
  ]);

  if (!user || user.email?.toLowerCase() === ADMIN_EMAIL) return null;

  return {
    user,
    coinBalance: coinTotals._sum.amount ?? 0,
    monthAiCostUsd: aiMonth._sum.estimatedCostUsd ?? 0,
    monthAiCalls: aiMonth._count._all,
    recentCoins,
    recentAi,
  };
}
