import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it } from "vitest";
import { GET } from "../../app/api/auth/verify-email/route";
import { createOpaqueAuthToken } from "@/lib/auth-tokens";
import { db } from "@/lib/db";

const testEmails: string[] = [];

afterEach(async () => {
  if (testEmails.length === 0) return;

  await db.verificationToken.deleteMany({
    where: { identifier: { in: testEmails } },
  });
  await db.user.deleteMany({ where: { email: { in: testEmails } } });
  testEmails.length = 0;
});

async function pendingAccount(expires: Date) {
  const email = `verify-email-${randomUUID()}@hango.dev`;
  const { rawToken, tokenHash } = createOpaqueAuthToken();
  testEmails.push(email);

  await db.user.create({ data: { email } });
  await db.verificationToken.create({
    data: {
      identifier: email,
      token: tokenHash,
      expires,
    },
  });

  return { email, rawToken, tokenHash };
}

function verificationRequest(input: {
  email: string;
  token: string;
  locale?: string;
}) {
  const url = new URL("http://localhost:3000/api/auth/verify-email");
  url.searchParams.set("email", input.email);
  url.searchParams.set("token", input.token);
  if (input.locale) url.searchParams.set("locale", input.locale);
  return new NextRequest(url);
}

describe("email verification route (integration, real database)", () => {
  it("verifies an account, consumes the hashed token, and keeps the locale", async () => {
    const account = await pendingAccount(new Date(Date.now() + 60_000));

    const response = await GET(
      verificationRequest({
        email: account.email,
        token: account.rawToken,
        locale: "es",
      }),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/es/login?verified=true",
    );
    await expect(
      db.user.findUnique({
        where: { email: account.email },
        select: { emailVerified: true },
      }),
    ).resolves.toMatchObject({ emailVerified: expect.any(Date) });
    await expect(
      db.verificationToken.findUnique({
        where: {
          identifier_token: {
            identifier: account.email,
            token: account.tokenHash,
          },
        },
      }),
    ).resolves.toBeNull();
  });

  it("rejects and removes an expired token without verifying the account", async () => {
    const account = await pendingAccount(new Date(Date.now() - 60_000));

    const response = await GET(
      verificationRequest({
        email: account.email,
        token: account.rawToken,
        locale: "en",
      }),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/en/login?verifyError=invalid",
    );
    await expect(
      db.user.findUnique({
        where: { email: account.email },
        select: { emailVerified: true },
      }),
    ).resolves.toEqual({ emailVerified: null });
    await expect(
      db.verificationToken.findUnique({
        where: {
          identifier_token: {
            identifier: account.email,
            token: account.tokenHash,
          },
        },
      }),
    ).resolves.toBeNull();
  });

  it("does not consume a valid token when a different secret is supplied", async () => {
    const account = await pendingAccount(new Date(Date.now() + 60_000));

    const response = await GET(
      verificationRequest({
        email: account.email,
        token: "not-the-secret-that-was-delivered",
        locale: "es",
      }),
    );

    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/es/login?verifyError=invalid",
    );
    await expect(
      db.verificationToken.findUnique({
        where: {
          identifier_token: {
            identifier: account.email,
            token: account.tokenHash,
          },
        },
      }),
    ).resolves.not.toBeNull();
  });
});
