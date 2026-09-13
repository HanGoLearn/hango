"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { resetPasswordSchema } from "@/lib/validation/auth";
import { getAuthMessages, resolveAuthLocale } from "@/i18n/auth";

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
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message:
        parsed.error.issues[0] ? messages.actions.passwordLength : messages.actions.invalidPassword,
    };
  }

  const resetToken = await db.passwordResetToken.findUnique({
    where: { identifier_token: { identifier: email, token } },
  });

  if (!resetToken || resetToken.expires < new Date()) {
    if (resetToken) {
      await db.passwordResetToken.delete({
        where: { identifier_token: { identifier: email, token } },
      });
    }
    return {
      status: "error",
      message: messages.actions.invalidReset,
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await db.user.update({
    where: { email },
    data: { passwordHash },
  });

  // Prevent token reuse.
  await db.passwordResetToken.delete({
    where: { identifier_token: { identifier: email, token } },
  });

  return {
    status: "success",
    message: messages.actions.passwordUpdated,
  };
}
