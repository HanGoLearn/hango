// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import {
  AI_EXPERIENCES,
  AI_EXPERIENCE_IDS,
  experienceLimitKey,
} from "@/lib/ai-experiences";
vi.mock("@/lib/admin-ai-usage", () => ({
  getAiUsageSummary: async () => [
    {
      feature: "han-speech",
      label: "Operación técnica TTS",
      dailyCapUsd: 3,
      todayCostUsd: 0.004,
      monthCostUsd: 0.004,
    },
  ],
  getAiExperienceUsageSummary: async () =>
    AI_EXPERIENCE_IDS.map((experience) => ({
      ...AI_EXPERIENCES[experience],
      experience,
      feature: experienceLimitKey(experience),
      dailyCapUsd: 1,
      todayCostUsd: 0,
      todayCallCount: 0,
      monthCostUsd: 0,
      monthCallCount: 0,
    })),
  getGlobalAiBudgetSummary: async () => ({
    dailyLimitUsd: 5,
    authorizedUsd: 0,
    authorizationCount: 0,
    actualCostUsd: 0.004,
    usagePercent: 0,
    alertLevel: "NORMAL",
    textEnabled: true,
    sttEnabled: true,
    ttsEnabled: true,
    realtimeEnabled: true,
  }),
}));
vi.mock("@/components/admin/ai-usage-cap-input", () => ({
  AiUsageCapInput: ({ feature, label }: { feature: string; label: string }) => (
    <input
      data-testid="budget-input"
      data-budget={feature}
      aria-label={`Límite diario para ${label}`}
    />
  ),
}));
vi.mock("@/components/admin/global-ai-budget-control", () => ({
  GlobalAiBudgetControl: () => <div>Presupuesto global diario</div>,
}));
import AdminLimitsPage from "../../app/(admin)/admin/limits/page";
afterEach(cleanup);
describe("admin budgets by experience", () => {
  it("renders exactly one editable budget per experience and read-only technical details", async () => {
    render(await AdminLimitsPage());
    expect(screen.getAllByTestId("budget-input")).toHaveLength(10);
    expect(
      screen.getByRole("textbox", {
        name: "Límite diario para Han Tutor (burbuja)",
      }),
    ).toHaveAttribute("data-budget", "experience:HAN_TUTOR");
    for (const input of screen.getAllByTestId("budget-input"))
      expect(input.getAttribute("data-budget")).toMatch(/^experience:/);
    expect(
      screen.getByText(/Avanzado: operaciones y políticas anteriores/),
    ).toBeInTheDocument();
    expect(screen.getByText("Operación técnica TTS")).toBeInTheDocument();
    expect(
      screen.getByText(/US\$2 compartidos entre todas sus/),
    ).toBeInTheDocument();
  });
});
