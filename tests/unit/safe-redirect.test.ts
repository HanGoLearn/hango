import { describe, expect, it } from "vitest";
import { getSafeRedirectPath } from "@/lib/safe-redirect";

describe("getSafeRedirectPath", () => {
  it("falls back when no path is given", () => {
    expect(getSafeRedirectPath(undefined, "/dashboard")).toBe("/dashboard");
    expect(getSafeRedirectPath(null, "/dashboard")).toBe("/dashboard");
    expect(getSafeRedirectPath("", "/dashboard")).toBe("/dashboard");
  });

  it("accepts a same-origin relative path", () => {
    expect(getSafeRedirectPath("/learning-journey", "/dashboard")).toBe(
      "/learning-journey",
    );
  });

  it("rejects an absolute URL to another origin (open redirect)", () => {
    expect(
      getSafeRedirectPath("https://evil.example/phish", "/dashboard"),
    ).toBe("/dashboard");
  });

  it("rejects a protocol-relative URL (open redirect)", () => {
    expect(getSafeRedirectPath("//evil.example/phish", "/dashboard")).toBe(
      "/dashboard",
    );
  });

  it("rejects a path that doesn't start with /", () => {
    expect(getSafeRedirectPath("dashboard", "/dashboard")).toBe("/dashboard");
  });
});
