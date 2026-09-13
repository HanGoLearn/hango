import { isAppLocale, type AppLocale } from "@/i18n/config";
import { messages as englishMessages } from "@/i18n/messages/en";
import { messages as spanishMessages } from "@/i18n/messages/es";

/**
 * Form actions also run in tests and non-UI call sites that predate locale
 * routing. Keep English as the compatibility fallback; every localized form
 * sends its explicit locale.
 */
export function resolveAuthLocale(value: FormDataEntryValue | null): AppLocale {
  return typeof value === "string" && isAppLocale(value) ? value : "en";
}

export function getAuthMessages(locale: AppLocale) {
  return locale === "es" ? spanishMessages.auth : englishMessages.auth;
}
