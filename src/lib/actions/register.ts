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
import {
  isBetaInviteOnly,
  isPendingBetaInvitation,
  normalizeBetaInvitationEmail,
} from "@/lib/beta-access";

export interface RegisterFormState {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Partial<Record<"name" | "email" | "password", string>>;
}

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

class RegistrationUnavailableError extends Error {}

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

  const passwordHash = await bcrypt.hash(password, 12);
  const { rawToken, tokenHash } = createOpaqueAuthToken();
  const normalizedEmail = normalizeBetaInvitationEmail(email);

  let user: { id: string; email: string | null };
  try {
    user = await db.$transaction(async (tx) => {
      // Return the same message for an existing account and an email that is
      // not on the allowlist. This avoids turning the closed-beta form into an
      // account/invitation enumeration endpoint.
      const [existing, invitation] = await Promise.all([
        tx.user.findFirst({
          where: { email: { equals: normalizedEmail, mode: "insensitive" } },
          select: { id: true },
        }),
        isBetaInviteOnly()
          ? tx.betaInvitation.findUnique({
              where: { email: normalizedEmail },
              select: { id: true, status: true, expiresAt: true },
            })
          : Promise.resolve(null),
      ]);
      if (
        existing ||
        (isBetaInviteOnly() && !isPendingBetaInvitation(invitation))
      ) {
        throw new RegistrationUnavailableError();
      }

      const createdUser = await tx.user.create({
        data: { name, email: normalizedEmail, passwordHash },
        select: { id: true, email: true },
      });
      await tx.verificationToken.create({
        data: {
          identifier: normalizedEmail,
          token: tokenHash,
          expires: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
        },
      });

      if (isBetaInviteOnly()) {
        const activatedAt = new Date();
        const claimed = await tx.betaInvitation.updateMany({
          where: {
            id: invitation!.id,
            status: "PENDING",
            activatedUserId: null,
            OR: [{ expiresAt: null }, { expiresAt: { gt: activatedAt } }],
          },
          data: {
            status: "ACTIVATED",
            activatedUserId: createdUser.id,
            activatedAt,
            revokedAt: null,
          },
        });
        if (claimed.count !== 1) throw new RegistrationUnavailableError();
      }

      return createdUser;
    });
  } catch (error) {
    if (error instanceof RegistrationUnavailableError) {
      return {
        status: "error",
        message: messages.actions.registrationUnavailable,
      };
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        status: "error",
        message: messages.actions.registrationUnavailable,
      };
    }
    throw error;
  }

  const verificationUrl = `${clientEnv.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${rawToken}&email=${encodeURIComponent(normalizedEmail)}&locale=${locale}`;
  try {
    await sendVerificationEmail(normalizedEmail, verificationUrl, locale);
  } catch {
    // Do not leave a newly-created, permanently unreachable account behind
    // when the provider rejects the first verification message.
    await db.$transaction([
      db.verificationToken.deleteMany({
        where: { identifier: normalizedEmail },
      }),
      db.betaInvitation.updateMany({
        where: { activatedUserId: user.id, status: "ACTIVATED" },
        data: {
          status: "PENDING",
          activatedUserId: null,
          activatedAt: null,
        },
      }),
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
