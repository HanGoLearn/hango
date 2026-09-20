import { afterEach, describe, expect, it, vi } from "vitest";

const { verificationUrls } = vi.hoisted(() => ({
  verificationUrls: [] as string[],
}));
vi.mock("@/lib/email", () => ({
  isTransactionalEmailConfigured: () => false,
  sendVerificationEmail: vi.fn(async (_email: string, url: string) =>
    verificationUrls.push(url),
  ),
}));

import { registerAction } from "@/lib/actions/register";
import { db } from "@/lib/db";

function formDataOf(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  return formData;
}

const testEmails: string[] = [];

afterEach(async () => {
  await db.authRateLimitBucket.deleteMany();
  verificationUrls.length = 0;
  if (testEmails.length > 0) {
    await db.verificationToken.deleteMany({
      where: { identifier: { in: testEmails } },
    });
    await db.user.deleteMany({ where: { email: { in: testEmails } } });
    testEmails.length = 0;
  }
});

describe("registerAction (integration, real database)", () => {
  it("rejects invalid input without touching the database", async () => {
    const result = await registerAction(
      { status: "idle" },
      formDataOf({ name: "", email: "not-an-email", password: "short" }),
    );

    expect(result.status).toBe("error");
    expect(result.fieldErrors?.name).toBeTruthy();
    expect(result.fieldErrors?.email).toBeTruthy();
    expect(result.fieldErrors?.password).toBeTruthy();
  });

  it("creates a User with a hashed password and a verification token", async () => {
    const email = `registration-test-${Date.now()}@hango.dev`;
    testEmails.push(email);

    const result = await registerAction(
      { status: "idle" },
      formDataOf({ name: "Test Learner", email, password: "correct-horse" }),
    );

    expect(result.status).toBe("success");

    const user = await db.user.findUnique({ where: { email } });
    expect(user).not.toBeNull();
    expect(user?.emailVerified).toBeNull();
    expect(user?.role).toBe("LEARNER");
    // The password must be hashed, never stored as-is.
    expect(user?.passwordHash).not.toBe("correct-horse");
    expect(user?.passwordHash).toMatch(/^\$2[aby]\$/);

    const token = await db.verificationToken.findFirst({
      where: { identifier: email },
    });
    expect(token).not.toBeNull();
    expect(token!.expires.getTime()).toBeGreaterThan(Date.now());
    const deliveredToken = new URL(verificationUrls.at(-1)!).searchParams.get(
      "token",
    );
    expect(deliveredToken).toHaveLength(64);
    expect(token!.token).not.toBe(deliveredToken);
    expect(token!.token).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  it("prevents duplicate accounts for the same email", async () => {
    const email = `registration-dup-${Date.now()}@hango.dev`;
    testEmails.push(email);

    const first = await registerAction(
      { status: "idle" },
      formDataOf({ name: "First", email, password: "correct-horse" }),
    );
    expect(first.status).toBe("success");

    const second = await registerAction(
      { status: "idle" },
      formDataOf({ name: "Second", email, password: "different-password" }),
    );
    expect(second.status).toBe("error");
    expect(second.message).toMatch(/already exists/i);

    const users = await db.user.findMany({ where: { email } });
    expect(users).toHaveLength(1);
  });
});
