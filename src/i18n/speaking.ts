import type { SpeakingLabMessages } from "@/i18n/messages/types";
import { formatMessage } from "@/i18n/format";

const exactErrorKeys = {
  "Not authenticated": "notAuthenticated",
  "You've requested feedback a lot recently. Please wait a bit.":
    "feedbackRateLimit",
  "Something went wrong generating feedback.": "feedbackFailed",
  "You've submitted a lot of attempts in a short time. Please wait a bit before continuing.":
    "attemptRateLimit",
  "Response can't be empty.": "emptyResponse",
  "Recording is too large.": "recordingTooLarge",
  "Unsupported recording format.": "unsupportedRecording",
  "Something went wrong submitting your attempt. Please try again.":
    "submitFailed",
  "I couldn't recognize that as Spanish, English, or Mandarin. Please say it again.":
    "repeatSpeech",
} as const satisfies Record<
  string,
  Exclude<keyof SpeakingLabMessages["errors"], "responseTooLong">
>;

export function localizeSpeakingError(
  error: string,
  messages: SpeakingLabMessages["errors"],
): string {
  const exactKey = exactErrorKeys[error as keyof typeof exactErrorKeys];
  if (exactKey) return messages[exactKey];

  const tooLong = /^Response is too long \(max (\d+) characters\)\.$/.exec(
    error,
  );
  if (tooLong) {
    return formatMessage(messages.responseTooLong, { max: tooLong[1]! });
  }

  return error;
}
