import { afterEach, describe, expect, it } from "vitest";
import { forgotPasswordAction } from "@/lib/actions/forgot-password";
import { resetPasswordAction } from "@/lib/actions/reset-password";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

function formDataOf(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  return formData;
}

const testEmails: string[] = [];

afterEach(async () => {
  if (testEmails.length > 0) {
    await db.passwordResetToken.deleteMany({
      where: { identifier: { in: testEmails } },
    });
    await db.user.deleteMany({ where: { email: { in: testEmails } } });
    testEmails.length = 0;
  }
});

describe("password recovery (integration, real database)", () => {
  it("gives the same generic message whether or not the email exists", async () => {
    const existingEmail = `reset-exists-${Date.now()}@hango.dev`;
    testEmails.push(existingEmail);
    await db.user.create({
      data: {
        email: existingEmail,
        passwordHash: await bcrypt.hash("original-password", 10),
      },
    });

    const forExisting = await forgotPasswordAction(
      { status: "idle" },
      formDataOf({ email: existingEmail }),
    );
    const forUnknown = await forgotPasswordAction(
      { status: "idle" },
      formDataOf({ email: "definitely-not-registered@hango.dev" }),
    );

    expect(forExisting.status).toBe("success");
    expect(forUnknown.status).toBe("success");
    expect(forExisting.message).toBe(forUnknown.message);
  });

  it("creates a usable token only for an existing account", async () => {
    const email = `reset-token-${Date.now()}@hango.dev`;
    testEmails.push(email);
    await db.user.create({
      data: { email, passwordHash: await bcrypt.hash("original", 10) },
    });

    await forgotPasswordAction({ status: "idle" }, formDataOf({ email }));

    const token = await db.passwordResetToken.findFirst({
      where: { identifier: email },
    });
    expect(token).not.toBeNull();
    expect(token!.expires.getTime()).toBeGreaterThan(Date.now());

    const unknownEmailTokens = await db.passwordResetToken.count({
      where: { identifier: "definitely-not-registered@hango.dev" },
    });
    expect(unknownEmailTokens).toBe(0);
  });

  it("updates the password and prevents token reuse", async () => {
    const email = `reset-full-${Date.now()}@hango.dev`;
    testEmails.push(email);
    await db.user.create({
      data: { email, passwordHash: await bcrypt.hash("original-password", 10) },
    });

    await forgotPasswordAction({ status: "idle" }, formDataOf({ email }));
    const tokenRow = await db.passwordResetToken.findFirstOrThrow({
      where: { identifier: email },
    });

    const result = await resetPasswordAction(
      email,
      tokenRow.token,
      { status: "idle" },
      formDataOf({ password: "brand-new-password-123" }),
    );
    expect(result.status).toBe("success");

    const user = await db.user.findUniqueOrThrow({ where: { email } });
    const matchesNew = await bcrypt.compare(
      "brand-new-password-123",
      user.passwordHash!,
    );
    const matchesOld = await bcrypt.compare(
      "original-password",
      user.passwordHash!,
    );
    expect(matchesNew).toBe(true);
    expect(matchesOld).toBe(false);

    const remainingTokens = await db.passwordResetToken.count({
      where: { identifier: email },
    });
    expect(remainingTokens).toBe(0);

    // Reusing the same (now-deleted) token must fail.
    const reuseResult = await resetPasswordAction(
      email,
      tokenRow.token,
      { status: "idle" },
      formDataOf({ password: "another-password-456" }),
    );
    expect(reuseResult.status).toBe("error");
  });

  it("does not delete a pending email-verification token for the same address", async () => {
    const email = `reset-vs-verify-${Date.now()}@hango.dev`;
    testEmails.push(email);
    await db.user.create({
      data: { email, passwordHash: await bcrypt.hash("original", 10) },
    });
    await db.verificationToken.create({
      data: {
        identifier: email,
        token: "unrelated-verification-token",
        expires: new Date(Date.now() + 60_000),
      },
    });

    await forgotPasswordAction({ status: "idle" }, formDataOf({ email }));

    const verificationTokenStillThere = await db.verificationToken.findFirst({
      where: { identifier: email },
    });
    expect(verificationTokenStillThere).not.toBeNull();

    await db.verificationToken.deleteMany({ where: { identifier: email } });
  });
});
