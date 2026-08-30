import "server-only";
import { db } from "@/lib/db";
import {
  ACCESSORIES,
  RARITY_PRICE,
  type AccessorySlot,
} from "@/lib/avatar-catalog";

export class AccessoryNotFoundError extends Error {}
export class AlreadyOwnedError extends Error {}
export class NotOwnedError extends Error {}
export class InsufficientCoinsError extends Error {}

export async function getCoinBalance(userId: string): Promise<number> {
  const result = await db.coinLedgerEntry.aggregate({
    where: { userId },
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0;
}

/**
 * The 2 coin sources that aren't already an Achievement (lesson-by-star,
 * scenario-first-completion) call this directly. Idempotent via the same
 * `@@unique([userId, sourceKey])` constraint Achievements uses - calling
 * this twice for the same `sourceKey` (e.g. a lesson redo) silently does
 * nothing the second time.
 *
 * Never throws (same convention as achievements.ts's `safely` wrapper) -
 * this is called from the middle of Reflection scoring and scenario
 * completion, and a coin-granting hiccup must never break either of those.
 */
export async function grantCoins(
  userId: string,
  amount: number,
  reason: string,
  sourceKey: string,
): Promise<void> {
  if (amount <= 0) return;
  try {
    await db.coinLedgerEntry.createMany({
      data: [{ userId, amount, reason, sourceKey }],
      skipDuplicates: true,
    });
  } catch (error) {
    console.error("[coins] grantCoins failed", { reason, sourceKey }, error);
  }
}

/**
 * Atomic purchase (2026-08-30 plan): reads the balance and writes the debit
 * + ownership row inside one transaction, so a race between two concurrent
 * purchase attempts either both see the pre-purchase balance and only one
 * commits (the second's ledger insert collides with the sourceKey unique
 * constraint), or the second sees the already-updated balance and is
 * correctly rejected as insufficient - never a double-spend.
 */
export async function purchaseAccessory(
  userId: string,
  accessoryKey: string,
): Promise<void> {
  const accessory = ACCESSORIES.find((item) => item.key === accessoryKey);
  if (!accessory) {
    throw new AccessoryNotFoundError("That accessory doesn't exist.");
  }
  const price = RARITY_PRICE[accessory.rarity];

  await db.$transaction(async (tx) => {
    const existing = await tx.learnerAccessoryOwnership.findUnique({
      where: { userId_accessoryKey: { userId, accessoryKey } },
    });
    if (existing) throw new AlreadyOwnedError("You already own this.");

    const result = await tx.coinLedgerEntry.aggregate({
      where: { userId },
      _sum: { amount: true },
    });
    const balance = result._sum.amount ?? 0;
    if (balance < price) {
      throw new InsufficientCoinsError("Not enough HanCoins.");
    }

    await tx.coinLedgerEntry.create({
      data: {
        userId,
        amount: -price,
        reason: "purchase",
        sourceKey: `purchase:${accessoryKey}`,
      },
    });
    await tx.learnerAccessoryOwnership.create({
      data: { userId, accessoryKey },
    });
  });
}

/** `accessoryKey: null` unequips that slot (back to the bare animal). */
export async function equipAccessory(
  userId: string,
  slot: AccessorySlot,
  accessoryKey: string | null,
): Promise<void> {
  if (accessoryKey === null) {
    await db.learnerEquippedAccessory.deleteMany({ where: { userId, slot } });
    return;
  }

  const accessory = ACCESSORIES.find(
    (item) => item.key === accessoryKey && item.slot === slot,
  );
  if (!accessory) {
    throw new AccessoryNotFoundError("That accessory doesn't exist for this slot.");
  }
  const owned = await db.learnerAccessoryOwnership.findUnique({
    where: { userId_accessoryKey: { userId, accessoryKey } },
  });
  if (!owned) throw new NotOwnedError("You don't own this accessory yet.");

  await db.learnerEquippedAccessory.upsert({
    where: { userId_slot: { userId, slot } },
    create: { userId, slot, accessoryKey },
    update: { accessoryKey },
  });
}
