import "server-only";

import { ACHIEVEMENTS_BY_KEY } from "@/lib/achievements-catalog";
import { ADMIN_EMAIL } from "@/lib/admin-identity";
import { FEATURE_LABELS } from "@/lib/admin-ai-usage";
import { db } from "@/lib/db";
import { hskLevelForPoints } from "@/lib/points-system";
import { getStudyStreak } from "@/lib/dashboard-data";
export const ADMIN_PAGE_SIZE = 20;

const ACTIVITY_SURFACES = [
  ["GENERAL", "Navegación general"],
  ["LEARNING_JOURNEY", "Learning Journey"],
  ["HAN_TUTOR", "Han Tutor"],
  ["HAN_COMPANION", "Han Companion"],
  ["SPEAKING_LAB", "Speaking Lab"],
  ["WRITING_LAB", "Writing Lab"],
  ["MISSIONS", "Missions"],
  ["HAN_VOCABULARY", "HanVocabulary"],
  ["PLACEMENT", "Placement"],
] as const;

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

function bogotaDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function hasRolePlayContext(value: unknown): boolean {
  return Boolean(
    value &&
    typeof value === "object" &&
    "rolePlay" in value &&
    (value as { rolePlay?: unknown }).rolePlay,
  );
}

/**
 * `excludeUserId` replaces a `user: { email: { not: ADMIN_EMAIL } } }` join
 * on every activity table below (2026-09-08 optimization pass) - the
 * caller (the admin page, which already resolved the logged-in
 * administrator's id via requireAdministrator() to even reach this page)
 * passes it in directly, turning an unindexable per-row join against User
 * into a plain filter on each table's own indexed userId column. The two
 * direct `db.user...` queries below still filter by ADMIN_EMAIL - a
 * `{not: ...}` on User's own (small, uniquely-indexed) email column was
 * never the join-cost problem this pass targets.
 */
export async function getAdminOverview(excludeUserId: string) {
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
        userId: { not: excludeUserId },
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
        userId: { not: excludeUserId },
      },
      distinct: ["userId"],
      select: { userId: true },
    }),
    db.coinLedgerEntry.findMany({
      where: {
        reason: "daily_login",
        createdAt: { gte: sevenDaysAgo },
        userId: { not: excludeUserId },
      },
      distinct: ["userId"],
      select: { userId: true },
    }),
    db.coinLedgerEntry.aggregate({
      where: { userId: { not: excludeUserId } },
      _sum: { amount: true },
    }),
    db.aiUsageLog.aggregate({
      where: {
        createdAt: { gte: today },
        userId: { not: excludeUserId },
      },
      _sum: { estimatedCostUsd: true },
      _count: { _all: true },
    }),
    db.aiUsageLog.aggregate({
      where: {
        createdAt: { gte: thisMonth },
        userId: { not: excludeUserId },
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
      where: { userId: { not: excludeUserId } },
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
        userId: { not: excludeUserId },
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
        db.learnerActivitySession.groupBy({
          by: ["userId"],
          where: { userId: { in: ids } },
          _max: { lastActiveAt: true },
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
    lastAccessGroups.map((row) => [row.userId, row._max.lastActiveAt]),
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
  const user = await db.user.findUnique({
    where: { id: userId },
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
          learningGoals: true,
          skillPriorities: true,
          dailyStudyTargetMinutes: true,
          interfaceLanguage: true,
          explanationLanguage: true,
          correctionStyle: true,
          explanationStyle: true,
          conversationStyle: true,
          onboardingCompletedAt: true,
          aiConversationStorageEnabled: true,
        },
      },
      avatar: { select: { animal: true } },
      _count: {
        select: {
          lessonCompletions: true,
          scenarioCompletions: true,
          speakingSessions: true,
          writingAttempts: true,
          missionAttempts: true,
          quizAttempts: true,
          achievements: true,
          placementSessions: true,
          vocabularyInteractions: true,
        },
      },
    },
  });
  if (!user || user.email?.toLowerCase() === ADMIN_EMAIL) return null;

  const thirtyDaysAgo = dayStart(29);
  const thisMonth = monthStart();
  const [
    coinTotals,
    coinEarned,
    coinSpent,
    aiMonthRows,
    recentCoins,
    recentAi,
    activityBySurfaceRows,
    activityDayRows,
    activityAllTime,
    streak,
    completedSpeaking,
    submittedWriting,
    completedMissions,
    completedQuizSummary,
    latestPlacement,
    recentAchievements,
    storedHanMessageCount,
    recentHanMessages,
  ] = await Promise.all([
    db.coinLedgerEntry.aggregate({ where: { userId }, _sum: { amount: true } }),
    db.coinLedgerEntry.aggregate({
      where: { userId, amount: { gt: 0 } },
      _sum: { amount: true },
    }),
    db.coinLedgerEntry.aggregate({
      where: { userId, amount: { lt: 0 } },
      _sum: { amount: true },
    }),
    db.aiUsageLog.findMany({
      where: { userId, createdAt: { gte: thisMonth } },
      select: {
        feature: true,
        inputTokens: true,
        outputTokens: true,
        estimatedCostUsd: true,
        durationSeconds: true,
      },
    }),
    db.coinLedgerEntry.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, amount: true, reason: true, createdAt: true },
    }),
    db.aiUsageLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        feature: true,
        provider: true,
        model: true,
        inputTokens: true,
        outputTokens: true,
        estimatedCostUsd: true,
        calculationMethod: true,
        inputRateUsdPerMillionTokens: true,
        outputRateUsdPerMillionTokens: true,
        audioRateUsdPerMinute: true,
        durationSeconds: true,
        durationSource: true,
        createdAt: true,
      },
    }),
    db.learnerActivitySession.groupBy({
      by: ["surface"],
      where: { userId, lastActiveAt: { gte: thirtyDaysAgo } },
      _sum: { activeSeconds: true, interactionCount: true },
      _count: { _all: true },
      _max: { lastActiveAt: true },
    }),
    db.learnerActivitySession.findMany({
      where: { userId, lastActiveAt: { gte: thirtyDaysAgo } },
      select: { lastActiveAt: true },
    }),
    db.learnerActivitySession.aggregate({
      where: { userId },
      _sum: { activeSeconds: true, interactionCount: true },
      _count: { _all: true },
      _max: { lastActiveAt: true },
    }),
    getStudyStreak(userId),
    db.speakingSession.count({
      where: { userId, completionState: "COMPLETED" },
    }),
    db.writingAttempt.count({
      where: { userId, submittedAt: { not: null } },
    }),
    db.missionAttempt.count({
      where: { userId, completionState: "COMPLETED" },
    }),
    db.quizAttempt.aggregate({
      where: { userId, completedAt: { not: null } },
      _count: { _all: true },
      _avg: { score: true },
    }),
    db.placementSession.findFirst({
      where: { userId },
      orderBy: { startedAt: "desc" },
      select: {
        status: true,
        startedAt: true,
        completedAt: true,
        vocabularyHskLevel: true,
        grammarHskLevel: true,
        readingHskLevel: true,
        listeningHskLevel: true,
        _count: { select: { attempts: true } },
      },
    }),
    db.achievement.findMany({
      where: { userId },
      orderBy: { unlockedAt: "desc" },
      take: 6,
      select: { id: true, key: true, unlockedAt: true },
    }),
    db.aiMessage.count({ where: { conversation: { userId } } }),
    db.aiMessage.findMany({
      where: { conversation: { userId } },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        role: true,
        content: true,
        contextSnapshot: true,
        createdAt: true,
      },
    }),
  ]);

  const aiFeatureMap = new Map<
    string,
    {
      feature: string;
      label: string;
      calls: number;
      costUsd: number;
      inputTokens: number;
      outputTokens: number;
      durationSeconds: number;
    }
  >();
  for (const row of aiMonthRows) {
    const current = aiFeatureMap.get(row.feature) ?? {
      feature: row.feature,
      label:
        FEATURE_LABELS[row.feature as keyof typeof FEATURE_LABELS] ??
        row.feature,
      calls: 0,
      costUsd: 0,
      inputTokens: 0,
      outputTokens: 0,
      durationSeconds: 0,
    };
    current.calls += 1;
    current.costUsd += row.estimatedCostUsd;
    current.inputTokens += row.inputTokens ?? 0;
    current.outputTokens += row.outputTokens ?? 0;
    current.durationSeconds += row.durationSeconds ?? 0;
    aiFeatureMap.set(row.feature, current);
  }
  const aiByFeature = [...aiFeatureMap.values()].sort(
    (a, b) => b.costUsd - a.costUsd,
  );

  const activityRowMap = new Map(
    activityBySurfaceRows.map((row) => [row.surface, row]),
  );
  const activityBySurface = ACTIVITY_SURFACES.map(([surface, label]) => {
    const row = activityRowMap.get(surface);
    return {
      surface,
      label,
      activeSeconds: row?._sum.activeSeconds ?? 0,
      interactions: row?._sum.interactionCount ?? 0,
      sessions: row?._count._all ?? 0,
      lastActiveAt: row?._max.lastActiveAt ?? null,
    };
  });
  const monthAiCostUsd = aiMonthRows.reduce(
    (total, row) => total + row.estimatedCostUsd,
    0,
  );

  return {
    user,
    coinBalance: coinTotals._sum.amount ?? 0,
    coinsEarned: coinEarned._sum.amount ?? 0,
    coinsSpent: Math.abs(coinSpent._sum.amount ?? 0),
    monthAiCostUsd,
    monthAiCalls: aiMonthRows.length,
    aiByFeature,
    recentCoins,
    recentAi: recentAi.map((entry) => ({
      ...entry,
      label:
        FEATURE_LABELS[entry.feature as keyof typeof FEATURE_LABELS] ??
        entry.feature,
    })),
    activity: {
      lastActiveAt: activityAllTime._max.lastActiveAt,
      allTimeSeconds: activityAllTime._sum.activeSeconds ?? 0,
      allTimeSessions: activityAllTime._count._all,
      allTimeInteractions: activityAllTime._sum.interactionCount ?? 0,
      thirtyDaySeconds: activityBySurface.reduce(
        (total, row) => total + row.activeSeconds,
        0,
      ),
      thirtyDaySessions: activityBySurface.reduce(
        (total, row) => total + row.sessions,
        0,
      ),
      activeDaysThirty: new Set(
        activityDayRows.map((row) => bogotaDateKey(row.lastActiveAt)),
      ).size,
      bySurface: activityBySurface,
    },
    learning: {
      levelLabel: hskLevelForPoints(
        user.learnerProfile?.generalLevelPoints ?? 0,
      ),
      streak,
      completedSpeaking,
      submittedWriting,
      completedMissions,
      completedQuizzes: completedQuizSummary._count._all,
      averageQuizScore: completedQuizSummary._avg.score,
      latestPlacement,
      recentAchievements: recentAchievements.map((achievement) => ({
        ...achievement,
        title:
          ACHIEVEMENTS_BY_KEY.get(achievement.key)?.title ?? achievement.key,
      })),
    },
    hanHistory: {
      storageEnabled: user.learnerProfile?.aiConversationStorageEnabled ?? true,
      storedMessageCount: storedHanMessageCount,
      recentMessages: recentHanMessages
        .filter((message) => !hasRolePlayContext(message.contextSnapshot))
        .slice(0, 8)
        .reverse()
        .map(({ contextSnapshot: _contextSnapshot, ...message }) => message),
    },
  };
}
