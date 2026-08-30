"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export interface UnseenCoinGain {
  id: string;
  amount: number;
  reason: string;
}

/**
 * Powers the coin-gain toast (2026-08-30, user request - "asi como cuando
 * logras un achievement, tambien aparezca que ganaste coins"). Same
 * decoupled detection/celebration split as Achievements
 * (getUnseenAchievementsAction): every coin-granting call site just writes
 * a CoinLedgerEntry, this only ever reads whatever's sitting unseen.
 * `amount: { gt: 0 }` - a purchase's debit row is never "unseen", the
 * tienda UI already gives instant feedback for that.
 */
export async function getUnseenCoinGainsAction(): Promise<UnseenCoinGain[]> {
  const session = await auth();
  if (!session?.user?.id) return [];

  return db.coinLedgerEntry.findMany({
    where: { userId: session.user.id, seenAt: null, amount: { gt: 0 } },
    orderBy: { createdAt: "asc" },
    select: { id: true, amount: true, reason: true },
  });
}

export async function markCoinGainsSeenAction(ids: string[]): Promise<void> {
  const session = await auth();
  if (!session?.user?.id || ids.length === 0) return;
  await db.coinLedgerEntry.updateMany({
    where: { userId: session.user.id, id: { in: ids }, seenAt: null },
    data: { seenAt: new Date() },
  });
}
