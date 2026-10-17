import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
const features = [
  "ai-teacher-chat",
  "han-tutor-chat",
  "han-companion-chat",
  "roleplay-chat",
];
const originalCaps = await db.aiUsageCap.findMany({
  where: { feature: { in: features } },
});
const userIds: string[] = [];
afterEach(async () => {
  await db.user.deleteMany({ where: { id: { in: userIds.splice(0) } } });
  await db.aiUsageCap.deleteMany({ where: { feature: { in: features } } });
  if (originalCaps.length)
    await db.aiUsageCap.createMany({ data: originalCaps });
});
const statements = readFileSync(
  "prisma/migrations/20261010130000_separate_han_text_usage_limits/migration.sql",
  "utf8",
)
  .replace(/--[^\n]*/g, "")
  .split(";")
  .map((sql) => sql.trim())
  .filter((sql) => sql.startsWith("INSERT INTO"));
describe("Han text policy copy (isolated database)", () => {
  it("preserves existing blocks and separately set limits without reclassifying historical logs", async () => {
    const user = await db.user.create({
      data: { email: `han-text-policy-${randomUUID()}@hango.dev` },
    });
    userIds.push(user.id);
    await db.aiUsageCap.deleteMany({ where: { feature: { in: features } } });
    await db.aiUsageCap.createMany({
      data: [
        { feature: "ai-teacher-chat", dailyLimitUsd: 2 },
        { feature: "han-companion-chat", dailyLimitUsd: 0.5 },
      ],
    });
    await db.aiUsageUserCap.createMany({
      data: [
        { userId: user.id, feature: "ai-teacher-chat", dailyLimitUsd: 0 },
        { userId: user.id, feature: "han-tutor-chat", dailyLimitUsd: 0.1 },
      ],
    });
    await db.aiUsageLog.create({
      data: {
        userId: user.id,
        feature: "ai-teacher-chat",
        provider: "test-mock",
        model: "test-model",
        estimatedCostUsd: 0.02,
      },
    });
    for (let pass = 0; pass < 2; pass++)
      await db.$transaction(statements.map((sql) => db.$executeRawUnsafe(sql)));
    const limits = await db.aiUsageUserCap.findMany({
      where: { userId: user.id },
    });
    expect(
      limits.find((row) => row.feature === "han-companion-chat"),
    ).toMatchObject({
      dailyLimitUsd: 0,
    });
    expect(
      limits.find((row) => row.feature === "han-tutor-chat"),
    ).toMatchObject({
      dailyLimitUsd: 0.1,
    });
    expect(
      await db.aiUsageCap.findUnique({
        where: { feature: "han-companion-chat" },
      }),
    ).toMatchObject({ dailyLimitUsd: 0.5 });
    expect(
      await db.aiUsageCap.findUnique({ where: { feature: "han-tutor-chat" } }),
    ).toMatchObject({ dailyLimitUsd: 2 });
    expect(
      await db.aiUsageLog.findFirst({ where: { userId: user.id } }),
    ).toMatchObject({ feature: "ai-teacher-chat", estimatedCostUsd: 0.02 });
  });
});
