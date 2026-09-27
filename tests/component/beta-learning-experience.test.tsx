// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/components/speaking/conversation-shadowing", () => ({
  ConversationShadowing: ({
    lines,
  }: {
    lines: { chineseText: string; pinyin: string }[];
  }) => (
    <div data-testid="conversation-shadowing">
      {lines[0]?.chineseText} · {lines[0]?.pinyin}
    </div>
  ),
}));

import { BetaSpeakingStations } from "@/components/speaking/beta-speaking-stations";
import { JourneyHub } from "@/components/learning-journey/journey-hub";
import { messages as spanishMessages } from "@/i18n/messages/es";
import type { BetaSpeakingStationData } from "@/lib/beta-speaking-stations";

const stations: BetaSpeakingStationData[] = [
  {
    id: "INTRODUCTIONS",
    lessonId: "lesson-intro",
    lessonSlug: "foundations-greetings-and-introductions",
    lessonTitle: "Saludos y presentaciones",
    scenarioTitle: "Primeros pasos",
    unlocked: true,
  },
  {
    id: "NUMBERS_TIME",
    lessonId: "lesson-numbers",
    lessonSlug: "foundations-numbers-time-and-dates",
    lessonTitle: "Números, hora y fechas",
    scenarioTitle: "Primeros pasos",
    unlocked: false,
  },
  {
    id: "PRICES",
    lessonId: "lesson-prices",
    lessonSlug: "basic-shopping-asking-the-price",
    lessonTitle: "Preguntar el precio",
    scenarioTitle: "Compras básicas",
    unlocked: false,
  },
];

afterEach(cleanup);

describe("first closed-beta learning experience", () => {
  it("shows exactly three guided stations and explains how locked ones open", () => {
    render(
      <BetaSpeakingStations
        locale="es"
        stations={stations}
        selectedStation={null}
        selectedPrompt={null}
        messages={spanishMessages.speakingLab}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Practica una situación real a la vez",
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(
      screen.getByRole("link", { name: "Practicar ahora" }),
    ).toHaveAttribute("href", "/es/speaking-lab?station=INTRODUCTIONS");
    expect(
      screen.getAllByText("Empieza primero la lección relacionada"),
    ).toHaveLength(2);
    expect(screen.queryByText("Practicar con Han")).not.toBeInTheDocument();
  });

  it("opens a selected station with pinyin-backed conversation shadowing", () => {
    render(
      <BetaSpeakingStations
        locale="es"
        stations={stations}
        selectedStation={stations[0]!}
        selectedPrompt={{
          prompt: "你好！",
          lessonId: "lesson-intro",
          dialogueId: "dialogue-intro",
          pinyin: "Nǐ hǎo!",
          lines: [
            {
              id: "line-1",
              chineseText: "你好！",
              pinyin: "Nǐ hǎo!",
              speakerName: "小李",
              speakerOrder: 0,
            },
          ],
        }}
        messages={spanishMessages.speakingLab}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Saluda y preséntate" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("conversation-shadowing")).toHaveTextContent(
      "你好！ · Nǐ hǎo!",
    );
  });

  it("keeps later Journey chapters visible as honest previews", () => {
    render(
      <JourneyHub
        chapters={[
          {
            chapter: "BEGINNER",
            totalScenarios: 6,
            completedScenarios: 0,
            isCurrent: true,
            isAccessible: true,
          },
          {
            chapter: "INTERMEDIATE",
            totalScenarios: 25,
            completedScenarios: 0,
            isCurrent: false,
            isAccessible: false,
          },
          {
            chapter: "ADVANCED",
            totalScenarios: 10,
            completedScenarios: 0,
            isCurrent: false,
            isAccessible: false,
          },
        ]}
        continueTarget={null}
        avatar={{ animal: null, equipped: {} as never }}
        locale="es"
        messages={spanishMessages.learningJourney}
      />,
    );

    expect(screen.getAllByText("Próxima fase de la beta")).toHaveLength(2);
    expect(screen.getAllByText("Ver lo que aprenderás")).toHaveLength(2);
    expect(
      screen.getByRole("link", { name: /Vida cotidiana/ }),
    ).toHaveAttribute("href", "/es/learning-journey/chapter/INTERMEDIATE");
  });
});
