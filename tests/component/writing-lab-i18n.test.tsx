// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { WritingFeedbackDisplay } from "@/components/writing/writing-feedback-display";
import { messages as spanishMessages } from "@/i18n/messages/es";

afterEach(cleanup);

describe("Writing Lab localization", () => {
  it("localizes evaluator chrome while preserving generated feedback verbatim", () => {
    render(
      <WritingFeedbackDisplay
        original="我喜欢学习中文。"
        feedback={{
          grammar: 90,
          vocabulary: 80,
          naturalness: 85,
          communicationClarity: 92,
          correctedVersion: "我喜欢学中文。",
          importantChanges: ["学习 → 学 — sounds more natural here"],
          overallNotes: "Your meaning is clear.",
        }}
        messages={spanishMessages.writingLab.feedback}
      />,
    );

    expect(screen.getByText("Tu respuesta")).toBeInTheDocument();
    expect(screen.getByText("Versión corregida")).toBeInTheDocument();
    expect(screen.getByText("Claridad comunicativa")).toBeInTheDocument();
    expect(screen.getByText("Cambios importantes")).toBeInTheDocument();
    expect(screen.getByText("Your meaning is clear.")).toBeInTheDocument();
    expect(
      screen.getByText("学习 → 学 — sounds more natural here"),
    ).toBeInTheDocument();
  });
});
