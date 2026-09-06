import { describe, expect, it } from "vitest";
import { getAdminAnalytics } from "@/lib/admin-analytics";

describe("admin analytics (integration, real database)", () => {
  it("returns coherent funnel, retention, system, cost, and alert metrics", async () => {
    const analytics = await getAdminAnalytics(30);

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
});
