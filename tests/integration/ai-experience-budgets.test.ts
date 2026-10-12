import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  checkDailyUsageCap,
  DailyUsageCapExceededError,
  recordAiUsage,
} from "@/lib/ai-usage";
import {
  getAiExperienceUsageSummary,
  getUserAiUsageLimits,
  setDailyUsageCap,
  setUserAiUsageCap,
} from "@/lib/admin-ai-usage";
import { getAdminAnalytics } from "@/lib/admin-analytics";
import { buildAdminAiCostReport } from "@/lib/admin-ai-cost-report";
import { AI_EXPERIENCE_IDS, experienceLimitKey } from "@/lib/ai-experiences";

const users: string[] = [];
const keys = [
  "han-tutor-chat",
  "han-tutor-realtime-session",
  "han-speech",
  ...AI_EXPERIENCE_IDS.map(experienceLimitKey),
];
const originalCaps = await db.aiUsageCap.findMany({
  where: { feature: { in: keys } },
});
afterEach(async () => {
  await db.user.deleteMany({ where: { id: { in: users.splice(0) } } });
  await db.aiUsageCap.deleteMany({ where: { feature: { in: keys } } });
  if (originalCaps.length)
    await db.aiUsageCap.createMany({ data: originalCaps });
});
async function learner() {
  const user = await db.user.create({
    data: { email: `experience-budget-${randomUUID()}@hango.dev` },
  });
  users.push(user.id);
  return user;
}
// Replay policy/backfill statements from the real migration on an already
// migrated, disposable test schema. Never run against the development DB.
const policyStatements = readFileSync(
  "prisma/migrations/20261010140000_shared_ai_experience_budgets/migration.sql",
  "utf8",
)
  .replace(/--[^\n]*/g, "")
  .split(";")
  .map((sql) => sql.trim())
  .filter(
    (sql) =>
      sql.startsWith("CREATE TEMP") ||
      sql.startsWith("INSERT") ||
      sql.startsWith("UPDATE"),
  );
async function replayPolicyCopy() {
  await db.$transaction(
    policyStatements.map((sql) => db.$executeRawUnsafe(sql)),
  );
}

describe("shared experience budgets end-to-end (isolated Postgres)", () => {
  it("adds voice, text, STT and TTS once and matches user/global reports and alerts", async () => {
    const user = await learner();
    await setDailyUsageCap("experience:HAN_TUTOR", 0.5);
    await setUserAiUsageCap({
      userId: user.id,
      feature: "experience:HAN_TUTOR",
      mode: "CUSTOM",
      dailyLimitUsd: 0.1,
    });
    for (const [feature, cost, experience] of [
      ["han-tutor-realtime-session", 0.05, "HAN_TUTOR"],
      ["han-tutor-chat", 0.01, "HAN_TUTOR"],
      ["han-teacher-transcribe", 0.01, "HAN_TUTOR"],
      ["han-speech", 0.03, "HAN_TUTOR"],
    ] as const)
      await recordAiUsage({
        userId: user.id,
        feature,
        experience,
        provider: "test-mock",
        model: "test",
        estimatedCostUsd: cost,
      });
    const limit = (await getUserAiUsageLimits(user.id)).find(
      (row) => row.feature === "experience:HAN_TUTOR",
    );
    expect(limit).toMatchObject({ todayCallCount: 4, customLimitUsd: 0.1 });
    expect(limit?.todayCostUsd).toBeCloseTo(0.1);
    for (const feature of [
      "han-tutor-chat",
      "han-tutor-realtime-session",
      "han-speech",
      "han-teacher-transcribe",
    ] as const)
      await expect(
        checkDailyUsageCap(user.id, feature, { experience: "HAN_TUTOR" }),
      ).rejects.toBeInstanceOf(DailyUsageCapExceededError);
    await expect(
      checkDailyUsageCap(user.id, "han-companion-chat"),
    ).resolves.toBeUndefined();
    const globalRow = (await getAiExperienceUsageSummary()).find(
      (row) => row.experience === "HAN_TUTOR",
    );
    expect(globalRow!.todayCostUsd).toBeGreaterThanOrEqual(limit!.todayCostUsd);
    const analytics = await getAdminAnalytics(7, "non-owner", {
      includeAdministratorAi: true,
    });
    const report = buildAdminAiCostReport(analytics.ai.rows);
    expect(
      report.interactive.find((row) => row.id === "HAN_TUTOR")!.costUsd,
    ).toBeCloseTo(0.1);
    expect(
      analytics.alerts.some(
        (row) =>
          row.href === `/admin/users/${user.id}` &&
          row.detail.includes("Han Tutor"),
      ),
    ).toBe(true);
    expect(report.totalCostUsd).toBeCloseTo(analytics.ai.totalCostUsd);
    expect(report.totalCalls).toBe(analytics.ai.totalCalls);
  });
  it("a user block affects all child operations but not another user or product", async () => {
    const [blocked, other] = await Promise.all([learner(), learner()]);
    await setUserAiUsageCap({
      userId: blocked.id,
      feature: "experience:HAN_TUTOR",
      mode: "BLOCKED",
    });
    for (const feature of [
      "han-speech",
      "han-tutor-chat",
      "han-teacher-transcribe",
      "han-tutor-realtime-session",
    ] as const)
      await expect(
        checkDailyUsageCap(blocked.id, feature, { experience: "HAN_TUTOR" }),
      ).rejects.toBeInstanceOf(DailyUsageCapExceededError);
    await expect(
      checkDailyUsageCap(blocked.id, "han-companion-realtime-session"),
    ).resolves.toBeUndefined();
    await expect(
      checkDailyUsageCap(other.id, "han-tutor-chat"),
    ).resolves.toBeUndefined();
    await setUserAiUsageCap({
      userId: blocked.id,
      feature: "experience:HAN_TUTOR",
      mode: "GENERAL",
    });
    await expect(
      checkDailyUsageCap(blocked.id, "han-tutor-chat"),
    ).resolves.toBeUndefined();
  });
  it("charges assessment to its Speaking and Reflection reading to Reflection only", async () => {
    const user = await learner();
    for (const [feature, experience, cost] of [
      ["han-realtime-assessment", "JOURNEY_SPEAKING", 0.002],
      ["han-realtime-assessment", "SPEAKING_LAB", 0.003],
      ["han-speech", "LESSON_REFLECTION", 0.004],
    ] as const)
      await recordAiUsage({
        userId: user.id,
        feature,
        experience,
        provider: "test-mock",
        model: "test",
        estimatedCostUsd: cost,
      });
    const rows = await getUserAiUsageLimits(user.id);
    expect(
      rows.find((row) => row.feature === "experience:JOURNEY_SPEAKING")!
        .todayCostUsd,
    ).toBe(0.002);
    expect(
      rows.find((row) => row.feature === "experience:SPEAKING_LAB")!
        .todayCostUsd,
    ).toBe(0.003);
    expect(
      rows.find((row) => row.feature === "experience:LESSON_REFLECTION")!
        .todayCostUsd,
    ).toBe(0.004);
    expect(
      rows.find((row) => row.feature === "experience:HAN_TUTOR")!.todayCostUsd,
    ).toBe(0);
    await expect(
      recordAiUsage({
        userId: user.id,
        feature: "han-speech",
        provider: "test-mock",
        model: "test",
        estimatedCostUsd: 0.1,
      }),
    ).rejects.toThrow(/explicit experience/);
  });
  it("transfers the strictest policy, preserves zero blocks, history and independently edited budgets", async () => {
    const user = await learner();
    await db.aiUsageCap.deleteMany({
      where: { feature: "experience:HAN_TUTOR" },
    });
    await db.aiUsageCap.upsert({
      where: { feature: "han-tutor-chat" },
      create: { feature: "han-tutor-chat", dailyLimitUsd: 2 },
      update: { dailyLimitUsd: 2 },
    });
    await db.aiUsageCap.upsert({
      where: { feature: "han-tutor-realtime-session" },
      create: { feature: "han-tutor-realtime-session", dailyLimitUsd: 4 },
      update: { dailyLimitUsd: 4 },
    });
    await db.aiUsageUserCap.createMany({
      data: [
        { userId: user.id, feature: "han-tutor-chat", dailyLimitUsd: 2 },
        {
          userId: user.id,
          feature: "han-tutor-realtime-session",
          dailyLimitUsd: 0,
        },
      ],
    });
    await db.aiUsageLog.createMany({
      data: [
        {
          userId: user.id,
          feature: "han-tutor-chat",
          provider: "test-mock",
          model: "test",
          estimatedCostUsd: 0.01,
        },
        {
          userId: user.id,
          feature: "han-realtime-session",
          provider: "test-mock",
          model: "test",
          estimatedCostUsd: 0.25,
        },
        {
          userId: user.id,
          feature: "han-speech",
          provider: "test-mock",
          model: "test",
          estimatedCostUsd: 0.03,
        },
      ],
    });
    await replayPolicyCopy();
    expect(
      await db.aiUsageCap.findUnique({
        where: { feature: "experience:HAN_TUTOR" },
      }),
    ).toMatchObject({ dailyLimitUsd: 2 });
    expect(
      await db.aiUsageUserCap.findUnique({
        where: {
          userId_feature: { userId: user.id, feature: "experience:HAN_TUTOR" },
        },
      }),
    ).toMatchObject({ dailyLimitUsd: 0 });
    await setDailyUsageCap("experience:HAN_TUTOR", 7);
    await replayPolicyCopy();
    expect(
      await db.aiUsageCap.findUnique({
        where: { feature: "experience:HAN_TUTOR" },
      }),
    ).toMatchObject({ dailyLimitUsd: 7 });
    const logs = await db.aiUsageLog.findMany({ where: { userId: user.id } });
    expect(logs.find((row) => row.feature === "han-tutor-chat")).toMatchObject({
      experience: "HAN_TUTOR",
      estimatedCostUsd: 0.01,
    });
    expect(
      logs.find((row) => row.feature === "han-realtime-session"),
    ).toMatchObject({ experience: null, estimatedCostUsd: 0.25 });
    expect(logs.find((row) => row.feature === "han-speech")).toMatchObject({
      experience: null,
      estimatedCostUsd: 0.03,
    });
  });
});
