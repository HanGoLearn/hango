import { describe, expect, it, vi, beforeEach } from "vitest";
import { createElement } from "react";
import { Prisma } from "@/generated/prisma/client";

const { auth, redirect, getOrCreateLearnerProfile } = vi.hoisted(() => ({
  auth: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
  getOrCreateLearnerProfile: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ auth }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/lib/learner-profile", () => ({ getOrCreateLearnerProfile }));
vi.mock("@/components/shell/app-shell", () => ({
  AppShell: ({ children }: { children: unknown }) =>
    createElement("div", null, children as never),
}));

// app/ is at the project root, not under src/, so the "@/*" alias (which
// points at ./src/*) doesn't reach it — a relative import is required here.
import AppGroupLayout from "../../app/(app)/layout";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AppGroupLayout (backend authorization, independent of proxy.ts)", () => {
  it("redirects to /login when there is no session, even if proxy.ts didn't run", async () => {
    auth.mockResolvedValueOnce(null);

    await expect(
      AppGroupLayout({ children: createElement("p", null, "content") }),
    ).rejects.toThrow("REDIRECT:/login");
    expect(getOrCreateLearnerProfile).not.toHaveBeenCalled();
  });

  it("redirects to /onboarding when onboarding isn't complete yet", async () => {
    auth.mockResolvedValueOnce({ user: { id: "1", role: "LEARNER" } });
    getOrCreateLearnerProfile.mockResolvedValueOnce({
      onboardingCompletedAt: null,
    });

    await expect(
      AppGroupLayout({ children: createElement("p", null, "content") }),
    ).rejects.toThrow("REDIRECT:/onboarding");
  });

  it("renders the shell when a session exists and onboarding is complete", async () => {
    auth.mockResolvedValueOnce({ user: { id: "1", role: "LEARNER" } });
    getOrCreateLearnerProfile.mockResolvedValueOnce({
      onboardingCompletedAt: new Date(),
    });

    const result = await AppGroupLayout({
      children: createElement("p", null, "content"),
    });

    expect(result).toBeTruthy();
  });

  it("redirects to the invalid-session route when the session's user no longer exists (2026-09-05 fix - a JWT session can outlive its deleted user)", async () => {
    auth.mockResolvedValueOnce({ user: { id: "stale-id", role: "LEARNER" } });
    getOrCreateLearnerProfile.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError(
        "Foreign key constraint violated on the constraint: `LearnerProfile_userId_fkey`",
        { code: "P2003", clientVersion: "test" },
      ),
    );

    // Can't call signOut() from this Server Component (corrected same day -
    // it mutates cookies, only allowed in a Server Action/Route Handler),
    // so this redirects to a route handler that does instead - see
    // app/api/auth/invalid-session/route.ts.
    await expect(
      AppGroupLayout({ children: createElement("p", null, "content") }),
    ).rejects.toThrow("REDIRECT:/api/auth/invalid-session");
  });

  it("re-throws any other unexpected error instead of treating it as an invalid session", async () => {
    auth.mockResolvedValueOnce({ user: { id: "1", role: "LEARNER" } });
    getOrCreateLearnerProfile.mockRejectedValueOnce(
      new Error("some unrelated database failure"),
    );

    await expect(
      AppGroupLayout({ children: createElement("p", null, "content") }),
    ).rejects.toThrow("some unrelated database failure");
  });
});
