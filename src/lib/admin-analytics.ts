import "server-only";

import { ADMIN_EMAIL } from "@/lib/admin-identity";
import { db } from "@/lib/db";
import { FEATURE_LABELS } from "@/lib/admin-ai-usage";
import { DEFAULT_DAILY_CAP_USD } from "@/lib/ai-usage";
const DAY_MS = 86_400_000;
const BOGOTA_OFFSET_MS = 5 * 60 * 60 * 1000;

const ACTIVITY_SURFACE_LABELS = {
  GENERAL: "Navegación general",
  LEARNING_JOURNEY: "Learning Journey",
  HAN_TUTOR: "Han Tutor",
  HAN_COMPANION: "Han Companion",
  SPEAKING_LAB: "Speaking Lab",
  WRITING_LAB: "Writing Lab",
  MISSIONS: "Missions",
  HAN_VOCABULARY: "HanVocabulary",
  PLACEMENT: "Placement",
} as const;

export type AnalyticsPeriod = 7 | 30 | 90;

function bogotaDayNumber(date: Date): number {
  return Math.floor((date.getTime() - BOGOTA_OFFSET_MS) / DAY_MS);
}

function dayStart(daysAgo: number): Date {
  const dayNumber = bogotaDayNumber(new Date()) - daysAgo;
  return new Date(dayNumber * DAY_MS + BOGOTA_OFFSET_MS);
}

function percent(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 1000) / 10 : 0;
}

function uniqueUsers<T extends { userId: string }>(rows: T[]): number {
  return new Set(rows.map((row) => row.userId)).size;
}

function unionSize(...sets: Set<string>[]): number {
  return new Set(sets.flatMap((set) => [...set])).size;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1]! + sorted[middle]!) / 2
    : sorted[middle]!;
}

/**
 * `excludeUserId` replaces a `user: { email: { not: ADMIN_EMAIL } } }` join
 * on every activity table below (2026-09-08 optimization pass) - the
 * caller (the admin page, which already resolved the logged-in
 * administrator's id via requireAdministrator() to even reach this page)
 * passes it in directly, turning an unindexable per-row join against User
 * into a plain filter on each table's own indexed userId column. The two
 * direct `db.user.findMany` cohort queries still filter by ADMIN_EMAIL - a
 * `{not: ...}` on User's own (small, uniquely-indexed) email column was
 * never the join-cost problem this pass targets.
 */
export async function getAdminAnalytics(
  period: AnalyticsPeriod,
  excludeUserId: string,
) {
  const now = new Date();
  const periodStart = dayStart(period - 1);
  const previousStart = dayStart(period * 2 - 1);
  const retentionStart = dayStart(120);
  const todayStart = dayStart(0);
  const fourteenDaysAgo = dayStart(13);
  const activityStart = new Date(
    Math.min(previousStart.getTime(), retentionStart.getTime()),
  );

  const [
    cohortUsers,
    retentionUsers,
    allOnboardedProfiles,
    activitySessions,
    lessonStarts,
    lessonCompletions,
    scenarioCompletions,
    speakingCompletions,
    writingSubmissions,
    missionCompletions,
    placementCompletions,
    vocabularyInteractions,
    vocabularyQuizAttempts,
    aiByUserFeature,
    aiByFeatureModel,
    aiTodayByUserFeature,
    aiCaps,
    coinEntries,
    avatarOwners,
    accessoryOwners,
    achievementOwners,
    leaderboardParticipants,
    previousLessonCount,
    previousScenarioCount,
    previousSpeakingCount,
    previousWritingCount,
    previousMissionCount,
  ] = await Promise.all([
    db.user.findMany({
      where: { email: { not: ADMIN_EMAIL }, createdAt: { gte: periodStart } },
      select: {
        id: true,
        createdAt: true,
        emailVerified: true,
        learnerProfile: { select: { onboardingCompletedAt: true } },
      },
    }),
    db.user.findMany({
      where: {
        email: { not: ADMIN_EMAIL },
        createdAt: { gte: retentionStart },
      },
      select: { id: true, createdAt: true },
    }),
    db.learnerProfile.findMany({
      where: {
        onboardingCompletedAt: { not: null },
        userId: { not: excludeUserId },
      },
      select: { userId: true },
    }),
    db.learnerActivitySession.findMany({
      where: {
        lastActiveAt: { gte: activityStart },
        userId: { not: excludeUserId },
      },
      select: {
        userId: true,
        clientSessionId: true,
        surface: true,
        startedAt: true,
        lastActiveAt: true,
        activeSeconds: true,
        interactionCount: true,
      },
    }),
    db.learnerLessonProgress.findMany({
      where: { startedAt: { gte: periodStart } },
      select: { userId: true, startedAt: true },
    }),
    db.learnerLessonCompletion.findMany({
      where: { completedAt: { gte: periodStart } },
      select: { userId: true, completedAt: true },
    }),
    db.scenarioCompletion.findMany({
      where: { completedAt: { gte: periodStart } },
      select: { userId: true, completedAt: true },
    }),
    db.speakingSession.findMany({
      where: {
        completionState: "COMPLETED",
        completedAt: { gte: periodStart },
      },
      select: { userId: true, completedAt: true },
    }),
    db.writingAttempt.findMany({
      where: { submittedAt: { gte: periodStart } },
      select: { userId: true, submittedAt: true },
    }),
    db.missionAttempt.findMany({
      where: {
        completionState: "COMPLETED",
        completedAt: { gte: periodStart },
      },
      select: { userId: true, completedAt: true },
    }),
    db.placementSession.findMany({
      where: { status: "COMPLETED", completedAt: { gte: periodStart } },
      select: { userId: true, completedAt: true },
    }),
    db.learnerVocabularyInteraction.findMany({
      where: { createdAt: { gte: periodStart } },
      select: { userId: true, createdAt: true },
    }),
    db.vocabularyQuizAttempt.findMany({
      where: { createdAt: { gte: periodStart } },
      select: { userId: true, createdAt: true },
    }),
    db.aiUsageLog.groupBy({
      by: ["userId", "feature"],
      where: {
        createdAt: { gte: periodStart },
        userId: { not: excludeUserId },
      },
      _sum: { estimatedCostUsd: true },
      _count: { _all: true },
    }),
    db.aiUsageLog.groupBy({
      by: [
        "feature",
        "provider",
        "model",
        "calculationMethod",
        "durationSource",
        "inputRateUsdPerMillionTokens",
        "outputRateUsdPerMillionTokens",
        "audioRateUsdPerMinute",
      ],
      where: {
        createdAt: { gte: periodStart },
        userId: { not: excludeUserId },
      },
      _sum: {
        estimatedCostUsd: true,
        inputTokens: true,
        outputTokens: true,
        durationSeconds: true,
      },
      _count: { _all: true },
    }),
    db.aiUsageLog.groupBy({
      by: ["userId", "feature"],
      where: {
        createdAt: { gte: todayStart },
        userId: { not: excludeUserId },
      },
      _sum: { estimatedCostUsd: true },
      _count: { _all: true },
    }),
    db.aiUsageCap.findMany(),
    db.coinLedgerEntry.findMany({
      where: {
        createdAt: { gte: periodStart },
        userId: { not: excludeUserId },
      },
      select: { userId: true, amount: true, reason: true },
    }),
    db.learnerAvatar.findMany({
      where: { userId: { not: excludeUserId } },
      select: { userId: true },
    }),
    db.learnerAccessoryOwnership.findMany({
      where: { userId: { not: excludeUserId } },
      distinct: ["userId"],
      select: { userId: true },
    }),
    db.achievement.findMany({
      where: { userId: { not: excludeUserId } },
      distinct: ["userId"],
      select: { userId: true },
    }),
    db.learnerProfile.count({
      where: {
        generalLevelPoints: { gt: 0 },
        userId: { not: excludeUserId },
      },
    }),
    db.learnerLessonCompletion.count({
      where: { completedAt: { gte: previousStart, lt: periodStart } },
    }),
    db.scenarioCompletion.count({
      where: { completedAt: { gte: previousStart, lt: periodStart } },
    }),
    db.speakingSession.count({
      where: {
        completionState: "COMPLETED",
        completedAt: { gte: previousStart, lt: periodStart },
      },
    }),
    db.writingAttempt.count({
      where: { submittedAt: { gte: previousStart, lt: periodStart } },
    }),
    db.missionAttempt.count({
      where: {
        completionState: "COMPLETED",
        completedAt: { gte: previousStart, lt: periodStart },
      },
    }),
  ]);

  const cohortIds = new Set(cohortUsers.map((user) => user.id));
  const verifiedIds = new Set(
    cohortUsers.filter((user) => user.emailVerified).map((user) => user.id),
  );
  const onboardedIds = new Set(
    cohortUsers
      .filter((user) => user.learnerProfile?.onboardingCompletedAt)
      .map((user) => user.id),
  );
  const startedIds = new Set(
    lessonStarts
      .filter((row) => cohortIds.has(row.userId))
      .map((row) => row.userId),
  );
  const completedLessonIds = new Set(
    lessonCompletions
      .filter((row) => cohortIds.has(row.userId))
      .map((row) => row.userId),
  );
  const completedScenarioIds = new Set(
    scenarioCompletions
      .filter((row) => cohortIds.has(row.userId))
      .map((row) => row.userId),
  );

  const funnelSets = [
    cohortIds,
    verifiedIds,
    new Set([...onboardedIds].filter((id) => verifiedIds.has(id))),
  ];
  funnelSets.push(
    new Set([...startedIds].filter((id) => funnelSets[2]!.has(id))),
  );
  funnelSets.push(
    new Set([...completedLessonIds].filter((id) => funnelSets[3]!.has(id))),
  );
  funnelSets.push(
    new Set([...completedScenarioIds].filter((id) => funnelSets[4]!.has(id))),
  );
  const funnelLabels = [
    "Registro",
    "Correo verificado",
    "Onboarding completo",
    "Primera lección iniciada",
    "Primera lección completada",
    "Primer escenario completado",
  ];
  const funnel = funnelSets.map((set, index) => ({
    label: funnelLabels[index]!,
    users: set.size,
    conversionFromRegistration: percent(set.size, cohortIds.size),
    conversionFromPrevious:
      index === 0 ? 100 : percent(set.size, funnelSets[index - 1]!.size),
  }));

  const activityDaysByUser = new Map<string, Set<number>>();
  for (const activity of activitySessions) {
    const days = activityDaysByUser.get(activity.userId) ?? new Set<number>();
    days.add(bogotaDayNumber(activity.lastActiveAt));
    activityDaysByUser.set(activity.userId, days);
  }
  const currentDay = bogotaDayNumber(now);
  const retention = ([1, 7, 30] as const).map((day) => {
    const eligible = retentionUsers.filter(
      (user) => currentDay - bogotaDayNumber(user.createdAt) >= day,
    );
    const returned = eligible.filter((user) =>
      activityDaysByUser
        .get(user.id)
        ?.has(bogotaDayNumber(user.createdAt) + day),
    ).length;
    return {
      day,
      eligible: eligible.length,
      returned,
      rate: percent(returned, eligible.length),
    };
  });

  const currentActivitySessions = activitySessions.filter(
    (session) => session.lastActiveAt >= periodStart,
  );
  const currentActiveDaysByUser = new Map<string, Set<number>>();
  for (const activity of currentActivitySessions) {
    const days =
      currentActiveDaysByUser.get(activity.userId) ?? new Set<number>();
    days.add(bogotaDayNumber(activity.lastActiveAt));
    currentActiveDaysByUser.set(activity.userId, days);
  }
  const activeUsers = currentActiveDaysByUser.size;
  const returningUsers = [...currentActiveDaysByUser.values()].filter(
    (days) => days.size >= 2,
  ).length;
  const highlyEngagedUsers = [...currentActiveDaysByUser.values()].filter(
    (days) => days.size >= 4,
  ).length;
  const recentActivityIds = new Set(
    activitySessions
      .filter((row) => row.lastActiveAt >= fourteenDaysAgo)
      .map((row) => row.userId),
  );
  const onboardedUserIds = new Set(
    allOnboardedProfiles.map((profile) => profile.userId),
  );
  const dormantUsers = allOnboardedProfiles.filter(
    (profile) => !recentActivityIds.has(profile.userId),
  ).length;
  const currentLogicalSessions = new Map<string, number>();
  for (const row of currentActivitySessions) {
    const key = `${row.userId}:${row.clientSessionId}`;
    currentLogicalSessions.set(
      key,
      (currentLogicalSessions.get(key) ?? 0) + row.activeSeconds,
    );
  }
  const totalActiveSeconds = [...currentLogicalSessions.values()].reduce(
    (total, seconds) => total + seconds,
    0,
  );
  const previousActivitySessions = activitySessions.filter(
    (row) =>
      row.lastActiveAt >= previousStart && row.lastActiveAt < periodStart,
  );
  const previousActiveSeconds = previousActivitySessions.reduce(
    (total, row) => total + row.activeSeconds,
    0,
  );
  const activeTimeChange =
    previousActiveSeconds > 0
      ? Math.round(
          ((totalActiveSeconds - previousActiveSeconds) /
            previousActiveSeconds) *
            1000,
        ) / 10
      : null;
  const activityBySurface = new Map<
    string,
    {
      users: Set<string>;
      sessions: Set<string>;
      activeSeconds: number;
      interactions: number;
    }
  >();
  for (const row of currentActivitySessions) {
    const summary = activityBySurface.get(row.surface) ?? {
      users: new Set<string>(),
      sessions: new Set<string>(),
      activeSeconds: 0,
      interactions: 0,
    };
    summary.users.add(row.userId);
    summary.sessions.add(`${row.userId}:${row.clientSessionId}`);
    summary.activeSeconds += row.activeSeconds;
    summary.interactions += row.interactionCount;
    activityBySurface.set(row.surface, summary);
  }
  const surfaceActivity = [...activityBySurface.entries()]
    .map(([surface, summary]) => ({
      surface,
      label:
        ACTIVITY_SURFACE_LABELS[
          surface as keyof typeof ACTIVITY_SURFACE_LABELS
        ] ?? surface,
      users: summary.users.size,
      sessions: summary.sessions.size,
      activeSeconds: summary.activeSeconds,
      interactions: summary.interactions,
    }))
    .sort((a, b) => b.activeSeconds - a.activeSeconds);
  const dau = uniqueUsers(
    activitySessions.filter((row) => row.lastActiveAt >= todayStart),
  );
  const wau = uniqueUsers(
    activitySessions.filter((row) => row.lastActiveAt >= dayStart(6)),
  );
  const mau = uniqueUsers(
    activitySessions.filter((row) => row.lastActiveAt >= dayStart(29)),
  );
  const onboardedAvatarOwners = avatarOwners.filter((owner) =>
    onboardedUserIds.has(owner.userId),
  ).length;

  const learningJourneyUsers = new Set([
    ...lessonCompletions.map((row) => row.userId),
    ...scenarioCompletions.map((row) => row.userId),
  ]);
  const speakingUsers = new Set(speakingCompletions.map((row) => row.userId));
  const writingUsers = new Set(writingSubmissions.map((row) => row.userId));
  const missionUsers = new Set(missionCompletions.map((row) => row.userId));
  const placementUsers = new Set(placementCompletions.map((row) => row.userId));
  const vocabularyUsers = new Set([
    ...vocabularyInteractions.map((row) => row.userId),
    ...vocabularyQuizAttempts.map((row) => row.userId),
  ]);
  const featureUsers = new Map<string, Set<string>>();
  const featureCalls = new Map<string, number>();
  const featureCosts = new Map<string, number>();
  for (const row of aiByUserFeature) {
    const users = featureUsers.get(row.feature) ?? new Set<string>();
    users.add(row.userId);
    featureUsers.set(row.feature, users);
    featureCalls.set(
      row.feature,
      (featureCalls.get(row.feature) ?? 0) + row._count._all,
    );
    featureCosts.set(
      row.feature,
      (featureCosts.get(row.feature) ?? 0) + (row._sum.estimatedCostUsd ?? 0),
    );
  }
  const featureSetUsers = (features: string[]) =>
    new Set(
      features.flatMap((feature) => [...(featureUsers.get(feature) ?? [])]),
    );
  const featureSetCalls = (features: string[]) =>
    features.reduce(
      (total, feature) => total + (featureCalls.get(feature) ?? 0),
      0,
    );
  const featureSetCost = (features: string[]) =>
    features.reduce(
      (total, feature) => total + (featureCosts.get(feature) ?? 0),
      0,
    );

  const tutorFeatures = ["ai-teacher-chat", "han-teacher-transcribe"];
  const companionFeatures = ["han-realtime-assessment"];
  const vocabularyFeatures = ["vocabulary-lookup"];
  const systemMetrics = [
    {
      key: "learning-journey",
      label: "Learning Journey",
      actions: lessonCompletions.length + scenarioCompletions.length,
      users: learningJourneyUsers.size,
      costUsd: featureSetCost([
        "welcome-audio",
        "dialogue-audio",
        "grammar-audio",
        "vocabulary-audio",
        "lesson-reflection",
      ]),
      detail: `${lessonCompletions.length} lecciones · ${scenarioCompletions.length} escenarios`,
    },
    {
      key: "han-tutor",
      label: "Han Tutor",
      actions: featureSetCalls(tutorFeatures),
      users: featureSetUsers(tutorFeatures).size,
      costUsd: featureSetCost(tutorFeatures),
      detail: "Consultas y transcripciones del tutor lateral",
    },
    {
      key: "han-companion",
      label: "Han Companion",
      actions: featureSetCalls(companionFeatures),
      users: featureSetUsers(companionFeatures).size,
      costUsd: featureSetCost(companionFeatures),
      detail: "Turnos evaluados de conversación libre",
    },
    {
      key: "speaking-lab",
      label: "Speaking Lab",
      actions: speakingCompletions.length,
      users: speakingUsers.size,
      costUsd: featureSetCost([
        "speaking-feedback",
        "speaking-transcribe",
        "speaking-scenario",
        "free-topic-feedback",
      ]),
      detail: "Sesiones de laboratorio completadas",
    },
    {
      key: "writing-lab",
      label: "Writing Lab",
      actions: writingSubmissions.length,
      users: writingUsers.size,
      costUsd: featureSetCost(["writing-feedback", "handwritten-writing"]),
      detail: "Entregas enviadas para evaluación",
    },
    {
      key: "missions",
      label: "Missions",
      actions: missionCompletions.length,
      users: missionUsers.size,
      costUsd: featureSetCost(["mission-chat", "mission-report"]),
      detail: "Misiones de comunicación completadas",
    },
    {
      key: "han-vocabulary",
      label: "HanVocabulary",
      actions: vocabularyInteractions.length + vocabularyQuizAttempts.length,
      users: unionSize(vocabularyUsers, featureSetUsers(vocabularyFeatures)),
      costUsd: featureSetCost(vocabularyFeatures),
      detail: `${vocabularyInteractions.length} palabras exploradas · ${vocabularyQuizAttempts.length} respuestas`,
    },
    {
      key: "placement",
      label: "Placement",
      actions: placementCompletions.length,
      users: placementUsers.size,
      costUsd: featureSetCost([
        "placement-grading",
        "placement-listening-audio",
      ]),
      detail: "Evaluaciones de nivel completadas",
    },
  ];

  const dayFormatter = new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    timeZone: "America/Bogota",
  });
  const trendMap = new Map<
    number,
    { active: Set<string>; completions: number }
  >();
  for (let index = 0; index < period; index += 1) {
    trendMap.set(bogotaDayNumber(periodStart) + index, {
      active: new Set(),
      completions: 0,
    });
  }
  for (const row of currentActivitySessions) {
    trendMap.get(bogotaDayNumber(row.lastActiveAt))?.active.add(row.userId);
  }
  const completionDates = [
    ...lessonCompletions.map((row) => row.completedAt),
    ...scenarioCompletions.map((row) => row.completedAt),
    ...speakingCompletions.flatMap((row) =>
      row.completedAt ? [row.completedAt] : [],
    ),
    ...writingSubmissions.flatMap((row) =>
      row.submittedAt ? [row.submittedAt] : [],
    ),
    ...missionCompletions.flatMap((row) =>
      row.completedAt ? [row.completedAt] : [],
    ),
  ];
  for (const date of completionDates) {
    const bucket = trendMap.get(bogotaDayNumber(date));
    if (bucket) bucket.completions += 1;
  }
  const trend = [...trendMap.entries()].map(([day, values]) => ({
    day: new Date(day * DAY_MS + BOGOTA_OFFSET_MS),
    label: dayFormatter.format(new Date(day * DAY_MS + BOGOTA_OFFSET_MS)),
    activeUsers: values.active.size,
    completions: values.completions,
  }));

  const earnedCoins = coinEntries
    .filter((entry) => entry.amount > 0)
    .reduce((total, entry) => total + entry.amount, 0);
  const spentCoins = Math.abs(
    coinEntries
      .filter((entry) => entry.amount < 0)
      .reduce((total, entry) => total + entry.amount, 0),
  );
  const adminGrantedCoins = coinEntries
    .filter((entry) => entry.reason === "admin_grant")
    .reduce((total, entry) => total + entry.amount, 0);

  const costDetails = aiByFeatureModel
    .map((row) => ({
      feature: row.feature,
      label:
        FEATURE_LABELS[row.feature as keyof typeof FEATURE_LABELS] ??
        row.feature,
      provider: row.provider,
      model: row.model,
      calls: row._count._all,
      costUsd: row._sum.estimatedCostUsd ?? 0,
      inputTokens: row._sum.inputTokens ?? 0,
      outputTokens: row._sum.outputTokens ?? 0,
      calculationMethod: row.calculationMethod,
      durationSource: row.durationSource,
      durationSeconds: row._sum.durationSeconds ?? 0,
      inputRateUsdPerMillionTokens: row.inputRateUsdPerMillionTokens,
      outputRateUsdPerMillionTokens: row.outputRateUsdPerMillionTokens,
      audioRateUsdPerMinute: row.audioRateUsdPerMinute,
    }))
    .sort((a, b) => b.costUsd - a.costUsd);
  const totalAiCost = costDetails.reduce(
    (total, row) => total + row.costUsd,
    0,
  );
  const totalAiCalls = costDetails.reduce((total, row) => total + row.calls, 0);

  const capByFeature = new Map(
    aiCaps.map((cap) => [cap.feature, cap.dailyLimitUsd]),
  );
  const nearCapRows = aiTodayByUserFeature
    .map((row) => {
      const cap = capByFeature.get(row.feature) ?? DEFAULT_DAILY_CAP_USD;
      const cost = row._sum.estimatedCostUsd ?? 0;
      return {
        userId: row.userId,
        feature: row.feature,
        cost,
        cap,
        ratio: cost / cap,
      };
    })
    .filter((row) => row.ratio >= 0.8)
    .sort((a, b) => b.ratio - a.ratio);
  const alertUserIds = [...new Set(nearCapRows.map((row) => row.userId))];
  const alertUsers = alertUserIds.length
    ? await db.user.findMany({
        where: { id: { in: alertUserIds } },
        select: {
          id: true,
          name: true,
          email: true,
          learnerProfile: { select: { displayName: true } },
        },
      })
    : [];
  const alertUserById = new Map(alertUsers.map((user) => [user.id, user]));

  const currentCompletions = completionDates.length;
  const previousCompletions =
    previousLessonCount +
    previousScenarioCount +
    previousSpeakingCount +
    previousWritingCount +
    previousMissionCount;
  const completionChange =
    previousCompletions > 0
      ? Math.round(
          ((currentCompletions - previousCompletions) / previousCompletions) *
            1000,
        ) / 10
      : null;
  const alerts = [
    ...nearCapRows.slice(0, 5).map((row) => {
      const user = alertUserById.get(row.userId);
      return {
        severity: row.ratio >= 1 ? ("critical" as const) : ("warning" as const),
        title:
          row.ratio >= 1
            ? "Límite diario alcanzado"
            : "Consumo cercano al límite",
        detail: `${user?.learnerProfile?.displayName ?? user?.name ?? user?.email ?? "Usuario"} · ${FEATURE_LABELS[row.feature as keyof typeof FEATURE_LABELS] ?? row.feature} · ${Math.round(row.ratio * 100)}%`,
        href: `/admin/users/${row.userId}`,
      };
    }),
    ...(cohortIds.size >= 5 && percent(funnelSets[2]!.size, cohortIds.size) < 50
      ? [
          {
            severity: "warning" as const,
            title: "Conversión de onboarding baja",
            detail: `${percent(funnelSets[2]!.size, cohortIds.size)}% de los registros del periodo completó onboarding.`,
            href: "/admin/users?status=pending",
          },
        ]
      : []),
    ...(completionChange !== null &&
    previousCompletions >= 5 &&
    completionChange <= -20
      ? [
          {
            severity: "warning" as const,
            title: "Descenso de actividad de aprendizaje",
            detail: `${Math.abs(completionChange)}% menos actividades completadas frente al periodo anterior equivalente.`,
            href: "/admin/analytics",
          },
        ]
      : []),
    ...(dormantUsers > 0
      ? [
          {
            severity: "info" as const,
            title: "Usuarios que podrían necesitar reactivación",
            detail: `${dormantUsers} usuarios con onboarding completo no registran actividad visible e interactuada en los últimos 14 días.`,
            href: "/admin/users?status=onboarded",
          },
        ]
      : []),
  ];

  return {
    generatedAt: now,
    period,
    periodStart,
    funnel,
    retention,
    trend,
    activity: {
      dau,
      wau,
      mau,
      logicalSessions: currentLogicalSessions.size,
      totalActiveSeconds,
      medianActiveSeconds: median([...currentLogicalSessions.values()]),
      previousActiveSeconds,
      activeTimeChange,
      surfaces: surfaceActivity,
    },
    engagement: {
      activeUsers,
      returningUsers,
      returningRate: percent(returningUsers, activeUsers),
      highlyEngagedUsers,
      dormantUsers,
      avatarOwners: onboardedAvatarOwners,
      avatarAdoptionRate: percent(
        onboardedAvatarOwners,
        allOnboardedProfiles.length,
      ),
      accessoryOwners: accessoryOwners.length,
      achievementOwners: achievementOwners.length,
      leaderboardParticipants,
      onboardedUsers: allOnboardedProfiles.length,
    },
    systems: systemMetrics,
    economy: {
      earnedCoins,
      spentCoins,
      adminGrantedCoins,
      activeRecipients: uniqueUsers(coinEntries),
    },
    ai: {
      totalCostUsd: totalAiCost,
      totalCalls: totalAiCalls,
      costPerActiveUser: activeUsers > 0 ? totalAiCost / activeUsers : 0,
      costPerCompletion:
        currentCompletions > 0 ? totalAiCost / currentCompletions : 0,
      rows: costDetails.slice(0, 20),
    },
    comparison: {
      currentCompletions,
      previousCompletions,
      completionChange,
    },
    alerts,
    methodology: {
      activity:
        "Actividad cuenta intervalos de hasta 15 segundos solo cuando HanGo está visible y hubo interacción en el último minuto. Una pausa de 30 minutos inicia una sesión nueva.",
      retention:
        "D1, D7 y D30 miden actividad visible e interactuada en el día calendario exacto desde el registro, usando hora de Bogotá.",
      separation:
        "Han Tutor y Han Companion se mantienen separados: Tutor solo se reconoce dentro de su panel lateral y Companion por /han. Speaking Lab usa su ruta propia; Learning Journey Speaking permanece en Learning Journey y no se suma a Speaking Lab.",
    },
  };
}
