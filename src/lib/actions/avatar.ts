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
import {
  getOnboardingActionMessages,
  onboardingLocale,
} from "@/i18n/onboarding";
import { getShopActionMessages, shopLocale } from "@/i18n/shop";

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
  localeValue?: string,
): Promise<AvatarActionState> {
  const locale = onboardingLocale(localeValue ?? null);
  const messages = await getOnboardingActionMessages(locale);
  const session = await auth();
  if (!session?.user?.id) {
    return { status: "error", message: messages.signInRequired };
  }

  const definition = ANIMALS_BY_KEY.get(animal);
  if (!definition || !definition.available) {
    return { status: "error", message: messages.animalUnavailable };
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
  localeValue?: string,
): Promise<AvatarActionState> {
  const messages = await getShopActionMessages(shopLocale(localeValue));
  const session = await auth();
  if (!session?.user?.id) {
    return { status: "error", message: messages.signInRequired };
  }

  try {
    await purchaseAccessory(session.user.id, accessoryKey);
    return idleState;
  } catch (error) {
    if (error instanceof InsufficientCoinsError) {
      return { status: "error", message: messages.insufficientCoins };
    }
    if (error instanceof AlreadyOwnedError) {
      return { status: "error", message: messages.alreadyOwned };
    }
    if (error instanceof AccessoryNotFoundError) {
      return { status: "error", message: messages.accessoryNotFound };
    }
    return {
      status: "error",
      message: messages.purchaseFailed,
    };
  }
}

export async function equipAccessoryAction(
  slot: AccessorySlot,
  accessoryKey: string | null,
  localeValue?: string,
): Promise<AvatarActionState> {
  const messages = await getShopActionMessages(shopLocale(localeValue));
  const session = await auth();
  if (!session?.user?.id) {
    return { status: "error", message: messages.signInRequired };
  }

  try {
    await equipAccessory(session.user.id, slot, accessoryKey);
    return idleState;
  } catch (error) {
    if (error instanceof NotOwnedError) {
      return { status: "error", message: messages.notOwned };
    }
    if (error instanceof AccessoryNotFoundError) {
      return { status: "error", message: messages.accessoryNotFound };
    }
    return { status: "error", message: messages.equipFailed };
  }
}
