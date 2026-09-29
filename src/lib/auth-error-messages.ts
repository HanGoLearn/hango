/**
 * Friendly messages for Auth.js's ?error= codes (authentication.md — errors
 * should be "Clear. Helpful. Secure."). Unknown codes fall back to a generic
 * message rather than exposing internal error names.
 */
import { getAuthMessages } from "@/i18n/auth";
import type { AppLocale } from "@/i18n/config";

export function getAuthErrorMessage(
  code: string | undefined,
  locale: AppLocale = "en",
): string | undefined {
  if (!code) return undefined;
  const messages = getAuthMessages(locale).actions;

  switch (code) {
    case "OAuthAccountNotLinked":
      return messages.oauthNotLinked;
    case "AccessDenied":
      return messages.registrationUnavailable;
    case "Configuration":
      return messages.oauthUnavailable;
    default:
      return messages.oauthGeneric;
  }
}
