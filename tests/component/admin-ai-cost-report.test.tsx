// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AiCostReport } from "@/components/admin/ai-cost-report";
import {
  buildAdminAiCostReport,
  type AdminAiCostRow,
} from "@/lib/admin-ai-cost-report";
import {
  AI_FEATURE_CATALOG,
  AI_USAGE_FEATURES,
  AI_USAGE_LIMIT_FEATURES,
  FEATURE_LABELS,
  AI_PRODUCT_FEATURES,
} from "@/lib/ai-feature-catalog";
import { AI_FEATURE_FAMILY } from "@/lib/ai-usage";
afterEach(cleanup);
function row(feature: string, costUsd: number, calls = 1): AdminAiCostRow {
  return {
    feature,
    costUsd,
    calls,
    provider: "openai",
    model: "test-model",
    calculationMethod: "LEGACY_ESTIMATE",
    durationSeconds: 0,
    inputRateUsdPerMillionTokens: null,
    outputRateUsdPerMillionTokens: null,
    audioRateUsdPerMinute: null,
  };
}
describe("complete admin AI accounting catalogue", () => {
  it("classifies every feature once and shares labels/families with the limit editors", () => {
    const input = AI_USAGE_FEATURES.map((feature) => row(feature, 0.001));
    const report = buildAdminAiCostReport(input);
    const groups = [...report.interactive, ...report.shared, ...report.history];
    expect(groups.flatMap((group) => group.rows)).toHaveLength(
      AI_USAGE_FEATURES.length,
    );
    expect(report.totalCostUsd).toBeCloseTo(AI_USAGE_FEATURES.length * 0.001);
    expect(report.totalCalls).toBe(AI_USAGE_FEATURES.length);
    const productKeys = Object.values(AI_PRODUCT_FEATURES).flat();
    expect(new Set(productKeys).size).toBe(productKeys.length);
    expect(AI_PRODUCT_FEATURES.COMPANION).not.toContain(
      "han-realtime-assessment",
    );
    for (const feature of AI_USAGE_FEATURES) {
      expect(FEATURE_LABELS[feature]).toBe(AI_FEATURE_CATALOG[feature].label);
      expect(AI_FEATURE_FAMILY[feature]).toBe(
        AI_FEATURE_CATALOG[feature].family,
      );
      expect(AI_USAGE_LIMIT_FEATURES.includes(feature)).toBe(
        AI_FEATURE_CATALOG[feature].section !== "HISTORY",
      );
    }
  });
  it("shows Tutor once with its text breakdown, and Companion reads only Companion costs", () => {
    const report = buildAdminAiCostReport([
      row("han-tutor-realtime-session", 0.05),
      row("han-tutor-chat", 0.001),
      row("han-companion-chat", 0.002),
      row("ai-teacher-chat", 0.3),
    ]);
    expect(
      report.interactive.find((group) => group.id === "HAN_TUTOR"),
    ).toMatchObject({ calls: 2 });
    expect(
      report.interactive.find((group) => group.id === "HAN_TUTOR")?.costUsd,
    ).toBeCloseTo(0.051);
    expect(
      report.interactive.find((group) => group.id === "HAN_COMPANION"),
    ).toMatchObject({ costUsd: 0.002, calls: 1 });
    expect(report.historyCostUsd).toBe(0.3);
  });
  it("keeps shared-generation cost in the total without treating plays as AI calls", () => {
    const report = buildAdminAiCostReport([
      row("vocabulary-audio", 0.002),
      row("han-speech", 0.004),
      row("han-tutor-realtime-session", 0.05),
    ]);
    expect(report.sharedCostUsd).toBe(0.002);
    expect(
      report.interactive.some((group) => group.id === "vocabulary-audio"),
    ).toBe(false);
    expect(report.totalCostUsd).toBeCloseTo(0.056);
    expect(report.totalCalls).toBe(3);
  });
  it("retains every model and unknown feature instead of silently truncating financial totals", () => {
    const input = Array.from({ length: 24 }, (_, i) => ({
      ...row("lesson-reflection", 0.001),
      model: `model-${i}`,
    }));
    input.push(row("future-feature", 0.002));
    const report = buildAdminAiCostReport(input);
    expect(report.totalCostUsd).toBeCloseTo(0.026);
    expect(report.totalCalls).toBe(25);
    expect(
      report.interactive.find((group) => group.id === "LESSON_REFLECTION")
        ?.rows,
    ).toHaveLength(24);
  });
  it("renders the requested categories, honest TTS/cache explanations and direct limit links", () => {
    render(
      <AiCostReport
        rows={[
          row("han-tutor-chat", 0.001),
          row("han-companion-chat", 0.002),
          row("vocabulary-audio", 0.003),
        ]}
      />,
    );
    expect(
      screen.getAllByText("Conversación de voz en vivo con Han")[0],
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Chat de Han Tutor y Companion"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Generación de contenido compartido (caché)",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText("Lectura de respuestas en voz (TTS, no Realtime)")[0],
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", {
        name: "Administrar presupuesto de Han Companion",
      })[0],
    ).toHaveAttribute(
      "href",
      "/admin/limits#ai-limit-experience:HAN_COMPANION",
    );
    expect(screen.getByText(/Total reconciliado:/)).toHaveTextContent(
      "US$0.006",
    );
  });
  it("removes the historical section and its rows without changing the recorded total", () => {
    const input = [
      row("han-tutor-realtime-session", 0.05),
      { ...row("han-realtime-session", 0.25), model: "old-voice-model" },
      { ...row("ai-teacher-chat", 0.003), model: "old-chat-model" },
      { ...row("han-speech", 0.002), model: "unattributed-speech-model" },
      { ...row("future-feature", 0.001), model: "unknown-model" },
      row("vocabulary-audio", 0.004),
    ];
    render(<AiCostReport rows={input} />);
    expect(
      screen.queryByRole("heading", {
        name: "Histórico anterior sin separar",
      }),
    ).not.toBeInTheDocument();
    for (const feature of ["han-realtime-session", "ai-teacher-chat"] as const) {
      expect(
        screen.queryByText(FEATURE_LABELS[feature]),
      ).not.toBeInTheDocument();
    }
    expect(
      screen.queryByText(
        /old-voice-model|old-chat-model|unattributed-speech-model|unknown-model/,
      ),
    ).not.toBeInTheDocument();
    const total = screen.getByText(/Total reconciliado:/);
    expect(total).toHaveTextContent("US$0.31");
    expect(total).toHaveTextContent(
      "Incluye consumo anterior no desglosado en esta vista.",
    );
    expect(buildAdminAiCostReport(input).totalCalls).toBe(6);
  });
  it("does not mention hidden prior consumption when all rows have a known origin", () => {
    render(<AiCostReport rows={[row("han-tutor-chat", 0.001)]} />);
    expect(screen.getByText(/Total reconciliado:/)).toHaveTextContent(
      "US$0.001",
    );
    expect(
      screen.queryByText(/Incluye consumo anterior/),
    ).not.toBeInTheDocument();
  });
});
