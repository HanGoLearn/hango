"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { resetPasswordSchema } from "@/lib/validation/auth";

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
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid password",
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
      message: "This reset link is invalid or has expired. Request a new one.",
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
    message: "Password updated. You can now log in with your new password.",
  };
}
