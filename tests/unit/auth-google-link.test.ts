import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    user: { findFirst: vi.fn() },
    account: { findUnique: vi.fn(), create: vi.fn() },
    betaInvitation: { findUnique: vi.fn() },
  },
}));

import { db } from "@/lib/db";
import { ensureGoogleAccountLinked } from "@/lib/auth-google-link";

const findFirstUser = vi.mocked(db.user.findFirst);
const findUniqueAccount = vi.mocked(db.account.findUnique);
const createAccount = vi.mocked(db.account.create);
const findUniqueInvitation = vi.mocked(db.betaInvitation.findUnique);

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
    findFirstUser.mockResolvedValueOnce(null);

    const result = await ensureGoogleAccountLinked(
      "user@hango.dev",
      false,
      googleAccount,
    );
    expect(result).toBe(false);
    expect(findUniqueInvitation).not.toHaveBeenCalled();
  });

  it("rejects when there is no email at all", async () => {
    const result = await ensureGoogleAccountLinked(
      undefined,
      true,
      googleAccount,
    );
    expect(result).toBe(false);
  });

  it("rejects a new Google account when its email was not invited", async () => {
    findFirstUser.mockResolvedValueOnce(null);
    findUniqueInvitation.mockResolvedValueOnce(null);

    const result = await ensureGoogleAccountLinked(
      "new@hango.dev",
      true,
      googleAccount,
    );

    expect(result).toBe(false);
    expect(createAccount).not.toHaveBeenCalled();
  });

  it("allows the verified configured administrator to bootstrap through Google", async () => {
    findFirstUser.mockResolvedValueOnce(null);

    const result = await ensureGoogleAccountLinked(
      " HANGO.LEARN@GMAIL.COM ",
      true,
      googleAccount,
    );

    expect(result).toBe(true);
    expect(findUniqueInvitation).not.toHaveBeenCalled();
    expect(createAccount).not.toHaveBeenCalled();
  });

  it("rejects administrator bootstrap when Google has not verified the email", async () => {
    findFirstUser.mockResolvedValueOnce(null);

    const result = await ensureGoogleAccountLinked(
      "hango.learn@gmail.com",
      false,
      googleAccount,
    );

    expect(result).toBe(false);
    expect(findUniqueInvitation).not.toHaveBeenCalled();
  });

  it("allows a new Google account with a pending invitation", async () => {
    findFirstUser.mockResolvedValueOnce(null);
    findUniqueInvitation.mockResolvedValueOnce({
      status: "PENDING",
      expiresAt: null,
    } as never);

    const result = await ensureGoogleAccountLinked(
      "Invited@HanGo.dev",
      true,
      googleAccount,
    );

    expect(result).toBe(true);
    expect(findUniqueInvitation).toHaveBeenCalledWith({
      where: { email: "invited@hango.dev" },
      select: { status: true, expiresAt: true },
    });
  });

  it("links the Google account to an existing user when not already linked", async () => {
    findFirstUser.mockResolvedValueOnce({
      id: "user-1",
      emailVerified: new Date(),
    } as never);
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
    findFirstUser.mockResolvedValueOnce({
      id: "user-1",
      emailVerified: new Date(),
    } as never);
    findUniqueAccount.mockResolvedValueOnce({ userId: "user-1" } as never);

    const result = await ensureGoogleAccountLinked(
      "existing@hango.dev",
      true,
      googleAccount,
    );

    expect(result).toBe(true);
    expect(createAccount).not.toHaveBeenCalled();
  });

  it("accepts a previously linked and verified user when the callback omits the verification claim", async () => {
    findFirstUser.mockResolvedValueOnce({
      id: "user-1",
      emailVerified: new Date(),
    } as never);
    findUniqueAccount.mockResolvedValueOnce({ userId: "user-1" } as never);

    const result = await ensureGoogleAccountLinked(
      "existing@hango.dev",
      undefined,
      googleAccount,
    );

    expect(result).toBe(true);
    expect(createAccount).not.toHaveBeenCalled();
  });

  it("rejects attaching a new Google identity without Google's verified-email claim", async () => {
    findFirstUser.mockResolvedValueOnce({
      id: "user-1",
      emailVerified: new Date(),
    } as never);
    findUniqueAccount.mockResolvedValueOnce(null);

    const result = await ensureGoogleAccountLinked(
      "existing@hango.dev",
      undefined,
      googleAccount,
    );

    expect(result).toBe(false);
    expect(createAccount).not.toHaveBeenCalled();
  });

  it("rejects an existing provider identity linked to another HanGo user", async () => {
    findFirstUser.mockResolvedValueOnce({
      id: "user-1",
      emailVerified: new Date(),
    } as never);
    findUniqueAccount.mockResolvedValueOnce({ userId: "user-2" } as never);

    const result = await ensureGoogleAccountLinked(
      "existing@hango.dev",
      true,
      googleAccount,
    );

    expect(result).toBe(false);
    expect(createAccount).not.toHaveBeenCalled();
  });
});
