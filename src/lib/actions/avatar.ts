"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ANIMALS_BY_KEY, type AccessorySlot } from "@/lib/avatar-catalog";
import {
  purchaseAccessory,
  equipAccessory,
  AccessoryNotFoundError,
  AlreadyOwnedError,
  NotOwnedError,
  InsufficientCoinsError,
} from "@/lib/coins";

export interface AvatarActionState {
  status: "idle" | "error";
  message?: string;
}

const idleState: AvatarActionState = { status: "idle" };

/**
 * Sets or changes the learner's zodiac animal - purely cosmetic (Codex's
 * own framing: "una decisión estética, no una selección de personaje con
 * estadísticas"), so unlike Account Name this is always freely re-callable,
 * both from onboarding's avatar step and later from the tienda page.
 */
export async function saveAvatarAnimalAction(
  animal: string,
): Promise<AvatarActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { status: "error", message: "You need to be signed in for this." };
  }

  const definition = ANIMALS_BY_KEY.get(animal);
  if (!definition || !definition.available) {
    return { status: "error", message: "That animal isn't available yet." };
  }

  await db.learnerAvatar.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, animal },
    update: { animal },
  });
  return idleState;
}

export async function purchaseAccessoryAction(
  accessoryKey: string,
): Promise<AvatarActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { status: "error", message: "You need to be signed in for this." };
  }

  try {
    await purchaseAccessory(session.user.id, accessoryKey);
    return idleState;
  } catch (error) {
    if (error instanceof InsufficientCoinsError) {
      return { status: "error", message: "Not enough HanCoins for this yet." };
    }
    if (error instanceof AlreadyOwnedError) {
      return { status: "error", message: "You already own this." };
    }
    if (error instanceof AccessoryNotFoundError) {
      return { status: "error", message: "That accessory doesn't exist." };
    }
    return {
      status: "error",
      message: "Couldn't complete the purchase. Please try again.",
    };
  }
}

export async function equipAccessoryAction(
  slot: AccessorySlot,
  accessoryKey: string | null,
): Promise<AvatarActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { status: "error", message: "You need to be signed in for this." };
  }

  try {
    await equipAccessory(session.user.id, slot, accessoryKey);
    return idleState;
  } catch (error) {
    if (error instanceof NotOwnedError) {
      return { status: "error", message: "You don't own this yet." };
    }
    if (error instanceof AccessoryNotFoundError) {
      return { status: "error", message: "That accessory doesn't exist." };
    }
    return { status: "error", message: "Couldn't equip that. Please try again." };
  }
}
