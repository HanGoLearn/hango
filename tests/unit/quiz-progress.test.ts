import { describe, expect, it } from "vitest";
import { calculateScore } from "@/lib/quiz-progress";

describe("calculateScore", () => {
  it("is 0 for an empty attempt", () => {
    expect(calculateScore([])).toBe(0);
  });

  it("is 100 when every answer is correct", () => {
    expect(calculateScore([{ isCorrect: true }, { isCorrect: true }])).toBe(
      100,
    );
  });

  it("is 0 when every answer is wrong", () => {
    expect(calculateScore([{ isCorrect: false }, { isCorrect: false }])).toBe(
      0,
    );
  });

  it("rounds a partial score to the nearest percent", () => {
    expect(
      calculateScore([
        { isCorrect: true },
        { isCorrect: false },
        { isCorrect: false },
      ]),
    ).toBe(33);
  });
});
