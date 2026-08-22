import "server-only";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export interface VerifiedCredentialsUser {
  id: string;
  email: string | null;
  name: string | null;
  role: string;
}

/**
 * Validates email/password credentials (authentication.md). Never reveals
 * whether an email exists — always returns null on any failure.
 */
export async function verifyCredentials(
  email: unknown,
  password: unknown,
): Promise<VerifiedCredentialsUser | null> {
  if (typeof email !== "string" || typeof password !== "string") {
    return null;
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user?.passwordHash) {
    return null;
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}
