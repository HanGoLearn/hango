import { afterEach, describe, expect, it, vi } from "vitest";
const read = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));
vi.mock("@/lib/journey-speaking-quality-data", () => ({
  getLocalJourneyQualityReview: read,
}));
vi.mock("@/components/admin/journey-quality-review-screen", () => ({
  JourneyQualityReviewScreen: () => null,
}));
import Page from "../../app/(admin)/admin/speaking-quality/page";
afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetAllMocks();
});
describe("private quality page", () => {
  it("returns not found in production without reading private data", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await expect(Page({ searchParams: Promise.resolve({}) })).rejects.toThrow(
      "NOT_FOUND",
    );
    expect(read).not.toHaveBeenCalled();
  });
  it("uses only the read service in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    read.mockResolvedValue({ state: "EMPTY" });
    await Page({ searchParams: Promise.resolve({ attempt: "own" }) });
    expect(read).toHaveBeenCalledWith("own");
  });
  it("rejects ambiguous query input instead of selecting another attempt", async () => {
    vi.stubEnv("NODE_ENV", "development");
    await expect(
      Page({ searchParams: Promise.resolve({ attempt: ["one", "two"] }) }),
    ).rejects.toThrow("NOT_FOUND");
    expect(read).not.toHaveBeenCalled();
  });
});
