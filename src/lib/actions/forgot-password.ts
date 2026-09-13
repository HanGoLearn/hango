"use server";

import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { forgotPasswordSchema } from "@/lib/validation/auth";
import { sendPasswordResetEmail } from "@/lib/email";
import { clientEnv } from "@/lib/env/client";
import { getAuthMessages, resolveAuthLocale } from "@/i18n/auth";
import { localePath } from "@/i18n/config";

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
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { status: "error", message: messages.actions.invalidEmail };
  }

  const { email } = parsed.data;
  const user = await db.user.findUnique({ where: { email } });

  if (user) {
    // Remove any previous outstanding reset tokens for this account first —
    // only the most recently requested link should work.
    await db.passwordResetToken.deleteMany({ where: { identifier: email } });

    const token = randomBytes(32).toString("hex");
    await db.passwordResetToken.create({
      data: {
        identifier: email,
        token,
        expires: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });

    const resetUrl = `${clientEnv.NEXT_PUBLIC_APP_URL}${localePath(locale, "/reset-password")}?token=${token}&email=${encodeURIComponent(email)}`;
    await sendPasswordResetEmail(email, resetUrl);
  }

  return { status: "success", message: messages.actions.resetSent };
}
