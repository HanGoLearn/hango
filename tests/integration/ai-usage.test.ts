import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  recordAiUsage,
  checkDailyUsageCap,
  DailyUsageCapExceededError,
  DEFAULT_DAILY_CAP_USD,
  AI_USAGE_FEATURES,
  AiFamilyDisabledError,
  GlobalAiBudgetExceededError,
  utcBudgetDay,
} from "@/lib/ai-usage";
import {
  getAiUsageSummary,
  getGlobalAiBudgetSummary,
  setDailyUsageCap,
  setGlobalAiBudgetPolicy,
  InvalidDailyCapError,
} from "@/lib/admin-ai-usage";

const testEmails: string[] = [];
// AiUsageCap is a small, global, feature-keyed table (not scoped to a test
// user) - any row a test creates here must be removed afterward, or it
// would permanently override the real app's configured cap for that
// feature outside of tests.
const capFeaturesToReset: string[] = [];

afterEach(async () => {
  delete process.env.HANGO_ENFORCE_GLOBAL_AI_BUDGET_IN_TESTS;
  if (testEmails.length > 0) {
    // Cascades to AiUsageLog (onDelete: Cascade).
    await db.user.deleteMany({ where: { email: { in: testEmails } } });
    testEmails.length = 0;
  }
  if (capFeaturesToReset.length > 0) {
    await db.aiUsageCap.deleteMany({
      where: { feature: { in: capFeaturesToReset } },
    });
    capFeaturesToReset.length = 0;
  }
  await db.aiDailyBudgetCounter.deleteMany({
    where: { day: utcBudgetDay() },
  });
  await db.aiBudgetPolicy.deleteMany({ where: { id: "global" } });
});

async function createTestUser(email: string) {
  testEmails.push(email);
  return db.user.create({ data: { email } });
}

function startOfTodayUtc(): Date {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

describe("AI usage logging + daily caps (2026-09-05, integration, real database)", () => {
  it("records a usage row with real cost/token data", async () => {
    const user = await createTestUser(
      `ai-usage-record-${Date.now()}@hango.dev`,
    );

    await recordAiUsage({
      userId: user.id,
      feature: "ai-teacher-chat",
      provider: "test-mock",
      model: "gpt-5-mini",
      inputTokens: 100,
      outputTokens: 50,
      estimatedCostUsd: 0.00035,
    });

    const rows = await db.aiUsageLog.findMany({ where: { userId: user.id } });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.feature).toBe("ai-teacher-chat");
    expect(rows[0]!.inputTokens).toBe(100);
    expect(rows[0]!.outputTokens).toBe(50);
    expect(rows[0]!.estimatedCostUsd).toBeCloseTo(0.00035, 8);
    expect(rows[0]!.calculationMethod).toBe("TOKEN_RATES");
    expect(rows[0]!.inputRateUsdPerMillionTokens).toBe(0.25);
    expect(rows[0]!.outputRateUsdPerMillionTokens).toBe(2);
    expect(rows[0]!.audioRateUsdPerMinute).toBeNull();
  });

  it("stores null token counts for a non-token-billed (TTS/STT) call", async () => {
    const user = await createTestUser(`ai-usage-tts-${Date.now()}@hango.dev`);

    await recordAiUsage({
      userId: user.id,
      feature: "welcome-audio",
      provider: "openai",
      model: "gpt-4o-mini-tts",
      estimatedCostUsd: 0.001,
      durationSeconds: 4,
      durationSource: "TEXT_LENGTH_ESTIMATE",
    });

    const row = await db.aiUsageLog.findFirstOrThrow({
      where: { userId: user.id },
    });
    expect(row.inputTokens).toBeNull();
    expect(row.outputTokens).toBeNull();
    expect(row.calculationMethod).toBe("PER_MINUTE");
    expect(row.audioRateUsdPerMinute).toBe(0.015);
    expect(row.durationSeconds).toBe(4);
    expect(row.durationSource).toBe("TEXT_LENGTH_ESTIMATE");
  });

  it("allows usage under the default daily cap and blocks once it's reached", async () => {
    const user = await createTestUser(
      `ai-usage-defaultcap-${Date.now()}@hango.dev`,
    );

    await expect(
      checkDailyUsageCap(user.id, "mission-chat"),
    ).resolves.toBeUndefined();

    await recordAiUsage({
      userId: user.id,
      feature: "mission-chat",
      provider: "test-mock",
      model: "gpt-5-mini",
      estimatedCostUsd: DEFAULT_DAILY_CAP_USD,
    });

    await expect(
      checkDailyUsageCap(user.id, "mission-chat"),
    ).rejects.toBeInstanceOf(DailyUsageCapExceededError);
  });

  it("uses a configured AiUsageCap row instead of the default when one exists", async () => {
    const user = await createTestUser(
      `ai-usage-customcap-${Date.now()}@hango.dev`,
    );
    capFeaturesToReset.push("dialogue-audio");
    await setDailyUsageCap("dialogue-audio", 0.01);

    await recordAiUsage({
      userId: user.id,
      feature: "dialogue-audio",
      provider: "openai",
      model: "gpt-4o-mini-tts",
      estimatedCostUsd: 0.02,
    });

    await expect(
      checkDailyUsageCap(user.id, "dialogue-audio"),
    ).rejects.toBeInstanceOf(DailyUsageCapExceededError);
  });

  it("only counts today's spend toward the cap, not a previous day's", async () => {
    const user = await createTestUser(
      `ai-usage-yesterday-${Date.now()}@hango.dev`,
    );
    const yesterday = new Date(startOfTodayUtc().getTime() - 60 * 60 * 1000);

    await db.aiUsageLog.create({
      data: {
        userId: user.id,
        feature: "grammar-audio",
        provider: "openai",
        model: "gpt-4o-mini-tts",
        estimatedCostUsd: DEFAULT_DAILY_CAP_USD,
        createdAt: yesterday,
      },
    });

    await expect(
      checkDailyUsageCap(user.id, "grammar-audio"),
    ).resolves.toBeUndefined();
  });

  it("caps are independent per feature for the same user", async () => {
    const user = await createTestUser(
      `ai-usage-perfeature-${Date.now()}@hango.dev`,
    );
    await recordAiUsage({
      userId: user.id,
      feature: "vocabulary-lookup",
      provider: "test-mock",
      model: "gpt-5-mini",
      estimatedCostUsd: DEFAULT_DAILY_CAP_USD,
    });

    await expect(
      checkDailyUsageCap(user.id, "vocabulary-lookup"),
    ).rejects.toBeInstanceOf(DailyUsageCapExceededError);
    await expect(
      checkDailyUsageCap(user.id, "writing-feedback"),
    ).resolves.toBeUndefined();
  });

  it("rejects a non-positive daily cap", async () => {
    await expect(
      setDailyUsageCap("speaking-feedback", 0),
    ).rejects.toBeInstanceOf(InvalidDailyCapError);
    await expect(
      setDailyUsageCap("speaking-feedback", -5),
    ).rejects.toBeInstanceOf(InvalidDailyCapError);
  });

  it("getAiUsageSummary returns a row for every known feature, even with zero usage", async () => {
    const summary = await getAiUsageSummary();
    expect(summary.map((row) => row.feature).sort()).toEqual(
      [...AI_USAGE_FEATURES].sort(),
    );
  });

  it("getAiUsageSummary reflects a newly configured daily cap", async () => {
    capFeaturesToReset.push("placement-listening-audio");
    await setDailyUsageCap("placement-listening-audio", 2.5);

    let summary = await getAiUsageSummary();
    expect(
      summary.find((row) => row.feature === "placement-listening-audio")!
        .dailyCapUsd,
    ).toBe(2.5);

    await setDailyUsageCap("placement-listening-audio", 5);
    summary = await getAiUsageSummary();
    expect(
      summary.find((row) => row.feature === "placement-listening-audio")!
        .dailyCapUsd,
    ).toBe(5);
  });

  it("getAiUsageSummary aggregates today's and this month's spend across every user for a feature", async () => {
    const before = await getAiUsageSummary();
    const beforeRow = before.find((row) => row.feature === "han-speech")!;

    const userA = await createTestUser(
      `ai-usage-summary-a-${Date.now()}@hango.dev`,
    );
    const userB = await createTestUser(
      `ai-usage-summary-b-${Date.now()}@hango.dev`,
    );
    await recordAiUsage({
      userId: userA.id,
      feature: "han-speech",
      provider: "openai",
      model: "gpt-4o-mini-tts",
      estimatedCostUsd: 0.01,
    });
    await recordAiUsage({
      userId: userB.id,
      feature: "han-speech",
      provider: "openai",
      model: "gpt-4o-mini-tts",
      estimatedCostUsd: 0.02,
    });

    const after = await getAiUsageSummary();
    const afterRow = after.find((row) => row.feature === "han-speech")!;
    expect(afterRow.todayCostUsd).toBeCloseTo(beforeRow.todayCostUsd + 0.03, 8);
    expect(afterRow.todayCallCount).toBe(beforeRow.todayCallCount + 2);
    expect(afterRow.monthCostUsd).toBeCloseTo(beforeRow.monthCostUsd + 0.03, 8);
    expect(afterRow.monthCallCount).toBe(beforeRow.monthCallCount + 2);
  });

  it("can pause one AI family without disabling the others", async () => {
    const user = await createTestUser(
      `ai-budget-family-${Date.now()}@hango.dev`,
    );
    await setGlobalAiBudgetPolicy({
      dailyLimitUsd: 5,
      textEnabled: false,
      sttEnabled: true,
      ttsEnabled: true,
      realtimeEnabled: true,
    });

    await expect(
      checkDailyUsageCap(user.id, "mission-chat"),
    ).rejects.toBeInstanceOf(AiFamilyDisabledError);
    await expect(
      checkDailyUsageCap(user.id, "speaking-transcribe"),
    ).resolves.toBeUndefined();
  });

  it("authorizes concurrent calls atomically without crossing the global budget", async () => {
    process.env.HANGO_ENFORCE_GLOBAL_AI_BUDGET_IN_TESTS = "true";
    const user = await createTestUser(
      `ai-budget-atomic-${Date.now()}@hango.dev`,
    );
    await setGlobalAiBudgetPolicy({
      dailyLimitUsd: 0.06,
      textEnabled: true,
      sttEnabled: true,
      ttsEnabled: true,
      realtimeEnabled: true,
    });

    const attempts = await Promise.allSettled(
      Array.from({ length: 10 }, () =>
        checkDailyUsageCap(user.id, "mission-chat"),
      ),
    );
    expect(
      attempts.filter((attempt) => attempt.status === "fulfilled"),
    ).toHaveLength(3);
    expect(
      attempts
        .filter((attempt) => attempt.status === "rejected")
        .every(
          (attempt) => attempt.reason instanceof GlobalAiBudgetExceededError,
        ),
    ).toBe(true);

    const counter = await db.aiDailyBudgetCounter.findUniqueOrThrow({
      where: { day: utcBudgetDay() },
    });
    expect(counter.authorizedMicrousd).toBe(60_000);
    expect(counter.authorizationCount).toBe(3);
  });

  it("reports the global 50 percent warning from authorized exposure", async () => {
    process.env.HANGO_ENFORCE_GLOBAL_AI_BUDGET_IN_TESTS = "true";
    const user = await createTestUser(
      `ai-budget-summary-${Date.now()}@hango.dev`,
    );
    await setGlobalAiBudgetPolicy({
      dailyLimitUsd: 0.1,
      textEnabled: true,
      sttEnabled: true,
      ttsEnabled: true,
      realtimeEnabled: true,
    });
    await Promise.all([
      checkDailyUsageCap(user.id, "mission-chat"),
      checkDailyUsageCap(user.id, "mission-report"),
      checkDailyUsageCap(user.id, "writing-feedback"),
    ]);

    const summary = await getGlobalAiBudgetSummary();
    expect(summary.authorizedUsd).toBeCloseTo(0.06, 8);
    expect(summary.usagePercent).toBeCloseTo(60, 8);
    expect(summary.alertLevel).toBe("NOTICE_50");
  });
});
