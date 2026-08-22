"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";

export interface LoginFormState {
  status: "idle" | "error";
  message?: string;
}

export async function loginAction(
  redirectTo: string,
  _prevState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
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
      return { status: "error", message: "Invalid email or password." };
    }
    // signIn() throws Next's internal redirect signal on success — let it propagate.
    throw error;
  }
}
