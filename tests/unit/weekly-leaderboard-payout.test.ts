import { describe, expect, it } from "vitest";
import { isoWeekBounds } from "@/lib/weekly-leaderboard-payout";

describe("isoWeekBounds", () => {
  it("returns Monday 00:00 UTC as the start for a date mid-week", () => {
    // Wednesday 2026-08-26 -> week starts Monday 2026-08-24
    const { start, end } = isoWeekBounds(new Date("2026-08-26T15:30:00Z"));
    expect(start.toISOString()).toBe("2026-08-24T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-08-31T00:00:00.000Z");
  });

  it("treats Sunday as the last day of the week (ISO, not US convention)", () => {
    // Sunday 2026-08-30 is still inside the week that started Monday 2026-08-24
    const { start, end } = isoWeekBounds(new Date("2026-08-30T23:59:59Z"));
    expect(start.toISOString()).toBe("2026-08-24T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-08-31T00:00:00.000Z");
  });

  it("handles a date that is itself the Monday boundary", () => {
    const { start, end } = isoWeekBounds(new Date("2026-08-24T00:00:00Z"));
    expect(start.toISOString()).toBe("2026-08-24T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-08-31T00:00:00.000Z");
  });

  it("handles a year boundary correctly", () => {
    // Thursday 2026-01-01 falls in the week starting Monday 2025-12-29
    const { start, end } = isoWeekBounds(new Date("2026-01-01T12:00:00Z"));
    expect(start.toISOString()).toBe("2025-12-29T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-01-05T00:00:00.000Z");
  });
});
