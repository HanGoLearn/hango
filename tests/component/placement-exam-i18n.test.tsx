// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("@/lib/actions/placement-exam", () => ({
  applyPlacementCreditAction: vi.fn(),
  getPlacementListeningAudioAction: vi.fn(),
  recordPlacementTimeoutAction: vi.fn(),
  submitPlacementAnswerAction: vi.fn(),
  submitPlacementQuestionBlockAction: vi.fn(),
}));

vi.mock("@/components/placement/placement-speaking-exam", () => ({
  PlacementSpeakingExam: () => null,
}));

import { PlacementExamHome } from "@/components/placement/placement-exam-home";
import { messages as spanishMessages } from "@/i18n/messages/es";
import type { PlacementQuestionView } from "@/lib/placement-exam-data";

afterEach(cleanup);

describe("PlacementExamHome i18n", () => {
  it("shows the empty placement state in Spanish", () => {
    render(
      <PlacementExamHome
        locale="es"
        messages={spanishMessages.onboarding.placementExam}
        sessionId="session-1"
        initialQuestion={null}
      />,
    );

    expect(screen.getByText("Prueba de nivel")).toBeInTheDocument();
    expect(
      screen.getByText("No hay preguntas disponibles en este momento."),
    ).toBeInTheDocument();
  });

  it("localizes the exam controls without changing the authored question", () => {
    const question = {
      id: "question-1",
      type: "MULTIPLE_CHOICE",
      hskLevel: 1,
      prompt: "请选择正确的答案。",
      options: [
        { id: "a", content: "你好" },
        { id: "b", content: "再见" },
      ],
      tokens: [],
      passage: null,
      listening: null,
      questionGroup: null,
    } as unknown as PlacementQuestionView;

    render(
      <PlacementExamHome
        locale="es"
        messages={spanishMessages.onboarding.placementExam}
        sessionId="session-1"
        initialQuestion={question}
      />,
    );

    expect(screen.getByText("Prueba de nivel")).toBeInTheDocument();
    expect(screen.getByText("请选择正确的答案。")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeDisabled();
  });
});
