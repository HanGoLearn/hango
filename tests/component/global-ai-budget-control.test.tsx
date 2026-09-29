// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const { updateGlobalAiBudgetPolicyAction } = vi.hoisted(() => ({
  updateGlobalAiBudgetPolicyAction: vi.fn(),
}));
vi.mock("@/lib/actions/admin-ai-usage", () => ({
  updateGlobalAiBudgetPolicyAction,
}));

import { GlobalAiBudgetControl } from "@/components/admin/global-ai-budget-control";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("GlobalAiBudgetControl", () => {
  it("updates the daily budget and can pause one family independently", async () => {
    const user = userEvent.setup();
    updateGlobalAiBudgetPolicyAction.mockResolvedValueOnce({ ok: true });
    render(
      <GlobalAiBudgetControl
        dailyLimitUsd={5}
        textEnabled
        sttEnabled
        ttsEnabled
        realtimeEnabled
      />,
    );

    await user.clear(screen.getByLabelText("Presupuesto global diario"));
    await user.type(screen.getByLabelText("Presupuesto global diario"), "3");
    await user.click(screen.getByLabelText("Voces y audios (TTS)"));
    await user.click(
      screen.getByRole("button", { name: "Guardar protección global" }),
    );

    expect(updateGlobalAiBudgetPolicyAction).toHaveBeenCalledWith({
      dailyLimitUsd: 3,
      textEnabled: true,
      sttEnabled: true,
      ttsEnabled: false,
      realtimeEnabled: true,
    });
    expect(
      await screen.findByText("Configuración guardada."),
    ).toBeInTheDocument();
  });
});
