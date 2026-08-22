import { describe, expect, it } from "vitest";
import { isOnCooldown, REVIEW_COOLDOWN_HOURS } from "@/lib/review-queue";

describe("isOnCooldown", () => {
  it("is true immediately after review", () => {
    const now = new Date("2026-01-02T00:00:00Z");
    expect(isOnCooldown(now, now)).toBe(true);
  });

  it("is true just under the cooldown window", () => {
    const now = new Date("2026-01-02T00:00:00Z");
    const reviewedAt = new Date(
      now.getTime() - (REVIEW_COOLDOWN_HOURS - 1) * 60 * 60 * 1000,
    );
    expect(isOnCooldown(reviewedAt, now)).toBe(true);
  });

  it("is false once the cooldown window has passed", () => {
    const now = new Date("2026-01-02T00:00:00Z");
    const reviewedAt = new Date(
      now.getTime() - (REVIEW_COOLDOWN_HOURS + 1) * 60 * 60 * 1000,
    );
    expect(isOnCooldown(reviewedAt, now)).toBe(false);
  });
});
