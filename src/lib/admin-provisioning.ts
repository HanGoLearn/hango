import "server-only";

import { db } from "@/lib/db";
import { isAdministratorEmail } from "@/lib/admin-identity";

/**
 * Makes the single configured administrator authoritative when that identity
 * is first created by a verified Google sign-in. Other users are untouched.
 */
export async function provisionAdministratorUser({
  userId,
  email,
}: {
  userId: string;
  email: string;
}): Promise<boolean> {
  if (!isAdministratorEmail(email)) return false;

  await db.$transaction([
    db.user.updateMany({
      where: { role: "ADMINISTRATOR", id: { not: userId } },
      data: { role: "LEARNER", sessionVersion: { increment: 1 } },
    }),
    db.user.update({
      where: { id: userId },
      data: { role: "ADMINISTRATOR", sessionVersion: { increment: 1 } },
    }),
  ]);

  return true;
}
