import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: { user: { findUnique: vi.fn() } },
}));

import { db } from "@/lib/db";
import { resolveAuthSessionState } from "@/lib/auth-session-state";

const findUnique = vi.mocked(db.user.findUnique);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("resolveAuthSessionState", () => {
  it("accepts the database version when a new JWT is first issued", async () => {
    findUnique.mockResolvedValueOnce({
      role: "LEARNER",
      sessionVersion: 2,
    } as never);

    await expect(
      resolveAuthSessionState("user-1", undefined, true),
    ).resolves.toEqual({ role: "LEARNER", sessionVersion: 2 });
  });

  it("rejects an already-issued JWT after the session version changes", async () => {
    findUnique.mockResolvedValueOnce({
      role: "LEARNER",
      sessionVersion: 3,
    } as never);

    await expect(
      resolveAuthSessionState("user-1", 2, false),
    ).resolves.toBeNull();
  });

  it("rejects a JWT whose user has been deleted", async () => {
    findUnique.mockResolvedValueOnce(null);
    await expect(
      resolveAuthSessionState("missing-user", 0, false),
    ).resolves.toBeNull();
  });
});
