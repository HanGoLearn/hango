"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { resetPasswordSchema } from "@/lib/validation/auth";
import { getAuthMessages, resolveAuthLocale } from "@/i18n/auth";
import { opaqueAuthTokenCandidates } from "@/lib/auth-tokens";
import {
  AuthRateLimitExceededError,
  consumeAuthRateLimit,
  getAuthRequestIdentity,
} from "@/lib/auth-rate-limit";
import { isAuthHoneypotFilled } from "@/lib/auth-abuse";

export interface ResetPasswordFormState {
  status: "idle" | "error" | "success";
  message?: string;
}

export async function resetPasswordAction(
  email: string,
  token: string,
  _prevState: ResetPasswordFormState,
  formData: FormData,
): Promise<ResetPasswordFormState> {
  const locale = resolveAuthLocale(formData.get("locale"));
  const messages = getAuthMessages(locale);
  if (isAuthHoneypotFilled(formData)) {
    return { status: "error", message: messages.actions.invalidReset };
  }
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]
        ? messages.actions.passwordLength
        : messages.actions.invalidPassword,
    };
  }

  try {
    await consumeAuthRateLimit(
      "reset",
      email.trim().toLowerCase(),
      await getAuthRequestIdentity(),
    );
  } catch (error) {
    if (error instanceof AuthRateLimitExceededError) {
      return { status: "error", message: messages.actions.invalidReset };
    }
    throw error;
  }

  const resetToken = await db.passwordResetToken.findFirst({
    where: {
      identifier: email,
      token: { in: opaqueAuthTokenCandidates(token) },
    },
  });

  if (!resetToken || resetToken.expires < new Date()) {
    if (resetToken) {
      await db.passwordResetToken.delete({
        where: {
          identifier_token: { identifier: email, token: resetToken.token },
        },
      });
    }
    return {
      status: "error",
      message: messages.actions.invalidReset,
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await db.$transaction([
    db.user.update({
      where: { email },
      data: {
        passwordHash,
        // JWT sessions are stateless. Incrementing this value invalidates every
        // cookie issued before the password change on its next backend check.
        sessionVersion: { increment: 1 },
      },
    }),
    // Delete every outstanding link, not only the one used for this reset.
    db.passwordResetToken.deleteMany({ where: { identifier: email } }),
  ]);

  return {
    status: "success",
    message: messages.actions.passwordUpdated,
  };
}
