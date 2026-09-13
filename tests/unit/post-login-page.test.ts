import { beforeEach, describe, expect, it, vi } from "vitest";

const { auth, redirect, notFound, getOrCreateLearnerProfile } = vi.hoisted(
  () => ({
    auth: vi.fn(),
    redirect: vi.fn((path: string) => {
      throw new Error(`REDIRECT:${path}`);
    }),
    notFound: vi.fn(() => {
      throw new Error("NOT_FOUND");
    }),
    getOrCreateLearnerProfile: vi.fn(),
  }),
);

vi.mock("@/lib/auth", () => ({ auth }));
vi.mock("next/navigation", () => ({ redirect, notFound }));
vi.mock("@/lib/learner-profile", () => ({ getOrCreateLearnerProfile }));

import PostLoginPage from "../../app/[locale]/(auth)/post-login/page";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("PostLoginPage", () => {
  it("uses the saved profile language on a new device", async () => {
    auth.mockResolvedValueOnce({ user: { id: "learner-1" } });
    getOrCreateLearnerProfile.mockResolvedValueOnce({
      interfaceLanguage: "ES",
    });

    await expect(
      PostLoginPage({
        params: Promise.resolve({ locale: "en" }),
        searchParams: Promise.resolve({
          callbackUrl: "/en/settings?tab=profile",
        }),
      }),
    ).rejects.toThrow("REDIRECT:/es/settings?tab=profile");
  });

  it("keeps the administrator back-office unprefixed", async () => {
    auth.mockResolvedValueOnce({ user: { id: "admin-1" } });
    getOrCreateLearnerProfile.mockResolvedValueOnce({
      interfaceLanguage: "EN",
    });

    await expect(
      PostLoginPage({
        params: Promise.resolve({ locale: "es" }),
        searchParams: Promise.resolve({ callbackUrl: "/admin" }),
      }),
    ).rejects.toThrow("REDIRECT:/admin");
  });

  it("returns unauthenticated visitors to the localized login", async () => {
    auth.mockResolvedValueOnce(null);

    await expect(
      PostLoginPage({
        params: Promise.resolve({ locale: "es" }),
        searchParams: Promise.resolve({ callbackUrl: "/es/dashboard" }),
      }),
    ).rejects.toThrow("REDIRECT:/es/login?callbackUrl=%2Fes%2Fdashboard");
  });
});
