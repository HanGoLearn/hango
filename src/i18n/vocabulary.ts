import { formatMessage } from "@/i18n/format";
import type { HanVocabularyMessages } from "@/i18n/messages/types";

const exactErrorKeys = {
  "Not authenticated": "notAuthenticated",
  "Han couldn't find that word. Try rephrasing it or check the spelling.":
    "notFound",
  "Type a word or its pinyin.": "empty",
  "You've looked up a lot of words in a short time. Please wait a bit before continuing.":
    "rateLimit",
  "This feature isn't available for your account.": "featureUnavailable",
  "You've reached today's usage limit for this feature. Please try again tomorrow.":
    "dailyLimit",
  "Something went wrong looking that up. Please try again.": "lookupFailed",
} as const satisfies Record<
  string,
  Exclude<keyof HanVocabularyMessages["errors"], "tooLong">
>;

export function localizeVocabularyError(
  error: string,
  messages: HanVocabularyMessages["errors"],
): string {
  const exactKey = exactErrorKeys[error as keyof typeof exactErrorKeys];
  if (exactKey) return messages[exactKey];

  const tooLong =
    /^That's too long \(max (\d+) characters\) - try a single word or short phrase\.$/.exec(
      error,
    );
  if (tooLong) {
    return formatMessage(messages.tooLong, { max: tooLong[1]! });
  }

  return error;
}
