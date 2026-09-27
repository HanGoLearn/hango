// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { LessonMessagesProvider } from "@/components/lesson/lesson-messages";
import { StepNavigation } from "@/components/lesson/step-navigation";
import { ExerciseItem } from "@/components/exercise/exercise-item";
import { messages as spanishMessages } from "@/i18n/messages/es";

afterEach(cleanup);

describe("lesson interface translations", () => {
  it("renders Spanish navigation and exercise controls from one message source", () => {
    render(
      <LessonMessagesProvider messages={spanishMessages.lesson}>
        <StepNavigation
          steps={[
            { id: "situation", type: "SITUATION", order: 0 },
            { id: "grammar", type: "GRAMMAR", order: 1 },
          ]}
          statuses={
            new Map([
              ["situation", "AVAILABLE"],
              ["grammar", "LOCKED"],
            ])
          }
          currentStepId="situation"
          onSelect={vi.fn()}
        />
        <ExerciseItem
          item={{
            id: "exercise",
            type: "FILL_IN_BLANK",
            prompt: "Complete 你好.",
            options: [],
            tokens: [],
            leftTerms: [],
            rightTerms: [],
            hints: [],
          }}
          onSubmit={vi.fn()}
          onNext={vi.fn()}
        />
      </LessonMessagesProvider>,
    );

    expect(
      screen.getByRole("navigation", { name: "Pasos de la lección" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Situación — disponible" }),
    ).toBeInTheDocument();
    // The nodes carry no visible labels since the 2026-09-23 redesign - the
    // step's name lives in its accessible name (and LessonHeader names the
    // current one), so that is what this asserts is still translated.
    expect(
      screen.getByRole("button", { name: "Gramática — bloqueado" }),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Escribe tu respuesta"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enviar" })).toBeDisabled();
    expect(screen.getByText("Complete 你好.")).toBeInTheDocument();
  });
});
