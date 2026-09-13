// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ScenarioMasteryList } from "@/components/progress/scenario-mastery-list";
import { WeeklyBonusCountdown } from "@/components/leaderboard/weekly-bonus-countdown";
import { messages as spanishMessages } from "@/i18n/messages/es";
import { SpeakingFeedbackDisplay } from "@/components/speaking/speaking-feedback-display";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("phase 3 learner interface translations", () => {
  it("localizes scenario mastery state without changing the authored scenario name", () => {
    render(
      <ScenarioMasteryList
        scenarios={[
          {
            slug: "restaurant",
            name: "At a Restaurant",
            completionPercent: 100,
            mastered: true,
          },
        ]}
        messages={spanishMessages.progress}
      />,
    );

    expect(screen.getByText("At a Restaurant")).toBeInTheDocument();
    expect(screen.getByText("Dominado")).toBeInTheDocument();
    expect(screen.getByLabelText("100% completado")).toBeInTheDocument();
  });

  it("localizes the weekly leaderboard reward", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-09T12:00:00Z"));
    render(
      <WeeklyBonusCountdown
        weekEndsAt="2026-09-10T12:00:00Z"
        messages={spanishMessages.leaderboard}
      />,
    );

    expect(screen.getByText("Premio semanal en 1d 0h")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Los 3 primeros ganan 50 / 30 / 10 HanCoins esta semana",
      ),
    ).toBeInTheDocument();
  });

  it("localizes Speaking Lab feedback chrome while preserving generated feedback", () => {
    render(
      <SpeakingFeedbackDisplay
        transcript="我喜欢学习中文。"
        feedback={{
          pronunciation: 80,
          fluency: 75,
          accuracy: 90,
          complexity: 70,
          communicationEffectiveness: 85,
          notes: "Generated evaluator note",
          recommendedNextStep: "Generated next step",
          mistakes: [],
          toneScore: 82,
        }}
        messages={spanishMessages.speakingLab.feedback}
      />,
    );

    expect(screen.getByText("Lo que escuchamos")).toBeInTheDocument();
    expect(screen.getByText("Coincidencia de tonos: 82%")).toBeInTheDocument();
    expect(screen.getByText("Pronunciación")).toBeInTheDocument();
    expect(screen.getByText("Generated evaluator note")).toBeInTheDocument();
  });
});
