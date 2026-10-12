import "server-only";
import { FEATURE_LABELS } from "@/lib/ai-feature-catalog";
export { FEATURE_LABELS } from "@/lib/ai-feature-catalog";
import { db } from "@/lib/db";
import {
  AI_EXPERIENCES,
  AI_EXPERIENCE_IDS,
  experienceLimitKey,
  normalizeAiLimitKey,
  recordedAiExperience,
  type AiExperience,
  type AiExperienceLimitKey,
} from "@/lib/ai-experiences";
import {
  AI_USAGE_FEATURES,
  DEFAULT_DAILY_CAP_USD,
  DEFAULT_GLOBAL_DAILY_BUDGET_USD,
  microusdToUsd,
  utcBudgetDay,
  type AiUsageFeature,
} from "@/lib/ai-usage";

export interface FeatureUsageSummary {
  feature: string;
  label: string;
  dailyCapUsd: number;
  todayCostUsd: number;
  todayCallCount: number;
  monthCostUsd: number;
  monthCallCount: number;
}

function startOfTodayUtc(): Date {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

function startOfMonthUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/**
 * One row per known feature (2026-09-05 cost audit), even one with zero
 * usage today - the admin dashboard should always show the full, real list
 * of AI/TTS/STT surfaces, not just whichever ones happened to fire recently.
 * Cost/count are summed across every user (the admin's own budget view);
 * `dailyCapUsd` is an archived operation policy, not an editable runtime limit.
 * Runtime enforcement and editors use getAiExperienceUsageSummary().
 */
export async function getAiUsageSummary(): Promise<FeatureUsageSummary[]> {
  const [caps, todayGroups, monthGroups] = await Promise.all([
    db.aiUsageCap.findMany(),
    db.aiUsageLog.groupBy({
      by: ["feature"],
      where: { createdAt: { gte: startOfTodayUtc() } },
      _sum: { estimatedCostUsd: true },
      _count: { _all: true },
    }),
    db.aiUsageLog.groupBy({
      by: ["feature"],
      where: { createdAt: { gte: startOfMonthUtc() } },
      _sum: { estimatedCostUsd: true },
      _count: { _all: true },
    }),
  ]);

  const capByFeature = new Map(
    caps.map((cap) => [cap.feature, cap.dailyLimitUsd]),
  );
  const todayByFeature = new Map(
    todayGroups.map((group) => [group.feature, group]),
  );
  const monthByFeature = new Map(
    monthGroups.map((group) => [group.feature, group]),
  );

  const features = [
    ...new Set([
      ...AI_USAGE_FEATURES,
      ...todayGroups.map((row) => row.feature),
      ...monthGroups.map((row) => row.feature),
    ]),
  ];
  return features.map((feature) => ({
    feature,
    label: FEATURE_LABELS[feature as AiUsageFeature] ?? feature,
    dailyCapUsd: capByFeature.get(feature) ?? DEFAULT_DAILY_CAP_USD,
    todayCostUsd: todayByFeature.get(feature)?._sum.estimatedCostUsd ?? 0,
    todayCallCount: todayByFeature.get(feature)?._count._all ?? 0,
    monthCostUsd: monthByFeature.get(feature)?._sum.estimatedCostUsd ?? 0,
    monthCallCount: monthByFeature.get(feature)?._count._all ?? 0,
  }));
}

export class InvalidDailyCapError extends Error {}
export class InvalidUserAiUsageCapError extends Error {}
export class InvalidGlobalAiBudgetPolicyError extends Error {}

export type GlobalAiBudgetAlertLevel =
  "NORMAL" | "NOTICE_50" | "WARNING_75" | "CRITICAL_90" | "BLOCKED_100";

export interface GlobalAiBudgetSummary {
  dailyLimitUsd: number;
  authorizedUsd: number;
  authorizationCount: number;
  actualCostUsd: number;
  usagePercent: number;
  alertLevel: GlobalAiBudgetAlertLevel;
  textEnabled: boolean;
  sttEnabled: boolean;
  ttsEnabled: boolean;
  realtimeEnabled: boolean;
}

export function globalAiBudgetAlertLevel(
  usagePercent: number,
): GlobalAiBudgetAlertLevel {
  if (usagePercent >= 100) return "BLOCKED_100";
  if (usagePercent >= 90) return "CRITICAL_90";
  if (usagePercent >= 75) return "WARNING_75";
  if (usagePercent >= 50) return "NOTICE_50";
  return "NORMAL";
}

export async function getGlobalAiBudgetSummary(): Promise<GlobalAiBudgetSummary> {
  const [policy, counter, actual] = await Promise.all([
    db.aiBudgetPolicy.findUnique({ where: { id: "global" } }),
    db.aiDailyBudgetCounter.findUnique({ where: { day: utcBudgetDay() } }),
    db.aiUsageLog.aggregate({
      where: { createdAt: { gte: startOfTodayUtc() } },
      _sum: { estimatedCostUsd: true },
    }),
  ]);
  const dailyLimitUsd = policy
    ? microusdToUsd(policy.dailyLimitMicrousd)
    : DEFAULT_GLOBAL_DAILY_BUDGET_USD;
  const authorizedUsd = microusdToUsd(counter?.authorizedMicrousd ?? 0);
  const usagePercent =
    dailyLimitUsd <= 0
      ? 100
      : Math.min(100, (authorizedUsd / dailyLimitUsd) * 100);

  return {
    dailyLimitUsd,
    authorizedUsd,
    authorizationCount: counter?.authorizationCount ?? 0,
    actualCostUsd: actual._sum.estimatedCostUsd ?? 0,
    usagePercent,
    alertLevel: globalAiBudgetAlertLevel(usagePercent),
    textEnabled: policy?.textEnabled ?? true,
    sttEnabled: policy?.sttEnabled ?? true,
    ttsEnabled: policy?.ttsEnabled ?? true,
    realtimeEnabled: policy?.realtimeEnabled ?? true,
  };
}

export async function setGlobalAiBudgetPolicy(input: {
  dailyLimitUsd: number;
  textEnabled: boolean;
  sttEnabled: boolean;
  ttsEnabled: boolean;
  realtimeEnabled: boolean;
}): Promise<void> {
  if (
    !Number.isFinite(input.dailyLimitUsd) ||
    input.dailyLimitUsd <= 0 ||
    input.dailyLimitUsd > 2_000 ||
    typeof input.textEnabled !== "boolean" ||
    typeof input.sttEnabled !== "boolean" ||
    typeof input.ttsEnabled !== "boolean" ||
    typeof input.realtimeEnabled !== "boolean"
  ) {
    throw new InvalidGlobalAiBudgetPolicyError(
      "Ingresa un presupuesto diario válido, mayor que cero.",
    );
  }
  await db.aiBudgetPolicy.upsert({
    where: { id: "global" },
    create: {
      id: "global",
      dailyLimitMicrousd: Math.round(input.dailyLimitUsd * 1_000_000),
      textEnabled: input.textEnabled,
      sttEnabled: input.sttEnabled,
      ttsEnabled: input.ttsEnabled,
      realtimeEnabled: input.realtimeEnabled,
    },
    update: {
      dailyLimitMicrousd: Math.round(input.dailyLimitUsd * 1_000_000),
      textEnabled: input.textEnabled,
      sttEnabled: input.sttEnabled,
      ttsEnabled: input.ttsEnabled,
      realtimeEnabled: input.realtimeEnabled,
    },
  });
}

export type UserAiUsageCapMode = "GENERAL" | "CUSTOM" | "BLOCKED";

export interface UserAiUsageLimitSummary {
  feature: AiExperienceLimitKey;
  label: string;
  mode: UserAiUsageCapMode;
  generalLimitUsd: number;
  customLimitUsd: number | null;
  effectiveLimitUsd: number;
  todayCostUsd: number;
  todayCallCount: number;
}

export async function setDailyUsageCap(
  feature: string,
  dailyLimitUsd: number,
): Promise<void> {
  const key = normalizeAiLimitKey(feature);
  if (
    !key ||
    !Number.isFinite(dailyLimitUsd) ||
    dailyLimitUsd < 0 ||
    dailyLimitUsd > 2000
  )
    throw new InvalidDailyCapError(
      "Ingresa un presupuesto diario válido. Cero bloquea llamadas nuevas.",
    );
  await db.aiUsageCap.upsert({
    where: { feature: key },
    create: { feature: key, dailyLimitUsd },
    update: { dailyLimitUsd },
  });
}

function sumExperienceUsage(
  groups: {
    feature: string;
    experience: string | null;
    _sum: { estimatedCostUsd: number | null };
    _count: { _all: number };
  }[],
) {
  const totals = new Map<AiExperience, { costUsd: number; calls: number }>();
  for (const row of groups) {
    const experience = recordedAiExperience(row.feature, row.experience);
    if (!experience) continue;
    const total = totals.get(experience) ?? { costUsd: 0, calls: 0 };
    total.costUsd += row._sum.estimatedCostUsd ?? 0;
    total.calls += row._count._all;
    totals.set(experience, total);
  }
  return totals;
}

export async function getAiExperienceUsageSummary() {
  const [caps, today, month] = await Promise.all([
    db.aiUsageCap.findMany(),
    db.aiUsageLog.groupBy({
      by: ["feature", "experience"],
      where: { createdAt: { gte: startOfTodayUtc() } },
      _sum: { estimatedCostUsd: true },
      _count: { _all: true },
    }),
    db.aiUsageLog.groupBy({
      by: ["feature", "experience"],
      where: { createdAt: { gte: startOfMonthUtc() } },
      _sum: { estimatedCostUsd: true },
      _count: { _all: true },
    }),
  ]);
  const capByKey = new Map(caps.map((row) => [row.feature, row.dailyLimitUsd]));
  const todayByExperience = sumExperienceUsage(today);
  const monthByExperience = sumExperienceUsage(month);
  return AI_EXPERIENCE_IDS.map((experience) => ({
    feature: experienceLimitKey(experience),
    experience,
    label: AI_EXPERIENCES[experience].label,
    description: AI_EXPERIENCES[experience].description,
    dailyCapUsd:
      capByKey.get(experienceLimitKey(experience)) ?? DEFAULT_DAILY_CAP_USD,
    todayCostUsd: todayByExperience.get(experience)?.costUsd ?? 0,
    todayCallCount: todayByExperience.get(experience)?.calls ?? 0,
    monthCostUsd: monthByExperience.get(experience)?.costUsd ?? 0,
    monthCallCount: monthByExperience.get(experience)?.calls ?? 0,
  }));
}

export async function getUserAiUsageLimits(
  userId: string,
): Promise<UserAiUsageLimitSummary[]> {
  const [caps, overrides, today] = await Promise.all([
    db.aiUsageCap.findMany(),
    db.aiUsageUserCap.findMany({ where: { userId } }),
    db.aiUsageLog.groupBy({
      by: ["feature", "experience"],
      where: { userId, createdAt: { gte: startOfTodayUtc() } },
      _sum: { estimatedCostUsd: true },
      _count: { _all: true },
    }),
  ]);
  const capByKey = new Map(caps.map((row) => [row.feature, row.dailyLimitUsd]));
  const overrideByKey = new Map(
    overrides.map((row) => [row.feature, row.dailyLimitUsd]),
  );
  const todayByExperience = sumExperienceUsage(today);
  return AI_EXPERIENCE_IDS.map((experience) => {
    const feature = experienceLimitKey(experience);
    const generalLimitUsd = capByKey.get(feature) ?? DEFAULT_DAILY_CAP_USD;
    const customLimitUsd = overrideByKey.get(feature) ?? null;
    return {
      feature,
      label: AI_EXPERIENCES[experience].label,
      mode:
        customLimitUsd === null
          ? "GENERAL"
          : customLimitUsd === 0
            ? "BLOCKED"
            : "CUSTOM",
      generalLimitUsd,
      customLimitUsd,
      effectiveLimitUsd: customLimitUsd ?? generalLimitUsd,
      todayCostUsd: todayByExperience.get(experience)?.costUsd ?? 0,
      todayCallCount: todayByExperience.get(experience)?.calls ?? 0,
    };
  });
}

export async function setUserAiUsageCap(input: {
  userId: string;
  feature: string;
  mode: UserAiUsageCapMode;
  dailyLimitUsd?: number;
}): Promise<void> {
  const feature = normalizeAiLimitKey(input.feature);
  if (
    !feature ||
    !(["GENERAL", "CUSTOM", "BLOCKED"] as string[]).includes(input.mode)
  )
    throw new InvalidUserAiUsageCapError("La configuración no es válida.");
  const user = await db.user.findUnique({
    where: { id: input.userId },
    select: { id: true, role: true },
  });
  if (!user || user.role === "ADMINISTRATOR")
    throw new InvalidUserAiUsageCapError("El usuario no es válido.");
  if (input.mode === "GENERAL") {
    await db.aiUsageUserCap.deleteMany({
      where: { userId: input.userId, feature },
    });
    return;
  }
  const dailyLimitUsd = input.mode === "BLOCKED" ? 0 : input.dailyLimitUsd;
  if (
    dailyLimitUsd === undefined ||
    !Number.isFinite(dailyLimitUsd) ||
    dailyLimitUsd < 0 ||
    dailyLimitUsd > 2000 ||
    (input.mode === "CUSTOM" && dailyLimitUsd <= 0)
  )
    throw new InvalidUserAiUsageCapError(
      "Ingresa un límite diario válido mayor que cero.",
    );
  await db.aiUsageUserCap.upsert({
    where: { userId_feature: { userId: input.userId, feature } },
    create: { userId: input.userId, feature, dailyLimitUsd },
    update: { dailyLimitUsd },
  });
}
