"use server";

import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validation/auth";
import { sendVerificationEmail } from "@/lib/email";
import { clientEnv } from "@/lib/env/client";

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
        fieldErrors[field] = issue.message;
      }
    }
    return { status: "error", fieldErrors };
  }

  const { name, email, password } = parsed.data;

  // Registration (unlike login/password recovery) may disclose an existing
  // account — the learner needs to know to sign in instead (authentication.md
  // only restricts this disclosure for login and password recovery).
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return {
      status: "error",
      message:
        "An account with this email already exists. Try logging in instead.",
    };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await db.user.create({
    data: { name, email, passwordHash },
  });

  const token = randomBytes(32).toString("hex");
  await db.verificationToken.create({
    data: {
      identifier: user.email!,
      token,
      expires: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
    },
  });

  const verificationUrl = `${clientEnv.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(user.email!)}`;
  await sendVerificationEmail(user.email!, verificationUrl);

  return {
    status: "success",
    message:
      "Account created. Check your email for a link to verify your account before logging in.",
  };
}
