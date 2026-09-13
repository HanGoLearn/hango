import { formatMessage } from "@/i18n/format";
import type { WritingLabMessages } from "@/i18n/messages/types";

const exactErrorKeys = {
  "Not authenticated": "notAuthenticated",
  "You've submitted a lot of attempts in a short time. Please wait a bit before continuing.":
    "attemptRateLimit",
  "Topic can't be empty.": "topicEmpty",
  "Response can't be empty.": "responseEmpty",
  "Something went wrong submitting your writing. Please try again.":
    "submitFailed",
  Unauthorized: "unauthorized",
  "Invalid photo submission.": "invalidSubmission",
  "Choose a valid level and topic.": "invalidLevelTopic",
  "Upload between 1 and 3 photos.": "invalidPhotoCount",
  "Use clear JPG, PNG, or WebP photos no larger than 2 MB each.":
    "invalidPhoto",
  "One of the selected files is not a valid image.": "invalidImage",
  "You've submitted several photo evaluations. Please wait a few minutes before trying again.":
    "handwrittenRateLimit",
  "This feature isn't available for your account.": "featureUnavailable",
  "You've reached today's usage limit for this feature. Please try again tomorrow.":
    "dailyLimit",
  "Handwriting evaluation is not configured.": "evaluationNotConfigured",
  "The photos are not clear enough to assess. Please retake them.":
    "photosUnclear",
  "The evaluation was incomplete.": "evaluationIncomplete",
  "The photos could not be evaluated right now.": "evaluationUnavailable",
  "Something went wrong evaluating your photos. Please try again when ready.":
    "evaluationGeneric",
} as const satisfies Record<
  string,
  Exclude<
    keyof WritingLabMessages["errors"],
    | "responseTooLong"
    | "browserPhotoFailed"
    | "photoFailed"
    | "photoTooLarge"
    | "photoTooSmall"
    | "photoCompressionFailed"
    | "tooManyPhotos"
    | "photoFormats"
    | "photoPreparationFailed"
    | "photoEvaluationFailed"
    | "photoSendFailed"
  >
>;

export function localizeWritingError(
  error: string,
  messages: WritingLabMessages["errors"],
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
