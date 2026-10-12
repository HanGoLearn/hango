// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/components/ai-teacher/ai-teacher-provider", () => ({
  useAiTeacher: () => ({ voice: "cedar", explanationLanguage: "ES" }),
}));
vi.mock("@/components/ai-teacher/han-voice-conversation", () => ({
  HanVoiceConversation: ({
    mode,
    context,
    onComplete,
  }: {
    mode: string;
    context: object;
    onComplete: () => void;
  }) => (
    <div
      data-testid="live-conversation"
      data-mode={mode}
      data-context={JSON.stringify(context)}
    >
      <button onClick={onComplete}>End scene</button>
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
  },
  {
    id: "NUMBERS_TIME",
    lessonId: "lesson-numbers",
    lessonSlug: "foundations-numbers-time-and-dates",
    lessonTitle: "Números, hora y fechas",
    scenarioTitle: "Primeros pasos",
  },
  {
    id: "PRICES",
    lessonId: "lesson-prices",
    lessonSlug: "basic-shopping-asking-the-price",
    lessonTitle: "Preguntar el precio",
    scenarioTitle: "Compras básicas",
  },
];

afterEach(cleanup);

describe("first closed-beta learning experience", () => {
  it("lets every learner open all three stations without lesson prerequisites", () => {
    render(
      <BetaSpeakingStations
        locale="es"
        stations={stations}
        selectedStation={null}
        selectedConversation={null}
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
      screen
        .getAllByRole("link", { name: "Practicar ahora" })
        .map((link) => link.getAttribute("href")),
    ).toEqual([
      "/es/speaking-lab?station=INTRODUCTIONS",
      "/es/speaking-lab?station=NUMBERS_TIME",
      "/es/speaking-lab?station=PRICES",
    ]);
    expect(
      screen.queryByText("Empieza primero la lección relacionada"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Practicar con Han")).not.toBeInTheDocument();
  });

  it("opens a live character conversation, preserves optional pinyin help and lets the learner retry", () => {
    render(
      <BetaSpeakingStations
        locale="es"
        stations={stations}
        selectedStation={stations[0]!}
        selectedConversation={{
          rolePlay: {
            aiRole: "Un nuevo amigo",
            learnerRole: "Tú",
            scenarioContext: "Encuentra a un nuevo amigo",
            objective: "Intercambia nombres",
            lessonHskLevel: 1,
            correctionMode: "scene",
          },
          helpPhrases: [
            { chinese: "你好！", pinyin: "Nǐ hǎo!", english: "¡Hola!" },
          ],
        }}
        messages={spanishMessages.speakingLab}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Saluda y preséntate" }),
    ).toBeInTheDocument();
    const live = screen.getByTestId("live-conversation");
    expect(live).toHaveAttribute("data-mode", "PRACTICE");
    const context = JSON.parse(live.getAttribute("data-context")!);
    expect(context.rolePlay.objective).toBe("Intercambia nombres");
    expect(context).not.toHaveProperty("lessonTitle");
    expect(screen.queryByText("Nǐ hǎo!")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Necesito ayuda" }));
    expect(screen.getByText("Nǐ hǎo!")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "End scene" }));
    expect(screen.queryByTestId("live-conversation")).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Repetir la conversación" }),
    );
    expect(screen.getByTestId("live-conversation")).toBeInTheDocument();
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
