import { describe, expect, it, vi, beforeEach } from "vitest";

const { auth, redirect, findUser } = vi.hoisted(() => ({
  auth: vi.fn(),
  findUser: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));
vi.mock("@/lib/auth", () => ({ auth }));
vi.mock("@/lib/db", () => ({ db: { user: { findUnique: findUser } } }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const {
  setDailyUsageCapMock,
  setGlobalAiBudgetPolicyMock,
  setUserAiUsageCapMock,
} = vi.hoisted(() => ({
  setDailyUsageCapMock: vi.fn(),
  setGlobalAiBudgetPolicyMock: vi.fn(),
  setUserAiUsageCapMock: vi.fn(),
}));
vi.mock("@/lib/admin-ai-usage", () => {
  class InvalidDailyCapError extends Error {}
  class InvalidGlobalAiBudgetPolicyError extends Error {}
  class InvalidUserAiUsageCapError extends Error {}
  return {
    setDailyUsageCap: setDailyUsageCapMock,
    setGlobalAiBudgetPolicy: setGlobalAiBudgetPolicyMock,
    setUserAiUsageCap: setUserAiUsageCapMock,
    InvalidDailyCapError,
    InvalidGlobalAiBudgetPolicyError,
    InvalidUserAiUsageCapError,
  };
});

const {
  updateDailyUsageCapAction,
  updateGlobalAiBudgetPolicyAction,
  updateUserAiUsageCapAction,
} = await import("@/lib/actions/admin-ai-usage");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("updateDailyUsageCapAction (2026-09-05, admin-only)", () => {
  it("redirects a signed-out visitor to /login", async () => {
    auth.mockResolvedValueOnce(null);

    await expect(updateDailyUsageCapAction("welcome-audio", 1)).rejects.toThrow(
      "REDIRECT:/login",
    );
    expect(setDailyUsageCapMock).not.toHaveBeenCalled();
  });

  it("redirects a non-administrator to /dashboard", async () => {
    auth.mockResolvedValueOnce({ user: { id: "learner-1", role: "LEARNER" } });
    findUser.mockResolvedValueOnce({
      id: "learner-1",
      email: "learner@example.com",
      name: "Learner",
      role: "LEARNER",
    });

    await expect(updateDailyUsageCapAction("welcome-audio", 1)).rejects.toThrow(
      "REDIRECT:/dashboard",
    );
    expect(setDailyUsageCapMock).not.toHaveBeenCalled();
  });

  it("rejects the previous administrator email even if its role is stale", async () => {
    auth.mockResolvedValueOnce({
      user: { id: "old-admin", role: "ADMINISTRATOR" },
    });
    findUser.mockResolvedValueOnce({
      id: "old-admin",
      email: "arean.mendoza@unmsm.edu.pe",
      name: "Previous administrator",
      role: "ADMINISTRATOR",
    });

    await expect(updateDailyUsageCapAction("welcome-audio", 1)).rejects.toThrow(
      "REDIRECT:/dashboard",
    );
    expect(setDailyUsageCapMock).not.toHaveBeenCalled();
  });

  it("rejects an unknown feature without calling setDailyUsageCap", async () => {
    auth.mockResolvedValueOnce({
      user: { id: "admin-1", role: "ADMINISTRATOR" },
    });
    findUser.mockResolvedValueOnce({
      id: "admin-1",
      email: "hango.learn@gmail.com",
      name: "HanGo Learn",
      role: "ADMINISTRATOR",
    });

    const result = await updateDailyUsageCapAction("not-a-real-feature", 1);

    expect(result).toEqual({ ok: false, error: "Función desconocida." });
    expect(setDailyUsageCapMock).not.toHaveBeenCalled();
  });

  it("updates the cap for an administrator", async () => {
    auth.mockResolvedValueOnce({
      user: { id: "admin-1", role: "ADMINISTRATOR" },
    });
    findUser.mockResolvedValueOnce({
      id: "admin-1",
      email: "hango.learn@gmail.com",
      name: "HanGo Learn",
      role: "ADMINISTRATOR",
    });
    setDailyUsageCapMock.mockResolvedValueOnce(undefined);

    const result = await updateDailyUsageCapAction("welcome-audio", 2);

    expect(result).toEqual({ ok: true });
    expect(setDailyUsageCapMock).toHaveBeenCalledWith("welcome-audio", 2);
  });

  it("sets a custom limit for only the selected learner", async () => {
    auth.mockResolvedValueOnce({
      user: { id: "admin-1", role: "ADMINISTRATOR" },
    });
    findUser.mockResolvedValueOnce({
      id: "admin-1",
      email: "hango.learn@gmail.com",
      name: "HanGo Learn",
      role: "ADMINISTRATOR",
    });
    setUserAiUsageCapMock.mockResolvedValueOnce(undefined);

    const result = await updateUserAiUsageCapAction(
      "learner-1",
      "han-speech",
      "CUSTOM",
      0.25,
    );

    expect(result).toEqual({ ok: true });
    expect(setUserAiUsageCapMock).toHaveBeenCalledWith({
      userId: "learner-1",
      feature: "han-speech",
      mode: "CUSTOM",
      dailyLimitUsd: 0.25,
    });
  });

  it("updates the global budget and family switches for an administrator", async () => {
    auth.mockResolvedValueOnce({
      user: { id: "admin-1", role: "ADMINISTRATOR" },
    });
    findUser.mockResolvedValueOnce({
      id: "admin-1",
      email: "hango.learn@gmail.com",
      name: "HanGo Learn",
      role: "ADMINISTRATOR",
    });
    setGlobalAiBudgetPolicyMock.mockResolvedValueOnce(undefined);
    const input = {
      dailyLimitUsd: 5,
      textEnabled: true,
      sttEnabled: true,
      ttsEnabled: false,
      realtimeEnabled: true,
    };

    const result = await updateGlobalAiBudgetPolicyAction(input);

    expect(result).toEqual({ ok: true });
    expect(setGlobalAiBudgetPolicyMock).toHaveBeenCalledWith(input);
  });

  it("rejects an unknown per-user limit mode", async () => {
    auth.mockResolvedValueOnce({
      user: { id: "admin-1", role: "ADMINISTRATOR" },
    });
    findUser.mockResolvedValueOnce({
      id: "admin-1",
      email: "hango.learn@gmail.com",
      name: "HanGo Learn",
      role: "ADMINISTRATOR",
    });

    const result = await updateUserAiUsageCapAction(
      "learner-1",
      "han-speech",
      "EVERYONE",
      0.25,
    );

    expect(result).toEqual({
      ok: false,
      error: "Tipo de límite desconocido.",
    });
    expect(setUserAiUsageCapMock).not.toHaveBeenCalled();
  });
});
