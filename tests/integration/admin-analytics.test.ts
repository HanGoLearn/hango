import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { getAdminAnalytics } from "@/lib/admin-analytics";

// getAdminAnalytics(period, excludeUserId) exists so the platform owner's
// own testing/usage never inflates "real learner" metrics - see
// src/lib/admin-analytics.ts's own comment on why excludeUserId (an id-
// keyed join) and its separate ADMIN_EMAIL-literal cohort filter are two
// different mechanisms. These tests exercise the excludeUserId path with a
// throwaway user created here, not the real administrator account (2026-09-
// 16, QA-01: CI has no such account and must not depend on one existing).
// The ADMIN_EMAIL-literal cohort filter is a trivial `email != literal`
// clause exercised implicitly wherever that account happens to exist, but
// is not this suite's concern.
const testUserIds: string[] = [];

afterEach(async () => {
  if (testUserIds.length) {
    await db.user.deleteMany({ where: { id: { in: testUserIds.splice(0) } } });
  }
});

async function createTestUser(prefix: string) {
  const user = await db.user.create({
    data: { email: `${prefix}-${randomUUID()}@hango.dev` },
  });
  testUserIds.push(user.id);
  return user;
}

describe("admin analytics (integration, real database)", () => {
  it("returns coherent funnel, retention, system, cost, and alert metrics", async () => {
    const admin = await createTestUser("admin-analytics-shape");
    const analytics = await getAdminAnalytics(30, admin.id);

    expect(analytics.period).toBe(30);
    expect(analytics.trend).toHaveLength(30);
    expect(analytics.retention.map((item) => item.day)).toEqual([1, 7, 30]);
    expect(analytics.funnel.map((stage) => stage.label)).toEqual([
      "Registro",
      "Correo verificado",
      "Onboarding completo",
      "Primera lección iniciada",
      "Primera lección completada",
      "Primer escenario completado",
    ]);

    for (let index = 1; index < analytics.funnel.length; index += 1) {
      expect(analytics.funnel[index]!.users).toBeLessThanOrEqual(
        analytics.funnel[index - 1]!.users,
      );
    }
    for (const retention of analytics.retention) {
      expect(retention.returned).toBeLessThanOrEqual(retention.eligible);
      expect(retention.rate).toBeGreaterThanOrEqual(0);
      expect(retention.rate).toBeLessThanOrEqual(100);
    }

    expect(analytics.systems.map((system) => system.label)).toEqual([
      "Learning Journey",
      "Han Tutor",
      "Han Companion",
      "Speaking Lab",
      "Writing Lab",
      "Missions",
      "HanVocabulary",
      "Placement",
    ]);
    expect(analytics.ai.totalCostUsd).toBeGreaterThanOrEqual(0);
    expect(analytics.ai.totalCalls).toBeGreaterThanOrEqual(0);
    expect(analytics.activity.dau).toBeLessThanOrEqual(analytics.activity.wau);
    expect(analytics.activity.wau).toBeLessThanOrEqual(analytics.activity.mau);
    expect(analytics.activity.logicalSessions).toBeGreaterThanOrEqual(0);
    expect(analytics.activity.medianActiveSeconds).toBeGreaterThanOrEqual(0);
    expect(analytics.activity.totalActiveSeconds).toBeGreaterThanOrEqual(0);
    for (const row of analytics.ai.rows) {
      expect(["TOKEN_RATES", "PER_MINUTE", "LEGACY_ESTIMATE"]).toContain(
        row.calculationMethod,
      );
      expect(row.durationSeconds).toBeGreaterThanOrEqual(0);
    }
    expect(analytics.methodology.separation).toContain(
      "Han Tutor y Han Companion",
    );
    expect(analytics.methodology.separation).toContain(
      "Learning Journey Speaking",
    );
  });

  it("excludes the given user's own AI usage and coins (2026-09-08 optimization safety net)", async () => {
    const admin = await createTestUser("admin-analytics-exclusion");
    const marker = `admin-analytics-exclusion-${randomUUID()}`;

    try {
      await Promise.all([
        db.aiUsageLog.create({
          data: {
            userId: admin.id,
            feature: "vocabulary-lookup",
            provider: marker,
            model: "test-model",
            estimatedCostUsd: 999,
          },
        }),
        db.coinLedgerEntry.create({
          data: {
            userId: admin.id,
            amount: 100_000,
            reason: marker,
            sourceKey: marker,
          },
        }),
      ]);

      const analytics = await getAdminAnalytics(7, admin.id);

      // Either fake value leaking through would dwarf real activity and be
      // immediately obvious - the strongest possible sign the exclusion
      // filters (learnerProfile/aiUsageLog/coinLedgerEntry -> user joins)
      // still work after any refactor.
      expect(analytics.ai.totalCostUsd).toBeLessThan(999);
      expect(analytics.economy.earnedCoins).toBeLessThan(100_000);
    } finally {
      await Promise.all([
        db.aiUsageLog.deleteMany({ where: { provider: marker } }),
        db.coinLedgerEntry.deleteMany({ where: { sourceKey: marker } }),
      ]);
    }
  });
});
