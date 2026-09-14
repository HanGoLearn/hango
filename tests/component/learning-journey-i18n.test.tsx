// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { JourneyChapters } from "@/components/learning-journey/journey-chapters";
import { LessonPath } from "@/components/learning-journey/lesson-path";
import { messages as spanishMessages } from "@/i18n/messages/es";

afterEach(cleanup);

describe("localized Learning Journey chrome", () => {
  it("renders Spanish chapter labels around localized curriculum names", () => {
    render(
      <JourneyChapters
        locale="es"
        messages={spanishMessages.learningJourney}
        scenarios={[
          {
            slug: "getting-started",
            domainSlug: "foundations",
            name: "Primeros pasos",
            domainName: "Fundamentos",
            description: null,
            difficultyLevels: ["BEGINNER"],
            totalLessons: 4,
            completedLessons: 0,
            status: "AVAILABLE",
          },
          {
            slug: "family",
            domainSlug: "foundations",
            name: "Familia",
            domainName: "Fundamentos",
            description: null,
            difficultyLevels: ["BEGINNER"],
            totalLessons: 4,
            completedLessons: 0,
            status: "AVAILABLE",
          },
        ]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Fundamentos" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Nivel principiante · 2 situaciones"),
    ).toBeInTheDocument();
    expect(screen.getByText("Estás aquí")).toBeInTheDocument();
    expect(screen.queryByText("You are here")).not.toBeInTheDocument();
  });

  it("renders Spanish availability and placement labels", () => {
    render(
      <LessonPath
        locale="es"
        messages={spanishMessages.learningJourney.lessonPath}
        lessons={[
          {
            id: "one",
            slug: "one",
            title: "Saludos y presentaciones",
            availability: "AVAILABLE",
            reflectionTotalScore: null,
          },
          {
            id: "two",
            slug: "two",
            title: "Números, hora y fechas",
            availability: "LOCKED",
            reflectionTotalScore: null,
          },
        ]}
      />,
    );

    expect(screen.getByText("Disponible")).toHaveClass("sr-only");
    expect(screen.getByText("Bloqueada")).toHaveClass("sr-only");
    expect(screen.queryByText("Available")).not.toBeInTheDocument();
  });
});
