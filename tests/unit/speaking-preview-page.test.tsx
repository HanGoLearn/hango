import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));
vi.mock("@/components/lesson/journey-speaking-preview", () => ({
  JourneySpeakingPreview: "preview",
}));
import Page from "../../app/[locale]/speaking-preview/page";
afterEach(() => vi.unstubAllEnvs());
describe("local preview route", () => {
  it.each(["production", "test"] as const)(
    "is unavailable in %s",
    async (environment) => {
      vi.stubEnv("NODE_ENV", environment);
      await expect(
        Page({ params: Promise.resolve({ locale: "es" }) }),
      ).rejects.toThrow("NOT_FOUND");
    },
  );
  it("needs no accounts or migrations in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(
      (await Page({ params: Promise.resolve({ locale: "es" }) })).props,
    ).toMatchObject({ locale: "es" });
  });
});
