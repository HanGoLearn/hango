import { describe, expect, it } from "vitest";
import {
  createOpaqueAuthToken,
  opaqueAuthTokenCandidates,
} from "@/lib/auth-tokens";

describe("opaque authentication tokens", () => {
  it("never accepts the database-stored hash as the bearer secret", () => {
    const { rawToken, tokenHash } = createOpaqueAuthToken();

    expect(rawToken).toMatch(/^[a-f0-9]{64}$/);
    expect(tokenHash).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(opaqueAuthTokenCandidates(rawToken)).toContain(tokenHash);
    expect(opaqueAuthTokenCandidates(tokenHash)).not.toContain(tokenHash);
  });

  it("temporarily accepts an old 64-character token as a legacy candidate", () => {
    const legacyToken = "a".repeat(64);
    expect(opaqueAuthTokenCandidates(legacyToken)).toContain(legacyToken);
  });
});
