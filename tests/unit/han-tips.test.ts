import { describe, expect, it } from "vitest";
import { HAN_TIPS, getDailyHanTip } from "@/lib/han-tips";

describe("getDailyHanTip", () => {
  it("returns the same tip for two calls on the same calendar day", () => {
    const morning = new Date("2026-08-21T01:00:00Z");
    const night = new Date("2026-08-21T23:00:00Z");
    expect(getDailyHanTip(morning).id).toBe(getDailyHanTip(night).id);
  });

  it("returns a different tip on a different day", () => {
    const day1 = new Date("2026-08-21T12:00:00Z");
    const day2 = new Date("2026-08-22T12:00:00Z");
    expect(getDailyHanTip(day1).id).not.toBe(getDailyHanTip(day2).id);
  });

  it("wraps around after cycling through every tip", () => {
    const day1 = new Date("2026-08-21T12:00:00Z");
    const wrapped = new Date(day1.getTime() + HAN_TIPS.length * 86_400_000);
    expect(getDailyHanTip(wrapped).id).toBe(getDailyHanTip(day1).id);
  });

  it("only ever returns tips from the known list", () => {
    const ids = new Set(HAN_TIPS.map((t) => t.id));
    for (let i = 0; i < HAN_TIPS.length; i++) {
      const date = new Date(Date.now() + i * 86_400_000);
      expect(ids.has(getDailyHanTip(date).id)).toBe(true);
    }
  });
});
