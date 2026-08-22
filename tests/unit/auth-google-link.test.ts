import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    user: { findUnique: vi.fn() },
    account: { findUnique: vi.fn(), create: vi.fn() },
  },
}));

import { db } from "@/lib/db";
import { ensureGoogleAccountLinked } from "@/lib/auth-google-link";

const findUniqueUser = vi.mocked(db.user.findUnique);
const findUniqueAccount = vi.mocked(db.account.findUnique);
const createAccount = vi.mocked(db.account.create);

const googleAccount = {
  type: "oauth",
  provider: "google",
  providerAccountId: "google-user-123",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ensureGoogleAccountLinked", () => {
  it("rejects when Google has not verified the email", async () => {
    const result = await ensureGoogleAccountLinked(
      "user@hango.dev",
      false,
      googleAccount,
    );
    expect(result).toBe(false);
    expect(findUniqueUser).not.toHaveBeenCalled();
  });

  it("rejects when there is no email at all", async () => {
    const result = await ensureGoogleAccountLinked(
      undefined,
      true,
      googleAccount,
    );
    expect(result).toBe(false);
  });

  it("allows sign-in without linking when no existing user has that email", async () => {
    findUniqueUser.mockResolvedValueOnce(null);

    const result = await ensureGoogleAccountLinked(
      "new@hango.dev",
      true,
      googleAccount,
    );

    expect(result).toBe(true);
    expect(createAccount).not.toHaveBeenCalled();
  });

  it("links the Google account to an existing user when not already linked", async () => {
    findUniqueUser.mockResolvedValueOnce({ id: "user-1" } as never);
    findUniqueAccount.mockResolvedValueOnce(null);

    const result = await ensureGoogleAccountLinked(
      "existing@hango.dev",
      true,
      googleAccount,
    );

    expect(result).toBe(true);
    expect(createAccount).toHaveBeenCalledWith({
      data: { userId: "user-1", ...googleAccount },
    });
  });

  it("does not create a duplicate link when already linked", async () => {
    findUniqueUser.mockResolvedValueOnce({ id: "user-1" } as never);
    findUniqueAccount.mockResolvedValueOnce({ id: "account-1" } as never);

    const result = await ensureGoogleAccountLinked(
      "existing@hango.dev",
      true,
      googleAccount,
    );

    expect(result).toBe(true);
    expect(createAccount).not.toHaveBeenCalled();
  });
});
