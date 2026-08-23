import { describe, expect, it } from "vitest";
import {
  HANDWRITTEN_LEVEL_CONFIG,
  HANDWRITTEN_LEVELS,
  HANDWRITTEN_TOPIC_CONFIG,
  HANDWRITTEN_TOPICS,
  isHandwrittenLevel,
  isHandwrittenTopic,
} from "@/lib/handwritten-writing";

describe("handwritten paragraph catalog", () => {
  it("uses the same three topics at every level", () => {
    expect(HANDWRITTEN_TOPICS).toEqual(["FAMILY", "ROUTINE", "SHOPPING"]);
    for (const topic of HANDWRITTEN_TOPICS) {
      for (const level of HANDWRITTEN_LEVELS) {
        expect(
          HANDWRITTEN_TOPIC_CONFIG[topic].prompts[level].length,
        ).toBeGreaterThan(20);
      }
    }
  });

  it("defines a professional 100-point weighted rubric for every level", () => {
    for (const level of HANDWRITTEN_LEVELS) {
      const totalWeight = HANDWRITTEN_LEVEL_CONFIG[level].rubric.reduce(
        (sum, dimension) => sum + dimension.weight,
        0,
      );
      expect(totalWeight).toBe(100);
      expect(HANDWRITTEN_LEVEL_CONFIG[level].rubric).toHaveLength(6);
    }
  });

  it("uses the requested character thresholds", () => {
    expect(HANDWRITTEN_LEVEL_CONFIG.BASIC.minimumCharacters).toBe(60);
    expect(HANDWRITTEN_LEVEL_CONFIG.BASIC.maximumCharacters).toBe(90);
    expect(HANDWRITTEN_LEVEL_CONFIG.INTERMEDIATE.minimumCharacters).toBe(90);
    expect(HANDWRITTEN_LEVEL_CONFIG.INTERMEDIATE.maximumCharacters).toBe(300);
    expect(HANDWRITTEN_LEVEL_CONFIG.ADVANCED.minimumCharacters).toBe(300);
    expect(HANDWRITTEN_LEVEL_CONFIG.ADVANCED.maximumCharacters).toBeNull();
  });

  it("rejects unsupported level and topic values", () => {
    expect(isHandwrittenLevel("BASIC")).toBe(true);
    expect(isHandwrittenLevel("HSK5")).toBe(false);
    expect(isHandwrittenTopic("SHOPPING")).toBe(true);
    expect(isHandwrittenTopic("TRAVEL")).toBe(false);
  });
});
