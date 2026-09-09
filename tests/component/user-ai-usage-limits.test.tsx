// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/actions/admin-ai-usage", () => ({
  updateUserAiUsageCapAction: vi.fn(),
}));

import { UserAiUsageLimits } from "@/components/admin/user-ai-usage-limits";

afterEach(cleanup);

describe("UserAiUsageLimits", () => {
  it("explains that limits affect only the selected user", () => {
    render(
      <UserAiUsageLimits
        userId="learner-1"
        rows={[
          {
            feature: "han-speech",
            label: "Voz generada de Han",
            mode: "BLOCKED",
            generalLimitUsd: 1,
            customLimitUsd: 0,
            effectiveLimitUsd: 0,
            todayCostUsd: 0.02,
            todayCallCount: 2,
          },
        ]}
      />,
    );

    expect(
      screen.getByText("Límites personalizados de IA"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/afecta únicamente a este usuario/i),
    ).toBeInTheDocument();
    expect(screen.getByText("1 excepción")).toBeInTheDocument();
    expect(screen.getByText("Voz generada de Han")).toBeInTheDocument();
  });
});
