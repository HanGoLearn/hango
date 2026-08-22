import { describe, expect, it } from "vitest";
import { estimateCostUsd } from "@/lib/ai/cost";

describe("estimateCostUsd", () => {
  it("is 0 for the mock model", () => {
    expect(estimateCostUsd("mock-teacher-v1", 1000, 500)).toBe(0);
  });

  it("scales with token counts for a priced model", () => {
    const cost = estimateCostUsd("claude-sonnet-5", 1_000_000, 1_000_000);
    expect(cost).toBeCloseTo(18, 5); // $3 input + $15 output per million
  });

  it("uses the current OpenAI beta-model pricing", () => {
    expect(estimateCostUsd("gpt-4o-mini", 1_000_000, 1_000_000)).toBeCloseTo(
      0.75,
      5,
    );
  });

  it("falls back to default pricing for an unknown model rather than throwing", () => {
    expect(() => estimateCostUsd("some-future-model", 100, 100)).not.toThrow();
    expect(estimateCostUsd("some-future-model", 0, 0)).toBe(0);
  });
});
