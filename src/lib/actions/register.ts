"use server";

import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validation/auth";
import {
  isTransactionalEmailConfigured,
  sendVerificationEmail,
} from "@/lib/email";
import { clientEnv } from "@/lib/env/client";
import { serverEnv } from "@/lib/env/server";
import { getAuthMessages, resolveAuthLocale } from "@/i18n/auth";
import { createOpaqueAuthToken } from "@/lib/auth-tokens";
import {
  AuthRateLimitExceededError,
  consumeAuthRateLimit,
  getAuthRequestIdentity,
} from "@/lib/auth-rate-limit";
import { isAuthHoneypotFilled } from "@/lib/auth-abuse";

export interface RegisterFormState {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Partial<Record<"name" | "email" | "password", string>>;
}

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export async function registerAction(
  _prevState: RegisterFormState,
  formData: FormData,
): Promise<RegisterFormState> {
  const locale = resolveAuthLocale(formData.get("locale"));
  const messages = getAuthMessages(locale);
  if (isAuthHoneypotFilled(formData)) {
    return { status: "error", message: messages.actions.tooManyAttempts };
  }
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const fieldErrors: RegisterFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field === "name" || field === "email" || field === "password") {
        fieldErrors[field] =
          field === "name"
            ? messages.actions.nameRequired
            : field === "email"
              ? messages.actions.invalidEmail
              : messages.actions.passwordLength;
      }
    }
    return { status: "error", fieldErrors };
  }

  const { name, email, password } = parsed.data;

  try {
    await consumeAuthRateLimit(
      "register",
      email,
      await getAuthRequestIdentity(),
    );
  } catch (error) {
    if (error instanceof AuthRateLimitExceededError) {
      return { status: "error", message: messages.actions.tooManyAttempts };
    }
    throw error;
  }

  if (
    serverEnv.NODE_ENV === "production" &&
    !isTransactionalEmailConfigured()
  ) {
    return { status: "error", message: messages.actions.emailUnavailable };
  }

  // Registration (unlike login/password recovery) may disclose an existing
  // account — the learner needs to know to sign in instead (authentication.md
  // only restricts this disclosure for login and password recovery).
  const existing = await db.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });
  if (existing) {
    return {
      status: "error",
      message: messages.actions.accountExists,
    };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const { rawToken, tokenHash } = createOpaqueAuthToken();

  let user: { id: string; email: string | null };
  try {
    user = await db.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: { name, email, passwordHash },
        select: { id: true, email: true },
      });
      await tx.verificationToken.create({
        data: {
          identifier: email,
          token: tokenHash,
          expires: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
        },
      });
      return createdUser;
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { status: "error", message: messages.actions.accountExists };
    }
    throw error;
  }

  const verificationUrl = `${clientEnv.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${rawToken}&email=${encodeURIComponent(email)}&locale=${locale}`;
  try {
    await sendVerificationEmail(email, verificationUrl, locale);
  } catch {
    // Do not leave a newly-created, permanently unreachable account behind
    // when the provider rejects the first verification message.
    await db.$transaction([
      db.verificationToken.deleteMany({ where: { identifier: email } }),
      db.user.deleteMany({
        where: {
          id: user.id,
          emailVerified: null,
          accounts: { none: {} },
        },
      }),
    ]);
    return { status: "error", message: messages.actions.emailUnavailable };
  }

  return {
    status: "success",
    message: isTransactionalEmailConfigured()
      ? messages.actions.accountCreated
      : messages.actions.accountCreatedDevelopment,
  };
}
