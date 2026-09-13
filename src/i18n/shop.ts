import "server-only";

import { getDictionary } from "@/i18n/get-dictionary";
import { isAppLocale, type AppLocale } from "@/i18n/config";
import type { ShopMessages } from "@/i18n/messages/types";

export function shopLocale(value: string | null | undefined): AppLocale {
  return typeof value === "string" && isAppLocale(value) ? value : "en";
}

export async function getShopActionMessages(
  locale: AppLocale,
): Promise<ShopMessages["actions"]> {
  return (await getDictionary(locale)).shop.actions;
}
