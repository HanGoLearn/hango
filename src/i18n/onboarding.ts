import "server-only";

import { getDictionary } from "@/i18n/get-dictionary";
import { isAppLocale, type AppLocale } from "@/i18n/config";
import type { OnboardingMessages } from "@/i18n/messages/types";

export function onboardingLocale(value: FormDataEntryValue | string | null): AppLocale {
  return typeof value === "string" && isAppLocale(value) ? value : "en";
}

export async function getOnboardingActionMessages(
  locale: AppLocale,
): Promise<OnboardingMessages["actions"]> {
  return (await getDictionary(locale)).onboarding.actions;
}

const validationMessageKeys = {
  "Enter your name": "enterName",
  "Keep it under 60 characters": "nameTooLong",
  "At least 3 characters": "accountNameTooShort",
  "Keep it under 24 characters": "accountNameTooLong",
  "Letters, numbers, and underscores only": "accountNameCharacters",
  "Select at least one goal": "selectGoal",
  "Select at least one skill": "selectSkill",
  "Choose one of the offered durations": "chooseDuration",
} as const satisfies Record<string, keyof OnboardingMessages["actions"]>;

export function localizeOnboardingValidation(
  message: string | undefined,
  messages: OnboardingMessages["actions"],
): string | undefined {
  if (!message) return undefined;
  const key = validationMessageKeys[message as keyof typeof validationMessageKeys];
  return key ? messages[key] : message;
}
