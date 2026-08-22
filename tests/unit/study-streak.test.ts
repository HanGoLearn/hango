import { describe, expect, it } from "vitest";
import {
  computeLast7DaysActivity,
  computeStreak,
  toUtcDateString,
} from "@/lib/study-streak";

describe("computeStreak", () => {
  it("is 0 with no activity at all", () => {
    expect(computeStreak([])).toEqual({ currentStreak: 0, activeToday: false });
  });

  it("counts today and consecutive prior days", () => {
    const result = computeStreak(
      ["2026-01-01", "2026-01-02", "2026-01-03"],
      "2026-01-03",
    );
    expect(result).toEqual({ currentStreak: 3, activeToday: true });
  });

  it("still counts an unbroken streak ending yesterday, even without activity today yet", () => {
    const result = computeStreak(["2026-01-01", "2026-01-02"], "2026-01-03");
    expect(result).toEqual({ currentStreak: 2, activeToday: false });
  });

  it("resets to 0 once there's a gap before today", () => {
    const result = computeStreak(["2026-01-01"], "2026-01-03");
    expect(result).toEqual({ currentStreak: 0, activeToday: false });
  });

  it("ignores dates that aren't part of the unbroken streak ending at today/yesterday", () => {
    const result = computeStreak(
      ["2025-12-01", "2026-01-02", "2026-01-03"],
      "2026-01-03",
    );
    expect(result.currentStreak).toBe(2);
  });

  it("deduplicates repeated same-day entries", () => {
    const result = computeStreak(
      ["2026-01-03", "2026-01-03", "2026-01-03"],
      "2026-01-03",
    );
    expect(result.currentStreak).toBe(1);
  });
});

describe("toUtcDateString", () => {
  it("formats a Date as YYYY-MM-DD in UTC", () => {
    expect(toUtcDateString(new Date("2026-03-05T23:59:59Z"))).toBe(
      "2026-03-05",
    );
  });
});

describe("computeLast7DaysActivity", () => {
  it("returns 7 days, oldest first, ending on today", () => {
    const result = computeLast7DaysActivity([], "2026-01-10");
    expect(result.map((d) => d.date)).toEqual([
      "2026-01-04",
      "2026-01-05",
      "2026-01-06",
      "2026-01-07",
      "2026-01-08",
      "2026-01-09",
      "2026-01-10",
    ]);
  });

  it("marks only the days that appear in activityDates as active", () => {
    const result = computeLast7DaysActivity(
      ["2026-01-05", "2026-01-10", "2025-12-25"],
      "2026-01-10",
    );
    const active = result.filter((d) => d.active).map((d) => d.date);
    expect(active).toEqual(["2026-01-05", "2026-01-10"]);
  });

  it("deduplicates repeated same-day entries without affecting other days", () => {
    const result = computeLast7DaysActivity(
      ["2026-01-10", "2026-01-10", "2026-01-10"],
      "2026-01-10",
    );
    expect(result.filter((d) => d.active)).toHaveLength(1);
  });
});
