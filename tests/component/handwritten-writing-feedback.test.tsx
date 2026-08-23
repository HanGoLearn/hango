// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { HandwrittenWritingFeedback } from "@/components/writing/handwritten-writing-feedback";

afterEach(cleanup);

describe("HandwrittenWritingFeedback", () => {
  it("shows one 0–100 total and useful feedback without a transcription section", () => {
    render(
      <HandwrittenWritingFeedback
        evaluation={{
          overallScore: 82,
          characterCount: 72,
          targetRange: "About 60–90 Chinese characters",
          dimensions: [
            {
              key: "legibility",
              label: "Legibility and character formation",
              score: 80,
              weight: 25,
            },
            { key: "grammar", label: "Basic grammar", score: 84, weight: 15 },
          ],
          problemCharacters: [
            { character: "家", issue: "The lower component is incomplete." },
          ],
          cohesionNotes: null,
          correctedVersion: "我家有四口人。",
          errors: [
            {
              type: "grammar",
              description: "Add a measure word after the number.",
            },
          ],
          overallNotes: "Your main ideas are clear.",
          strokeOrderDisclaimer:
            "Stroke order cannot be verified from a static photo.",
        }}
      />,
    );

    expect(screen.getByText("82")).toBeInTheDocument();
    expect(screen.getByText("/100")).toBeInTheDocument();
    expect(screen.getByText("Corrected version")).toBeInTheDocument();
    expect(screen.queryByText(/transcription/i)).not.toBeInTheDocument();
  });
});
