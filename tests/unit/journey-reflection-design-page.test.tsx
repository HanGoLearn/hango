import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));
vi.mock("@/components/lesson/journey-reflection-design-preview", () => ({
  JourneyReflectionDesignPreview: () => null,
}));
import ReflectionDesignPage from "../../app/[locale]/reflection-design/page";
afterEach(() => vi.unstubAllEnvs());

describe("development-only reflection design route", () => {
  it("is not available in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await expect(
      ReflectionDesignPage({ params: Promise.resolve({ locale: "es" }) }),
    ).rejects.toThrow("NOT_FOUND");
  });
  it("rejects unsupported locales", async () => {
    vi.stubEnv("NODE_ENV", "development");
    await expect(
      ReflectionDesignPage({ params: Promise.resolve({ locale: "fr" }) }),
    ).rejects.toThrow("NOT_FOUND");
  });
  it("renders the localized proposal only in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const page = await ReflectionDesignPage({
      params: Promise.resolve({ locale: "en" }),
    });
    expect(page.props.locale).toBe("en");
  });
  it("passes a scoped light palette without changing stored preferences", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const page = await ReflectionDesignPage({
      params: Promise.resolve({ locale: "es" }),
      searchParams: Promise.resolve({ palette: "light" }),
    });
    expect(page.props.palette).toBe("light");
  });
});
