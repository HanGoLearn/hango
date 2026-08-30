import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { getCoinBalance } from "@/lib/coins";
import { ANIMALS_BY_KEY, type AccessorySlot } from "@/lib/avatar-catalog";

export interface AvatarPageData {
  animal: string | null;
  animalName: string | null;
  coinBalance: number;
  ownedAccessoryKeys: string[];
  equipped: Record<AccessorySlot, string | null>;
}

/**
 * Full data for the `/tienda` page - character + wallet + inventory in one
 * shot, `Promise.all`'d same as every other page-data module in this app.
 * Cached per-request (React.cache) so the Dashboard teaser and a full
 * tienda visit in the same request never pay for this twice.
 */
export const getAvatarPageData = cache(
  async (userId: string): Promise<AvatarPageData> => {
    const [avatar, coinBalance, ownership, equippedRows] = await Promise.all([
      db.learnerAvatar.findUnique({ where: { userId }, select: { animal: true } }),
      getCoinBalance(userId),
      db.learnerAccessoryOwnership.findMany({
        where: { userId },
        select: { accessoryKey: true },
      }),
      db.learnerEquippedAccessory.findMany({
        where: { userId },
        select: { slot: true, accessoryKey: true },
      }),
    ]);

    const equipped: Record<AccessorySlot, string | null> = {
      HEAD: null,
      FACE: null,
      TORSO: null,
    };
    for (const row of equippedRows) {
      equipped[row.slot as AccessorySlot] = row.accessoryKey;
    }

    return {
      animal: avatar?.animal ?? null,
      animalName: avatar ? (ANIMALS_BY_KEY.get(avatar.animal)?.name ?? null) : null,
      coinBalance,
      ownedAccessoryKeys: ownership.map((row) => row.accessoryKey),
      equipped,
    };
  },
);
