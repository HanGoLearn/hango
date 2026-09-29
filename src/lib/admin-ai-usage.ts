import "server-only";
import { db } from "@/lib/db";
import {
  AI_USAGE_FEATURES,
  DEFAULT_DAILY_CAP_USD,
  DEFAULT_GLOBAL_DAILY_BUDGET_USD,
  microusdToUsd,
  utcBudgetDay,
  type AiUsageFeature,
} from "@/lib/ai-usage";

export const FEATURE_LABELS: Record<AiUsageFeature, string> = {
  "ai-teacher-chat": "Chat de Han Tutor y Companion",
  "learner-fact-extraction": "Memoria de Han Companion",
  "vocabulary-lookup": "Búsqueda de HanVocabulary",
  "mission-chat": "Conversación de Mission",
  "mission-report": "Evaluación final de Mission",
  "speaking-feedback": "Evaluación de Speaking Lab",
  "speaking-scenario": "Escenario personalizado de Speaking Lab",
  "lesson-reflection": "Reflexión final de la lección",
  "writing-feedback": "Evaluación de Writing Lab",
  "placement-grading": "Evaluación oral de Placement",
  "free-topic-feedback": "Evaluación de práctica libre",
  "handwritten-writing": "Evaluación de escritura a mano",
  "welcome-audio": "Audio de introducción al chino",
  "dialogue-audio": "Audio de diálogos de lección",
  "grammar-audio": "Audio de ejemplos de gramática",
  "vocabulary-audio": "Audio de vocabulario y ejemplos",
  "placement-listening-audio": "Audio de escucha de Placement",
  "han-speech": "Voz generada de Han",
  "han-teacher-transcribe": "Transcripción de Han Tutor y Companion",
  "speaking-transcribe": "Transcripción de Speaking Lab",
  "han-realtime-session": "Conversación de voz en vivo con Han",
  "han-realtime-assessment": "Evaluación de conversación por voz",
};

export interface FeatureUsageSummary {
  feature: AiUsageFeature;
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
 * `dailyCapUsd` is the per-user daily limit checkDailyUsageCap() enforces.
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

  return AI_USAGE_FEATURES.map((feature) => ({
    feature,
    label: FEATURE_LABELS[feature],
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
  feature: AiUsageFeature;
  label: string;
  mode: UserAiUsageCapMode;
  generalLimitUsd: number;
  customLimitUsd: number | null;
  effectiveLimitUsd: number;
  todayCostUsd: number;
  todayCallCount: number;
}

export async function setDailyUsageCap(
  feature: AiUsageFeature,
  dailyLimitUsd: number,
): Promise<void> {
  if (
    !AI_USAGE_FEATURES.includes(feature) ||
    !Number.isFinite(dailyLimitUsd) ||
    dailyLimitUsd <= 0
  ) {
    throw new InvalidDailyCapError("That daily limit isn't valid.");
  }
  await db.aiUsageCap.upsert({
    where: { feature },
    create: { feature, dailyLimitUsd },
    update: { dailyLimitUsd },
  });
}

export async function getUserAiUsageLimits(
  userId: string,
): Promise<UserAiUsageLimitSummary[]> {
  const [caps, overrides, todayGroups] = await Promise.all([
    db.aiUsageCap.findMany(),
    db.aiUsageUserCap.findMany({ where: { userId } }),
    db.aiUsageLog.groupBy({
      by: ["feature"],
      where: { userId, createdAt: { gte: startOfTodayUtc() } },
      _sum: { estimatedCostUsd: true },
      _count: { _all: true },
    }),
  ]);
  const capByFeature = new Map(
    caps.map((cap) => [cap.feature, cap.dailyLimitUsd]),
  );
  const overrideByFeature = new Map(
    overrides.map((override) => [override.feature, override.dailyLimitUsd]),
  );
  const todayByFeature = new Map(
    todayGroups.map((group) => [group.feature, group]),
  );

  return AI_USAGE_FEATURES.map((feature) => {
    const generalLimitUsd = capByFeature.get(feature) ?? DEFAULT_DAILY_CAP_USD;
    const customLimitUsd = overrideByFeature.get(feature) ?? null;
    return {
      feature,
      label: FEATURE_LABELS[feature],
      mode:
        customLimitUsd === null
          ? "GENERAL"
          : customLimitUsd === 0
            ? "BLOCKED"
            : "CUSTOM",
      generalLimitUsd,
      customLimitUsd,
      effectiveLimitUsd: customLimitUsd ?? generalLimitUsd,
      todayCostUsd: todayByFeature.get(feature)?._sum.estimatedCostUsd ?? 0,
      todayCallCount: todayByFeature.get(feature)?._count._all ?? 0,
    };
  });
}

export async function setUserAiUsageCap(input: {
  userId: string;
  feature: AiUsageFeature;
  mode: UserAiUsageCapMode;
  dailyLimitUsd?: number;
}): Promise<void> {
  if (
    !AI_USAGE_FEATURES.includes(input.feature) ||
    !(["GENERAL", "CUSTOM", "BLOCKED"] as string[]).includes(input.mode)
  ) {
    throw new InvalidUserAiUsageCapError("La configuración no es válida.");
  }
  const user = await db.user.findUnique({
    where: { id: input.userId },
    select: { id: true, role: true },
  });
  if (!user || user.role === "ADMINISTRATOR") {
    throw new InvalidUserAiUsageCapError("El usuario no es válido.");
  }

  if (input.mode === "GENERAL") {
    await db.aiUsageUserCap.deleteMany({
      where: { userId: input.userId, feature: input.feature },
    });
    return;
  }

  const dailyLimitUsd = input.mode === "BLOCKED" ? 0 : input.dailyLimitUsd;
  if (
    dailyLimitUsd === undefined ||
    !Number.isFinite(dailyLimitUsd) ||
    dailyLimitUsd < 0 ||
    (input.mode === "CUSTOM" && dailyLimitUsd <= 0)
  ) {
    throw new InvalidUserAiUsageCapError(
      "Ingresa un límite diario mayor que cero.",
    );
  }

  await db.aiUsageUserCap.upsert({
    where: {
      userId_feature: { userId: input.userId, feature: input.feature },
    },
    create: {
      userId: input.userId,
      feature: input.feature,
      dailyLimitUsd,
    },
    update: { dailyLimitUsd },
  });
}
