import { describe, expect, it } from "vitest";
import { resolveCurrentPageName } from "@/lib/navigation";

describe("resolveCurrentPageName", () => {
  it("matches an exact top-level route", () => {
    expect(resolveCurrentPageName("/dashboard")).toBe("Dashboard");
    expect(resolveCurrentPageName("/settings")).toBe("Settings");
  });

  it("matches a sub-route by longest prefix", () => {
    expect(resolveCurrentPageName("/learning-journey/family")).toBe(
      "Learning Journey",
    );
  });

  it("resolves the same stable page name from localized URLs", () => {
    expect(resolveCurrentPageName("/es/dashboard")).toBe("Dashboard");
    expect(resolveCurrentPageName("/en/learning-journey/family")).toBe(
      "Learning Journey",
    );
  });

  it("returns null for a route with no match (e.g. a lesson page, which already has its own richer context)", () => {
    expect(resolveCurrentPageName("/lesson/restaurant-entering-and-ordering")).toBeNull();
  });

  it("returns null for the root path", () => {
    expect(resolveCurrentPageName("/")).toBeNull();
  });
});
