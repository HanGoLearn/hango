import { describe, expect, it } from "vitest";
import nextConfig, { securityHeaders } from "../../next.config";

describe("global web security headers", () => {
  it("protects every route without disabling HanGo microphone access", async () => {
    const configured = await nextConfig.headers?.();
    expect(configured).toEqual([
      { source: "/:path*", headers: securityHeaders },
    ]);

    const byName = new Map(
      securityHeaders.map((header) => [header.key, header.value]),
    );
    expect(byName.get("Content-Security-Policy")).toContain(
      "frame-ancestors 'none'",
    );
    expect(byName.get("Content-Security-Policy")).toContain(
      "object-src 'none'",
    );
    expect(byName.get("X-Content-Type-Options")).toBe("nosniff");
    expect(byName.get("X-Frame-Options")).toBe("DENY");
    expect(byName.get("Referrer-Policy")).toBe(
      "strict-origin-when-cross-origin",
    );
    expect(byName.get("Permissions-Policy")).toContain("microphone=(self)");
    expect(byName.get("Permissions-Policy")).toContain("camera=()");
  });

  it("caps Server Action requests just above the validated Speaking upload limit", () => {
    expect(nextConfig.experimental?.serverActions).toEqual({
      bodySizeLimit: "16mb",
    });
  });
});
