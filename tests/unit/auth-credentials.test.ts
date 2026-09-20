import { describe, expect, it, vi, beforeEach, type Mock } from "vitest";

// server-only is mocked globally in tests/setup-env.ts.
const { emailConfigured } = vi.hoisted(() => ({
  emailConfigured: vi.fn(() => false),
}));

vi.mock("@/lib/db", () => ({
  db: { user: { findFirst: vi.fn() } },
}));
vi.mock("@/lib/email", () => ({
  isTransactionalEmailConfigured: emailConfigured,
}));
vi.mock("bcryptjs", () => ({
  default: { compare: vi.fn() },
}));

import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { verifyCredentials } from "@/lib/auth-credentials";

const findFirst = vi.mocked(db.user.findFirst);
// bcryptjs's `compare` is overloaded (Promise-returning vs. callback-based);
// TS utility types only see the last overload, so vi.mocked() infers a
// `void`-returning signature. Cast explicitly to the overload we actually use.
const compare = bcrypt.compare as unknown as Mock<
  (password: string, hash: string) => Promise<boolean>
>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("verifyCredentials", () => {
  it("rejects non-string email or password", async () => {
    expect(await verifyCredentials(undefined, "password")).toBeNull();
    expect(await verifyCredentials("a@b.com", undefined)).toBeNull();
    expect(findFirst).not.toHaveBeenCalled();
  });

  it("rejects when no user exists for the email, without revealing that", async () => {
    findFirst.mockResolvedValueOnce(null);
    expect(await verifyCredentials("nobody@hango.dev", "anything")).toBeNull();
  });

  it("rejects OAuth-only users (no passwordHash)", async () => {
    findFirst.mockResolvedValueOnce({
      id: "1",
      email: "oauth@hango.dev",
      name: null,
      passwordHash: null,
      role: "LEARNER",
      emailVerified: null,
      sessionVersion: 0,
    } as never);
    expect(await verifyCredentials("oauth@hango.dev", "anything")).toBeNull();
    expect(compare).not.toHaveBeenCalled();
  });

  it("rejects an incorrect password", async () => {
    findFirst.mockResolvedValueOnce({
      id: "1",
      email: "user@hango.dev",
      name: "User",
      passwordHash: "hashed",
      role: "LEARNER",
      emailVerified: new Date(),
      sessionVersion: 0,
    } as never);
    compare.mockResolvedValueOnce(false);
    expect(
      await verifyCredentials("user@hango.dev", "wrong-password"),
    ).toBeNull();
  });

  it("accepts a correct password and returns the safe user shape", async () => {
    findFirst.mockResolvedValueOnce({
      id: "1",
      email: "user@hango.dev",
      name: "User",
      passwordHash: "hashed",
      role: "LEARNER",
      emailVerified: new Date(),
      sessionVersion: 3,
    } as never);
    compare.mockResolvedValueOnce(true);

    const result = await verifyCredentials("user@hango.dev", "correct");

    expect(result).toEqual({
      id: "1",
      email: "user@hango.dev",
      name: "User",
      role: "LEARNER",
      sessionVersion: 3,
    });
    // passwordHash must never leak into the returned/session-bound object.
    expect(result).not.toHaveProperty("passwordHash");
  });

  it("rejects an unverified password account when email delivery is active", async () => {
    emailConfigured.mockReturnValueOnce(true);
    findFirst.mockResolvedValueOnce({
      id: "1",
      email: "pending@hango.dev",
      name: "Pending",
      passwordHash: "hashed",
      role: "LEARNER",
      emailVerified: null,
      sessionVersion: 0,
    } as never);

    expect(await verifyCredentials("pending@hango.dev", "correct")).toBeNull();
    expect(compare).not.toHaveBeenCalled();
  });
});
