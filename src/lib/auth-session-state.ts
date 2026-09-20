import "server-only";

import { db } from "@/lib/db";

export interface CurrentAuthSessionState {
  role: string;
  sessionVersion: number;
}

export async function resolveAuthSessionState(
  userId: string,
  issuedSessionVersion: unknown,
  initialIssue: boolean,
): Promise<CurrentAuthSessionState | null> {
  const currentUser = await db.user.findUnique({
    where: { id: userId },
    select: { role: true, sessionVersion: true },
  });
  if (!currentUser) return null;

  if (
    !initialIssue &&
    (typeof issuedSessionVersion !== "number" ||
      issuedSessionVersion !== currentUser.sessionVersion)
  ) {
    return null;
  }

  return currentUser;
}
