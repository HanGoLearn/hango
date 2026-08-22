"use server";

import { signIn } from "@/lib/auth";

export async function googleSignInAction(redirectTo: string): Promise<void> {
  await signIn("google", { redirectTo });
}
