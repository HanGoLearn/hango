import { describe, expect, it } from "vitest";
import {
  SPEAKING_CLOSING_RESERVE_MS,
  speakingSessionTiming,
} from "@/lib/speaking-session-timing";

describe("speakingSessionTiming", () => {
  it.each([
    [1, 120_000, 132_000],
    [2, 160_000, 172_000],
    [4, 240_000, 252_000],
    [5, 300_000, 312_000],
  ])(
    "gives HSK %i the full practice window before natural closing",
    (hsk, naturalCloseAfterMs, maxSessionMs) => {
      expect(speakingSessionTiming(hsk)).toEqual({
        naturalCloseAfterMs,
        maxSessionMs,
      });
      expect(naturalCloseAfterMs).toBeGreaterThanOrEqual(120_000);
      expect(maxSessionMs - naturalCloseAfterMs).toBe(
        SPEAKING_CLOSING_RESERVE_MS,
      );
    },
  );
});
