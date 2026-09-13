"use server";

import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validation/auth";
import { sendVerificationEmail } from "@/lib/email";
import { clientEnv } from "@/lib/env/client";
import { getAuthMessages, resolveAuthLocale } from "@/i18n/auth";

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

  // Registration (unlike login/password recovery) may disclose an existing
  // account — the learner needs to know to sign in instead (authentication.md
  // only restricts this disclosure for login and password recovery).
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return {
      status: "error",
      message: messages.actions.accountExists,
    };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await db.user.create({ data: { name, email, passwordHash } });

  const token = randomBytes(32).toString("hex");
  await db.verificationToken.create({
    data: {
      identifier: user.email!,
      token,
      expires: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
    },
  });

  const verificationUrl = `${clientEnv.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(user.email!)}&locale=${locale}`;
  await sendVerificationEmail(user.email!, verificationUrl);

  return {
    status: "success",
    message: messages.actions.accountCreated,
  };
}
