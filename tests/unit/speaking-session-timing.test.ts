import { describe, expect, it } from "vitest";
import {
  SPEAKING_CLOSING_RESERVE_MS,
  speakingSessionTiming,
} from "@/lib/speaking-session-timing";

describe("speakingSessionTiming", () => {
  it.each([
    [0, 75_000, 87_000],
    [1, 75_000, 87_000],
    [2, 115_000, 127_000],
    [3, 195_000, 207_000],
    [4, 195_000, 207_000],
    [5, 255_000, 267_000],
    [9, 255_000, 267_000],
    [null, 195_000, 207_000],
  ])(
    "gives HSK %i the full practice window before natural closing",
    (hsk, naturalCloseAfterMs, maxSessionMs) => {
      expect(speakingSessionTiming(hsk)).toEqual({
        naturalCloseAfterMs,
        maxSessionMs,
      });
      expect(naturalCloseAfterMs).toBeGreaterThanOrEqual(75_000);
      expect(maxSessionMs - naturalCloseAfterMs).toBe(
        SPEAKING_CLOSING_RESERVE_MS,
      );
    },
  );
  it.each([1, 2, 3, 4, 5, 9, null])(
    "preserves Lab duration for %s",
    (level) => {
      const journey = speakingSessionTiming(level);
      const lab = speakingSessionTiming(level, "SPEAKING_LAB");
      expect(lab.naturalCloseAfterMs - journey.naturalCloseAfterMs).toBe(
        45_000,
      );
      expect(lab.maxSessionMs - journey.maxSessionMs).toBe(45_000);
    },
  );
});
