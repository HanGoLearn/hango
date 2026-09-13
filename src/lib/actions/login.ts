"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { getAuthMessages, resolveAuthLocale } from "@/i18n/auth";

export interface LoginFormState {
  status: "idle" | "error";
  message?: string;
}

export async function loginAction(
  redirectTo: string,
  _prevState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const locale = resolveAuthLocale(formData.get("locale"));
  const messages = getAuthMessages(locale);
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      // Only ever a same-origin relative path (validated by the caller) —
      // never trust a redirect target from the client without checking.
      redirectTo,
    });
    return { status: "idle" };
  } catch (error) {
    if (error instanceof AuthError) {
      // Never reveal whether the email exists (authentication.md).
      return { status: "error", message: messages.actions.invalidCredentials };
    }
    // signIn() throws Next's internal redirect signal on success — let it propagate.
    throw error;
  }
}
