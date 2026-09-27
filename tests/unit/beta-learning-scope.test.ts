import { describe, expect, it } from "vitest";
import {
  BETA_SPEAKING_STATIONS,
  getMaximumJourneyChapter,
  hasFullBetaLearningAccess,
  isJourneyChapterAccessible,
  isPlacementExamAvailable,
  resolveBetaLearningScope,
} from "@/lib/beta-learning-scope";

describe("closed-beta learning scope", () => {
  it("defaults unknown values to the beginner-only scope", () => {
    expect(resolveBetaLearningScope(undefined)).toBe("FOUNDATIONS_ONLY");
    expect(resolveBetaLearningScope("unexpected")).toBe("FOUNDATIONS_ONLY");
    expect(resolveBetaLearningScope("FULL")).toBe("FULL");
  });

  it("keeps learners in Foundations while administrators retain QA access", () => {
    expect(getMaximumJourneyChapter("LEARNER", "FOUNDATIONS_ONLY")).toBe(
      "BEGINNER",
    );
    expect(
      isJourneyChapterAccessible("INTERMEDIATE", "LEARNER", "FOUNDATIONS_ONLY"),
    ).toBe(false);
    expect(hasFullBetaLearningAccess("ADMINISTRATOR", "FOUNDATIONS_ONLY")).toBe(
      true,
    );
    expect(
      isJourneyChapterAccessible(
        "ADVANCED",
        "ADMINISTRATOR",
        "FOUNDATIONS_ONLY",
      ),
    ).toBe(true);
  });

  it("restores placement and the full journey with the reversible FULL scope", () => {
    expect(isPlacementExamAvailable("LEARNER", "FULL")).toBe(true);
    expect(getMaximumJourneyChapter("LEARNER", "FULL")).toBe("ADVANCED");
  });

  it("selects exactly the three approved beta stations", () => {
    expect(BETA_SPEAKING_STATIONS).toEqual([
      {
        id: "INTRODUCTIONS",
        lessonSlug: "foundations-greetings-and-introductions",
      },
      {
        id: "NUMBERS_TIME",
        lessonSlug: "foundations-numbers-time-and-dates",
      },
      {
        id: "PRICES",
        lessonSlug: "basic-shopping-asking-the-price",
      },
    ]);
  });
});
