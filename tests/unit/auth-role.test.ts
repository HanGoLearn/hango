import { describe, expect, it, vi, beforeEach } from "vitest";

const { auth, redirect } = vi.hoisted(() => ({
  auth: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));
vi.mock("@/lib/auth", () => ({ auth }));
vi.mock("next/navigation", () => ({ redirect }));

import { requireRole } from "@/lib/auth-role";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("requireRole", () => {
  it("redirects to /login when there is no session", async () => {
    auth.mockResolvedValueOnce(null);

    await expect(requireRole(["ADMINISTRATOR"])).rejects.toThrow(
      "REDIRECT:/login",
    );
  });

  it("redirects to /dashboard when the role isn't allowed", async () => {
    auth.mockResolvedValueOnce({ user: { role: "LEARNER" } });

    await expect(requireRole(["ADMINISTRATOR"])).rejects.toThrow(
      "REDIRECT:/dashboard",
    );
  });

  it("returns the session when the role is allowed", async () => {
    const session = { user: { role: "ADMINISTRATOR" } };
    auth.mockResolvedValueOnce(session);

    const result = await requireRole(["ADMINISTRATOR", "PREMIUM_LEARNER"]);
    expect(result).toBe(session);
  });
});
