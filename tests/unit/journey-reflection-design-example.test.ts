import { describe, expect, it } from "vitest";
import {
  createReflectionDesignExample,
  REFLECTION_DESIGN_WEIGHTS,
} from "@/lib/journey-reflection-design-example";

describe("fictional reflection design examples", () => {
  it("keeps proposed weights explicit and summing to 100", () => {
    expect(
      Object.values(REFLECTION_DESIGN_WEIGHTS).reduce((a, b) => a + b, 0),
    ).toBe(100);
  });
  it.each(["es", "en"] as const)(
    "uses reproducible example arithmetic in %s",
    (locale) => {
      const example = createReflectionDesignExample(locale, "practice");
      expect(example.synthetic).toBe(true);
      expect(example.speaking).toBe(64);
      expect(example.overall).toBe(84);
      expect(example.stars).toBe(2);
      expect(example.exercises.map((item) => item.score)).toEqual([
        90, 83, 100,
      ]);
    },
  );
  it("does not turn partial acoustic data into zeros or a reweighted total", () => {
    const example = createReflectionDesignExample("es", "partial");
    expect(example.overall).toBeNull();
    expect(example.speaking).toBeNull();
    expect(example.stars).toBeNull();
    expect(
      example.metrics
        .filter((item) => item.acoustic)
        .every((item) => item.level === null && item.points === null),
    ).toBe(true);
    expect(example.exercises[0]!.score).toBe(90);
  });
  it("allows a strong example without pretending all dimensions are perfect", () => {
    const example = createReflectionDesignExample("en", "strong");
    expect(example.speaking).toBe(94);
    expect(example.overall).toBe(98);
    expect(
      example.metrics.find((item) => item.key === "pronunciation")!.level,
    ).toBe(3);
  });
});
