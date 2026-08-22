import { afterEach, describe, expect, it, vi } from "vitest";

describe("clientEnv validation", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("applies defaults when public env vars are not set", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_NAME", undefined);
    vi.stubEnv("NEXT_PUBLIC_APP_URL", undefined);

    const { clientEnv } = await import("@/lib/env/client");

    expect(clientEnv.NEXT_PUBLIC_APP_NAME).toBe("HanGo");
    expect(clientEnv.NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000");
  });

  it("accepts valid public env vars", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_NAME", "Custom Name");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://hango.example.com");

    const { clientEnv } = await import("@/lib/env/client");

    expect(clientEnv.NEXT_PUBLIC_APP_NAME).toBe("Custom Name");
    expect(clientEnv.NEXT_PUBLIC_APP_URL).toBe("https://hango.example.com");
  });

  it("throws when NEXT_PUBLIC_APP_URL is not a valid URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "not-a-url");

    await expect(import("@/lib/env/client")).rejects.toThrow(
      /Invalid public environment variables/,
    );
  });
});
