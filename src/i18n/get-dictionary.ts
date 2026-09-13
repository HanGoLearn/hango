import "server-only";
import type { AppLocale } from "@/i18n/config";

const dictionaries = {
  en: () => import("@/i18n/messages/en").then((module) => module.messages),
  es: () => import("@/i18n/messages/es").then((module) => module.messages),
};

export function getDictionary(locale: AppLocale) {
  return dictionaries[locale]();
}
