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

const { setDailyUsageCapMock } = vi.hoisted(() => ({
  setDailyUsageCapMock: vi.fn(),
}));
vi.mock("@/lib/admin-ai-usage", () => {
  class InvalidDailyCapError extends Error {}
  return { setDailyUsageCap: setDailyUsageCapMock, InvalidDailyCapError };
});

const { updateDailyUsageCapAction } =
  await import("@/lib/actions/admin-ai-usage");

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

  it("rejects an unknown feature without calling setDailyUsageCap", async () => {
    auth.mockResolvedValueOnce({
      user: { id: "admin-1", role: "ADMINISTRATOR" },
    });
    findUser.mockResolvedValueOnce({
      id: "admin-1",
      email: "arean.mendoza@unmsm.edu.pe",
      name: "Arean",
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
      email: "arean.mendoza@unmsm.edu.pe",
      name: "Arean",
      role: "ADMINISTRATOR",
    });
    setDailyUsageCapMock.mockResolvedValueOnce(undefined);

    const result = await updateDailyUsageCapAction("welcome-audio", 2);

    expect(result).toEqual({ ok: true });
    expect(setDailyUsageCapMock).toHaveBeenCalledWith("welcome-audio", 2);
  });
});
