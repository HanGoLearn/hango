import "server-only";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { serverEnv } from "@/lib/env/server";
import { isTransactionalEmailConfigured } from "@/lib/email";

export interface VerifiedCredentialsUser {
  id: string;
  email: string | null;
  name: string | null;
  role: string;
  sessionVersion: number;
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

  const normalizedEmail = email.trim().toLowerCase();
  const user = await db.user.findFirst({
    where: { email: { equals: normalizedEmail, mode: "insensitive" } },
  });
  if (!user?.passwordHash) {
    return null;
  }

  // Production is always fail-closed. Local/test environments may keep using
  // password accounts without a mail provider, but as soon as delivery is
  // configured they exercise the same verified-email gate as production.
  if (
    !user.emailVerified &&
    (serverEnv.NODE_ENV === "production" || isTransactionalEmailConfigured())
  ) {
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
    sessionVersion: user.sessionVersion,
  };
}
