import { beforeEach, describe, expect, it, vi } from "vitest";

const { findProgress, getLessonOptions } = vi.hoisted(() => ({
  findProgress: vi.fn(),
  getLessonOptions: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: { learnerLessonProgress: { findMany: findProgress } },
}));

vi.mock("@/lib/content/speaking-prompts", () => ({
  getSpeakingLessonOptions: getLessonOptions,
}));

import { getBetaSpeakingStations } from "@/lib/beta-speaking-stations";

const options = [
  {
    id: "lesson-intro",
    slug: "foundations-greetings-and-introductions",
    title: "Saludos y presentaciones",
    scenarioTitle: "Primeros pasos",
    scenarioSlug: "getting-started",
    difficulty: "BEGINNER",
    chapter: "BEGINNER",
  },
  {
    id: "lesson-numbers",
    slug: "foundations-numbers-time-and-dates",
    title: "Números, hora y fechas",
    scenarioTitle: "Primeros pasos",
    scenarioSlug: "getting-started",
    difficulty: "BEGINNER",
    chapter: "BEGINNER",
  },
  {
    id: "lesson-prices",
    slug: "basic-shopping-asking-the-price",
    title: "Preguntar el precio",
    scenarioTitle: "Compras básicas",
    scenarioSlug: "basic-shopping",
    difficulty: "BEGINNER",
    chapter: "BEGINNER",
  },
  {
    id: "lesson-extra",
    slug: "family-introducing-your-family",
    title: "Tu familia",
    scenarioTitle: "Familia",
    scenarioSlug: "family",
    difficulty: "BEGINNER",
    chapter: "BEGINNER",
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  getLessonOptions.mockResolvedValue(options);
  findProgress.mockResolvedValue([{ lessonId: "lesson-numbers" }]);
});

describe("beta Speaking Lab station data", () => {
  it("returns only the curated lessons and unlocks only lessons this learner started", async () => {
    const stations = await getBetaSpeakingStations("learner-1", "es");

    expect(stations.map((station) => station.id)).toEqual([
      "INTRODUCTIONS",
      "NUMBERS_TIME",
      "PRICES",
    ]);
    expect(stations.map((station) => station.unlocked)).toEqual([
      false,
      true,
      false,
    ]);
    expect(getLessonOptions).toHaveBeenCalledWith("es");
    expect(findProgress).toHaveBeenCalledWith({
      where: {
        userId: "learner-1",
        lessonId: {
          in: ["lesson-intro", "lesson-numbers", "lesson-prices"],
        },
      },
      select: { lessonId: true },
    });
  });
});
