import { describe, expect, it } from "vitest";
import {
  resolveLessonAvailability,
  resolveScenarioStatus,
  resolveContinueLearning,
  resolveJourneyChapter,
} from "@/lib/content/learning-journey";

describe("resolveLessonAvailability", () => {
  const lessons = [
    { id: "l1", order: 0 },
    { id: "l2", order: 1 },
    { id: "l3", order: 2 },
  ];

  it("the first lesson is always available when nothing is completed", () => {
    const result = resolveLessonAvailability(lessons, new Set());
    expect(result.get("l1")).toBe("AVAILABLE");
    expect(result.get("l2")).toBe("LOCKED");
    expect(result.get("l3")).toBe("LOCKED");
  });

  it("unlocks the next lesson once the previous one is completed", () => {
    const result = resolveLessonAvailability(lessons, new Set(["l1"]));
    expect(result.get("l1")).toBe("COMPLETED");
    expect(result.get("l2")).toBe("AVAILABLE");
    expect(result.get("l3")).toBe("LOCKED");
  });

  it("keeps completed lessons accessible even after later ones unlock", () => {
    const result = resolveLessonAvailability(lessons, new Set(["l1", "l2"]));
    expect(result.get("l1")).toBe("COMPLETED");
    expect(result.get("l2")).toBe("COMPLETED");
    expect(result.get("l3")).toBe("AVAILABLE");
  });

  it("does not depend on input array order (sorts by `order` itself)", () => {
    const shuffled = [lessons[2]!, lessons[0]!, lessons[1]!];
    const result = resolveLessonAvailability(shuffled, new Set(["l1"]));
    expect(result.get("l2")).toBe("AVAILABLE");
    expect(result.get("l3")).toBe("LOCKED");
  });
});

describe("resolveScenarioStatus", () => {
  it("is AVAILABLE when nothing is completed", () => {
    expect(resolveScenarioStatus(4, 0)).toBe("AVAILABLE");
  });

  it("is IN_PROGRESS partway through", () => {
    expect(resolveScenarioStatus(4, 2)).toBe("IN_PROGRESS");
  });

  it("is COMPLETED once every lesson is done", () => {
    expect(resolveScenarioStatus(4, 4)).toBe("COMPLETED");
  });

  it("treats a scenario with zero lessons as AVAILABLE, not COMPLETED", () => {
    expect(resolveScenarioStatus(0, 0)).toBe("AVAILABLE");
  });
});

describe("resolveContinueLearning", () => {
  const scenarios = [
    {
      slug: "restaurant",
      levels: [
        {
          lessons: [
            { id: "r1", order: 0, slug: "r1", title: "Entering and Ordering" },
            { id: "r2", order: 1, slug: "r2", title: "Ingredients" },
          ],
        },
      ],
    },
    {
      slug: "hotel",
      levels: [
        {
          lessons: [{ id: "h1", order: 0, slug: "h1", title: "Check-In" }],
        },
      ],
    },
  ];

  it("resolves to the very first lesson when nothing is completed", () => {
    const result = resolveContinueLearning(scenarios, new Set());
    expect(result).toEqual({
      scenarioSlug: "restaurant",
      lessonSlug: "r1",
      lessonTitle: "Entering and Ordering",
    });
  });

  it("resolves to the next lesson in the same scenario", () => {
    const result = resolveContinueLearning(scenarios, new Set(["r1"]));
    expect(result?.lessonSlug).toBe("r2");
  });

  it("moves to the next scenario once the current one is finished", () => {
    const result = resolveContinueLearning(scenarios, new Set(["r1", "r2"]));
    expect(result?.scenarioSlug).toBe("hotel");
    expect(result?.lessonSlug).toBe("h1");
  });

  it("returns null once everything is completed", () => {
    const result = resolveContinueLearning(
      scenarios,
      new Set(["r1", "r2", "h1"]),
    );
    expect(result).toBeNull();
  });
});

describe("resolveJourneyChapter", () => {
  it("single-tier scenarios map to their own chapter", () => {
    expect(resolveJourneyChapter(["BEGINNER"])).toBe("BEGINNER");
    expect(resolveJourneyChapter(["INTERMEDIATE"])).toBe("INTERMEDIATE");
    expect(resolveJourneyChapter(["ADVANCED"])).toBe("ADVANCED");
  });

  it("folds UPPER_INTERMEDIATE into the Intermediate chapter", () => {
    expect(resolveJourneyChapter(["UPPER_INTERMEDIATE"])).toBe(
      "INTERMEDIATE",
    );
  });

  it("a scenario spanning tiers surfaces under its lowest one", () => {
    expect(resolveJourneyChapter(["BEGINNER", "INTERMEDIATE"])).toBe(
      "BEGINNER",
    );
    expect(resolveJourneyChapter(["INTERMEDIATE", "ADVANCED"])).toBe(
      "INTERMEDIATE",
    );
  });

  it("does not depend on input array order", () => {
    expect(resolveJourneyChapter(["ADVANCED", "BEGINNER"])).toBe("BEGINNER");
  });
});
