// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  read: vi.fn(),
  points: vi.fn(),
  oldReport: vi.fn(),
}));
vi.mock("@/lib/journey-lesson-report-service", () => ({
  getJourneyLessonReport: mocks.read,
}));
vi.mock("@/lib/general-level", () => ({
  computeLessonEarnedPoints: mocks.points,
}));
vi.mock("@/lib/db", () => ({
  db: {
    coinLedgerEntry: { findFirst: vi.fn().mockResolvedValue({ amount: 3 }) },
    lessonReflectionReport: { findUnique: mocks.oldReport },
  },
}));
vi.mock("@/lib/avatar-data", () => ({
  getAvatarPageData: vi.fn().mockResolvedValue({ coinBalance: 20 }),
}));
vi.mock("@/lib/leaderboard-data", () => ({
  getLearnerRank: vi.fn().mockResolvedValue(null),
}));
vi.mock("@/lib/achievements", () => ({
  getAchievementSummary: vi
    .fn()
    .mockResolvedValue({ unlockedCount: 0, totalCount: 10, recent: [] }),
}));
import { LessonRewardsPanel } from "@/components/lesson/lesson-rewards-panel";
import { messages as es } from "@/i18n/messages/es";
import { messages as en } from "@/i18n/messages/en";
afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  mocks.points.mockResolvedValue(5);
});
describe("v2 rewards are confirmed contributions, not repeat payouts", () => {
  it.each(["es", "en"] as const)(
    "shows registered coins and point contribution in %s without a new payment promise",
    async (locale) => {
      mocks.read.mockResolvedValue({
        rewards: { settlement: "SETTLED" },
        overall: { score: 93 },
      });
      render(
        await LessonRewardsPanel({
          userId: "owner",
          lessonId: "lesson",
          locale,
          messages: (locale === "es" ? es : en).lesson.rewards,
          journeyReport: true,
        }),
      );
      expect(
        screen.getByText(
          locale === "es" ? "3 HanCoins registrados" : "3 HanCoins recorded",
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          locale === "es" ? "Aporte: 5 puntos" : "Contribution: 5 points",
        ),
      ).toBeInTheDocument();
      expect(screen.queryByText("+3 HanCoins")).not.toBeInTheDocument();
      expect(mocks.read).toHaveBeenCalledWith("owner", "lesson");
      expect(mocks.points).toHaveBeenCalledWith("lesson", 93);
      expect(mocks.oldReport).not.toHaveBeenCalled();
    },
  );
  it("a redo/partial report does not claim old coins or calculate new General Level", async () => {
    mocks.read.mockResolvedValue({
      rewards: { settlement: "NOT_SETTLED" },
      overall: { score: null },
    });
    render(
      await LessonRewardsPanel({
        userId: "owner",
        lessonId: "lesson",
        locale: "es",
        messages: es.lesson.rewards,
        journeyReport: true,
      }),
    );
    expect(mocks.points).not.toHaveBeenCalled();
    expect(
      screen.queryByText("3 HanCoins registrados"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Tienes 20 en total")).toBeInTheDocument();
  });
  it("an unavailable/corrupt report still shows the balance but no claimed contribution", async () => {
    mocks.read.mockRejectedValue(new Error("integrity failure"));
    render(
      await LessonRewardsPanel({
        userId: "owner",
        lessonId: "lesson",
        locale: "es",
        messages: es.lesson.rewards,
        journeyReport: true,
      }),
    );
    expect(mocks.points).not.toHaveBeenCalled();
    expect(screen.getByText("Tienes 20 en total")).toBeInTheDocument();
    expect(
      screen.queryByText("3 HanCoins registrados"),
    ).not.toBeInTheDocument();
  });
});
