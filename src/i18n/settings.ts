import { isAppLocale, type AppLocale } from "@/i18n/config";
import { messages as englishMessages } from "@/i18n/messages/en";
import { messages as spanishMessages } from "@/i18n/messages/es";

const VALIDATION_KEYS: Record<
  string,
  keyof typeof englishMessages.settings.actions
> = {
  "Enter your name": "enterName",
  "Keep it under 60 characters": "nameTooLong",
  "At least 3 characters": "accountNameTooShort",
  "Keep it under 24 characters": "accountNameTooLong",
  "Letters, numbers, and underscores only": "accountNameCharacters",
  "Select at least one goal": "selectGoal",
  "Select at least one skill": "selectSkill",
};

export function settingsLocaleFromFormData(formData: FormData): AppLocale {
  const locale = formData.get("locale");
  return typeof locale === "string" && isAppLocale(locale) ? locale : "en";
}

export function localizeSettingsValidation(
  locale: AppLocale,
  message: string | undefined,
): string | undefined {
  if (!message || locale === "en") return message;
  const key = VALIDATION_KEYS[message];
  return key ? spanishMessages.settings.actions[key] : message;
}

export function settingsActionMessages(locale: AppLocale) {
  return locale === "es"
    ? spanishMessages.settings.actions
    : englishMessages.settings.actions;
}
