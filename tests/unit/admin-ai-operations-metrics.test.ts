import { describe, expect, it } from "vitest";
import {
  summarizeAiOperations,
  type AiOperationMetricRow,
} from "@/lib/admin-ai-operations-metrics";

function operation(
  id: string,
  values: Partial<AiOperationMetricRow> = {},
): AiOperationMetricRow {
  return {
    id,
    userId: "user-1",
    feature: "feature-a",
    provider: "openai",
    model: "model-a",
    outcome: "SUCCESS",
    errorCode: null,
    latencyMs: 100,
    createdAt: new Date("2026-09-08T15:00:00.000Z"),
    ...values,
  };
}

describe("summarizeAiOperations", () => {
  it("keeps provider failures and cap blocks separate", () => {
    const summary = summarizeAiOperations(
      [
        operation("success-1"),
        operation("success-2", { latencyMs: 200 }),
        operation("failure", {
          outcome: "FAILURE",
          errorCode: "timeout",
          latencyMs: 12_000,
          userId: "user-2",
        }),
        operation("blocked", {
          outcome: "BLOCKED_CAP",
          errorCode: "daily_cap_exceeded",
          latencyMs: null,
        }),
      ],
      {
        period: 7,
        now: new Date("2026-09-08T18:00:00.000Z"),
        knownFeatures: ["feature-a", "feature-empty"],
        featureLabels: {
          "feature-a": "Función A",
          "feature-empty": "Sin uso",
        },
      },
    );

    expect(summary.overall).toMatchObject({
      attempts: 4,
      successes: 2,
      failures: 1,
      blocked: 1,
      successRate: 66.7,
      p50LatencyMs: 200,
      p95LatencyMs: 12_000,
      affectedUsers: 2,
    });
    expect(summary.byFeature[1]).toMatchObject({
      key: "feature-empty",
      attempts: 0,
      successRate: null,
    });
    expect(summary.errorCodes).toEqual([
      { code: "timeout", count: 1, affectedUsers: 1 },
    ]);
    expect(summary.alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: "Errores elevados en Función A" }),
        expect.objectContaining({ title: "Respuesta lenta en Función A" }),
        expect.objectContaining({ title: "Límite alcanzado en Función A" }),
      ]),
    );
  });

  it("groups provider and model and fills every day in the selected period", () => {
    const summary = summarizeAiOperations(
      [
        operation("one"),
        operation("two", {
          provider: null,
          model: null,
          createdAt: new Date("2026-09-07T04:30:00.000Z"),
        }),
      ],
      {
        period: 7,
        now: new Date("2026-09-08T18:00:00.000Z"),
        knownFeatures: ["feature-a"],
        featureLabels: { "feature-a": "Función A" },
      },
    );

    expect(summary.byProviderModel).toHaveLength(2);
    expect(summary.trend).toHaveLength(7);
    expect(
      summary.trend.reduce(
        (total, day) => total + day.successes + day.failures + day.blocked,
        0,
      ),
    ).toBe(2);
  });
});
