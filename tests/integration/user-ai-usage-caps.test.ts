import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { checkDailyUsageCap, DailyUsageCapExceededError } from "@/lib/ai-usage";
import { getUserAiUsageLimits, setUserAiUsageCap } from "@/lib/admin-ai-usage";

const testUserIds: string[] = [];

afterEach(async () => {
  if (testUserIds.length) {
    await db.user.deleteMany({ where: { id: { in: testUserIds.splice(0) } } });
  }
});

async function createLearner() {
  const user = await db.user.create({
    data: { email: `user-ai-cap-${randomUUID()}@hango.dev` },
  });
  testUserIds.push(user.id);
  return user;
}

describe("per-user AI usage caps (integration, real database)", () => {
  it("overrides one learner without changing another learner", async () => {
    const [restricted, unaffected] = await Promise.all([
      createLearner(),
      createLearner(),
    ]);
    await setUserAiUsageCap({
      userId: restricted.id,
      feature: "han-speech",
      mode: "BLOCKED",
    });

    await expect(
      checkDailyUsageCap(restricted.id, "han-speech"),
    ).rejects.toBeInstanceOf(DailyUsageCapExceededError);
    await expect(
      checkDailyUsageCap(unaffected.id, "han-speech"),
    ).resolves.toBeUndefined();

    const restrictedLimits = await getUserAiUsageLimits(restricted.id);
    expect(
      restrictedLimits.find((row) => row.feature === "han-speech"),
    ).toMatchObject({
      mode: "BLOCKED",
      customLimitUsd: 0,
      effectiveLimitUsd: 0,
    });
  });

  it("uses a custom amount and can return to the general limit", async () => {
    const learner = await createLearner();
    await setUserAiUsageCap({
      userId: learner.id,
      feature: "writing-feedback",
      mode: "CUSTOM",
      dailyLimitUsd: 0.25,
    });
    let row = (await getUserAiUsageLimits(learner.id)).find(
      (item) => item.feature === "writing-feedback",
    );
    expect(row).toMatchObject({
      mode: "CUSTOM",
      customLimitUsd: 0.25,
      effectiveLimitUsd: 0.25,
    });

    await setUserAiUsageCap({
      userId: learner.id,
      feature: "writing-feedback",
      mode: "GENERAL",
    });
    row = (await getUserAiUsageLimits(learner.id)).find(
      (item) => item.feature === "writing-feedback",
    );
    expect(row).toMatchObject({ mode: "GENERAL", customLimitUsd: null });
    expect(row?.effectiveLimitUsd).toBe(row?.generalLimitUsd);
  });
});
