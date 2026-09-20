"use server";

import { db } from "@/lib/db";
import { forgotPasswordSchema } from "@/lib/validation/auth";
import { sendPasswordResetEmail } from "@/lib/email";
import { clientEnv } from "@/lib/env/client";
import { getAuthMessages, resolveAuthLocale } from "@/i18n/auth";
import { localePath } from "@/i18n/config";
import { createOpaqueAuthToken } from "@/lib/auth-tokens";
import {
  AuthRateLimitExceededError,
  consumeAuthRateLimit,
  getAuthRequestIdentity,
} from "@/lib/auth-rate-limit";
import { isAuthHoneypotFilled } from "@/lib/auth-abuse";

export interface ForgotPasswordFormState {
  status: "idle" | "error" | "success";
  message?: string;
}

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour — shorter-lived than email verification.

// Always the same message, whether or not the email exists — recovery must
// never reveal account existence (authentication.md).
export async function forgotPasswordAction(
  _prevState: ForgotPasswordFormState,
  formData: FormData,
): Promise<ForgotPasswordFormState> {
  const locale = resolveAuthLocale(formData.get("locale"));
  const messages = getAuthMessages(locale);
  if (isAuthHoneypotFilled(formData)) {
    return { status: "success", message: messages.actions.resetSent };
  }
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { status: "error", message: messages.actions.invalidEmail };
  }

  const { email } = parsed.data;
  try {
    await consumeAuthRateLimit(
      "recovery",
      email,
      await getAuthRequestIdentity(),
    );
  } catch (error) {
    if (error instanceof AuthRateLimitExceededError) {
      // Preserve account non-enumeration: a throttled request gets the exact
      // same public response as an unknown or successfully processed email.
      return { status: "success", message: messages.actions.resetSent };
    }
    throw error;
  }

  const user = await db.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });

  if (user?.email) {
    const accountEmail = user.email;
    // Remove any previous outstanding reset tokens for this account first —
    // only the most recently requested link should work.
    await db.passwordResetToken.deleteMany({
      where: { identifier: accountEmail },
    });

    const { rawToken, tokenHash } = createOpaqueAuthToken();
    await db.passwordResetToken.create({
      data: {
        identifier: accountEmail,
        token: tokenHash,
        expires: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });

    const resetUrl = `${clientEnv.NEXT_PUBLIC_APP_URL}${localePath(locale, "/reset-password")}?token=${rawToken}&email=${encodeURIComponent(accountEmail)}`;
    try {
      await sendPasswordResetEmail(accountEmail, resetUrl, locale);
    } catch {
      // Keep the public response indistinguishable while ensuring an
      // undelivered bearer token cannot remain active in the database.
      await db.passwordResetToken.deleteMany({
        where: { identifier: accountEmail, token: tokenHash },
      });
    }
  }

  return { status: "success", message: messages.actions.resetSent };
}
