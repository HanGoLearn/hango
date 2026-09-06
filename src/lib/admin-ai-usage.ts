import "server-only";
import { db } from "@/lib/db";
import {
  AI_USAGE_FEATURES,
  DEFAULT_DAILY_CAP_USD,
  type AiUsageFeature,
} from "@/lib/ai-usage";

export const FEATURE_LABELS: Record<AiUsageFeature, string> = {
  "ai-teacher-chat": "Han Teacher/Companion chat",
  "vocabulary-lookup": "Han Vocabulary lookup",
  "mission-chat": "Mission chat",
  "mission-report": "Mission report",
  "speaking-feedback": "Speaking Lab feedback",
  "speaking-scenario": "Speaking Lab custom scenario",
  "lesson-reflection": "Lesson reflection report",
  "writing-feedback": "Writing Lab feedback",
  "placement-grading": "Placement exam speaking grading",
  "free-topic-feedback": "Free-topic practice feedback",
  "handwritten-writing": "Handwritten writing evaluation",
  "welcome-audio": "Welcome to Chinese audio",
  "dialogue-audio": "Lesson dialogue audio",
  "grammar-audio": "Grammar example audio",
  "vocabulary-audio": "Vocabulary word/example audio",
  "placement-listening-audio": "Placement listening audio",
  "han-speech": "Han's spoken voice",
  "han-teacher-transcribe": "Han Teacher/Companion transcription",
  "speaking-transcribe": "Speaking Lab transcription",
  "han-realtime-assessment": "Live voice conversation planner",
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

  const capByFeature = new Map(caps.map((cap) => [cap.feature, cap.dailyLimitUsd]));
  const todayByFeature = new Map(todayGroups.map((group) => [group.feature, group]));
  const monthByFeature = new Map(monthGroups.map((group) => [group.feature, group]));

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
