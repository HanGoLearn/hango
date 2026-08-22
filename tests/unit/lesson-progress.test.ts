import { describe, expect, it } from "vitest";
import {
  resolveStepAvailability,
  resolveNextStepId,
  resolvePreviousStepId,
  isLessonComplete,
} from "@/lib/lesson-progress";

const steps = [
  { id: "s1", order: 0 },
  { id: "s2", order: 1 },
  { id: "s3", order: 2 },
];

describe("resolveStepAvailability", () => {
  it("the first step is always available when nothing is completed", () => {
    const result = resolveStepAvailability(steps, new Set());
    expect(result.get("s1")).toBe("AVAILABLE");
    expect(result.get("s2")).toBe("LOCKED");
    expect(result.get("s3")).toBe("LOCKED");
  });

  it("unlocks the next step once the previous one is completed", () => {
    const result = resolveStepAvailability(steps, new Set(["s1"]));
    expect(result.get("s1")).toBe("COMPLETED");
    expect(result.get("s2")).toBe("AVAILABLE");
    expect(result.get("s3")).toBe("LOCKED");
  });

  it("keeps completed steps accessible even after later ones unlock", () => {
    const result = resolveStepAvailability(steps, new Set(["s1", "s2"]));
    expect(result.get("s1")).toBe("COMPLETED");
    expect(result.get("s2")).toBe("COMPLETED");
    expect(result.get("s3")).toBe("AVAILABLE");
  });

  it("does not depend on input array order (sorts by `order` itself)", () => {
    const shuffled = [steps[2]!, steps[0]!, steps[1]!];
    const result = resolveStepAvailability(shuffled, new Set(["s1"]));
    expect(result.get("s2")).toBe("AVAILABLE");
    expect(result.get("s3")).toBe("LOCKED");
  });
});

describe("resolveNextStepId", () => {
  it("returns the next step in order", () => {
    expect(resolveNextStepId(steps, "s1")).toBe("s2");
  });

  it("returns null for the last step", () => {
    expect(resolveNextStepId(steps, "s3")).toBeNull();
  });

  it("returns null for an unknown step id", () => {
    expect(resolveNextStepId(steps, "unknown")).toBeNull();
  });
});

describe("resolvePreviousStepId", () => {
  it("returns the previous step in order", () => {
    expect(resolvePreviousStepId(steps, "s2")).toBe("s1");
  });

  it("returns null for the first step", () => {
    expect(resolvePreviousStepId(steps, "s1")).toBeNull();
  });
});

describe("isLessonComplete", () => {
  it("is false when some steps are incomplete", () => {
    expect(isLessonComplete(steps, new Set(["s1", "s2"]))).toBe(false);
  });

  it("is true once every step is completed", () => {
    expect(isLessonComplete(steps, new Set(["s1", "s2", "s3"]))).toBe(true);
  });

  it("is true for a lesson with no steps", () => {
    expect(isLessonComplete([], new Set())).toBe(true);
  });
});
