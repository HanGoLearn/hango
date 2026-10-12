import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { REALTIME_USAGE_FEATURES } from "@/lib/realtime-usage";
import { getUserAiUsageLimits } from "@/lib/admin-ai-usage";
import {
  checkDailyUsageCap,
  DailyUsageCapExceededError,
  recordAiUsage,
} from "@/lib/ai-usage";

const features = ["han-realtime-session", ...REALTIME_USAGE_FEATURES];
const userIds: string[] = [];
const originalCaps = await db.aiUsageCap.findMany({
  where: { feature: { in: features } },
});
afterEach(async () => {
  await db.user.deleteMany({ where: { id: { in: userIds.splice(0) } } });
  await db.aiUsageCap.deleteMany({ where: { feature: { in: features } } });
  if (originalCaps.length)
    await db.aiUsageCap.createMany({ data: originalCaps });
});

// Execute only the two INSERT statements from the actual checked-in migration
// inside a test transaction. No SQL is built from learner input.
const migrationSql = readFileSync(
  "prisma/migrations/20261010120000_separate_realtime_usage_limits/migration.sql",
  "utf8",
);
const statements = migrationSql
  .replace(/--[^\n]*/g, "")
  .split(";")
  .map((sql) => sql.trim())
  .filter((sql) => sql.startsWith("INSERT INTO"));
async function applyPolicyMigration() {
  await db.$transaction(statements.map((sql) => db.$executeRawUnsafe(sql)));
}
async function learner() {
  const user = await db.user.create({
    data: { email: `realtime-migration-${randomUUID()}@hango.dev` },
  });
  userIds.push(user.id);
  return user;
}

describe("Realtime policy transition (isolated database)", () => {
  it("copies existing limits and blocks once without overwriting independent settings or old logs", async () => {
    const [blocked, custom] = await Promise.all([learner(), learner()]);
    await db.aiUsageCap.deleteMany({ where: { feature: { in: features } } });
    await db.aiUsageCap.createMany({
      data: [
        { feature: "han-realtime-session", dailyLimitUsd: 2 },
        { feature: "speaking-lab-realtime-session", dailyLimitUsd: 0.1 },
      ],
    });
    await db.aiUsageUserCap.createMany({
      data: [
        {
          userId: blocked.id,
          feature: "han-realtime-session",
          dailyLimitUsd: 0,
        },
        {
          userId: custom.id,
          feature: "han-realtime-session",
          dailyLimitUsd: 3,
        },
        {
          userId: custom.id,
          feature: "han-tutor-realtime-session",
          dailyLimitUsd: 0.05,
        },
      ],
    });
    await recordAiUsage({
      userId: custom.id,
      feature: "han-realtime-session",
      provider: "test-mock",
      model: "gpt-realtime-mini",
      estimatedCostUsd: 0.25,
    });
    await applyPolicyMigration();
    await applyPolicyMigration(); // idempotent; never overwrite new admin settings
    const caps = await db.aiUsageCap.findMany({
      where: { feature: { in: [...REALTIME_USAGE_FEATURES] } },
    });
    expect(caps).toHaveLength(5);
    expect(
      caps.find((cap) => cap.feature === "speaking-lab-realtime-session")
        ?.dailyLimitUsd,
    ).toBe(0.1);
    expect(
      caps.find((cap) => cap.feature === "han-tutor-realtime-session")
        ?.dailyLimitUsd,
    ).toBe(2);
    // This earlier migration archives operation policies; the later experience
    // migration is tested separately before any runtime gate reads them.
    const limits = await db.aiUsageUserCap.findMany({
      where: { userId: custom.id },
    });
    expect(
      limits.find((row) => row.feature === "han-tutor-realtime-session"),
    ).toMatchObject({ dailyLimitUsd: 0.05 });
    expect(
      limits.find((row) => row.feature === "han-companion-realtime-session"),
    ).toMatchObject({ dailyLimitUsd: 3 });
    for (const feature of REALTIME_USAGE_FEATURES) {
      expect(
        await db.aiUsageUserCap.findUnique({
          where: { userId_feature: { userId: blocked.id, feature } },
        }),
      ).toMatchObject({ dailyLimitUsd: 0 });
    }
    await expect(
      checkDailyUsageCap(custom.id, "han-tutor-realtime-session"),
    ).resolves.toBeUndefined();
    const old = await db.aiUsageLog.findFirstOrThrow({
      where: { userId: custom.id },
    });
    expect(old).toMatchObject({
      feature: "han-realtime-session",
      estimatedCostUsd: 0.25,
    });
  });

  it("uses US$0.05 separately for usage and allowance, without borrowing another product's cap", async () => {
    const user = await learner();
    await db.aiUsageUserCap.create({
      data: {
        userId: user.id,
        feature: "experience:HAN_TUTOR",
        dailyLimitUsd: 0.05,
      },
    });
    await checkDailyUsageCap(user.id, "han-tutor-realtime-session");
    await recordAiUsage({
      userId: user.id,
      feature: "han-tutor-realtime-session",
      provider: "test-mock",
      model: "gpt-realtime-mini",
      estimatedCostUsd: 0.05,
    });
    await expect(
      checkDailyUsageCap(user.id, "han-tutor-realtime-session"),
    ).rejects.toBeInstanceOf(DailyUsageCapExceededError);
    await expect(
      checkDailyUsageCap(user.id, "han-companion-realtime-session"),
    ).resolves.toBeUndefined();
    const limits = await getUserAiUsageLimits(user.id);
    expect(
      limits.find((row) => row.feature === "experience:HAN_TUTOR"),
    ).toMatchObject({ todayCostUsd: 0.05, todayCallCount: 1 });
    expect(
      limits.find((row) => row.feature === "experience:HAN_COMPANION"),
    ).toMatchObject({ todayCostUsd: 0, todayCallCount: 0 });
  });
});
