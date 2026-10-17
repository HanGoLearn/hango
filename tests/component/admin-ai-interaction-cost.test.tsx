// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AiInteractionCost } from "@/components/admin/ai-interaction-cost";
import { getAiInteractionCost } from "@/lib/admin-ai-interaction-cost";

afterEach(cleanup);

describe("Admin per-interaction cost references", () => {
  it("shows the approved HanVocabulary reference without changing actual totals", () => {
    const row = {
      feature: "vocabulary-lookup",
      provider: "openai",
      calls: 5,
      costUsd: 0.003647,
    };
    render(<AiInteractionCost row={row} />);
    expect(screen.getByText("US$0.0007")).toBeInTheDocument();
    expect(
      screen.getByText("Referencia por búsqueda nueva"),
    ).toBeInTheDocument();
    expect(row.costUsd).toBe(0.003647);
  });

  it("shows US$0.05 for new Tutor sessions without changing totals", () => {
    const row = {
      feature: "han-tutor-realtime-session",
      provider: "openai",
      calls: 8,
      costUsd: 2,
    };
    render(<AiInteractionCost row={row} />);
    expect(screen.getByText("US$0.05")).toBeInTheDocument();
    expect(
      screen.getByText(/Estimación por sesión; no costo medido/),
    ).toBeInTheDocument();
    expect(row.costUsd).toBe(2);
  });

  it("preserves the old shared average instead of relabeling historical costs", () => {
    expect(
      getAiInteractionCost({
        feature: "han-realtime-session",
        provider: "openai",
        calls: 4,
        costUsd: 1,
      }).amountUsd,
    ).toBe(0.25);
  });

  it.each([
    "han-companion-realtime-session",
    "journey-speaking-realtime-session",
    "speaking-lab-realtime-session",
    "placement-realtime-session",
  ])("shows the same new estimate for %s", (feature) => {
    expect(
      getAiInteractionCost({
        feature,
        provider: "openai",
        calls: 1,
        costUsd: 0.05,
      }).amountUsd,
    ).toBe(0.05);
  });

  it("uses the recorded average for other features, preserving small prices", () => {
    render(
      <AiInteractionCost
        row={{
          feature: "speaking-feedback",
          provider: "openai",
          calls: 4,
          costUsd: 0.0028,
        }}
      />,
    );
    expect(screen.getByText("US$0.0007")).toBeInTheDocument();
    expect(
      screen.getByText("Promedio registrado del período"),
    ).toBeInTheDocument();
  });

  it("does not assign paid OpenAI references to mock operations", () => {
    for (const feature of ["vocabulary-lookup", "han-realtime-session"]) {
      expect(
        getAiInteractionCost({
          feature,
          provider: "mock",
          calls: 3,
          costUsd: 0,
        }),
      ).toMatchObject({
        amountUsd: 0,
        description: "Promedio registrado del período",
      });
    }
  });

  it("does not divide by zero when no calls are recorded", () => {
    render(
      <AiInteractionCost
        row={{
          feature: "speaking-feedback",
          provider: "openai",
          calls: 0,
          costUsd: 0,
        }}
      />,
    );
    expect(screen.getByText("Sin datos")).toBeInTheDocument();
  });

  it("rejects invalid aggregates instead of rendering a misleading amount", () => {
    expect(
      getAiInteractionCost({
        feature: "speaking-feedback",
        provider: "openai",
        calls: 2,
        costUsd: Number.NaN,
      }).amountUsd,
    ).toBeNull();
    expect(
      getAiInteractionCost({
        feature: "speaking-feedback",
        provider: "openai",
        calls: -1,
        costUsd: 1,
      }).amountUsd,
    ).toBeNull();
  });
});
