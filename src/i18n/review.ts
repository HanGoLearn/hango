import { formatMessage } from "@/i18n/format";
import type { DashboardMessages } from "@/i18n/messages/types";
import type { ReviewItem } from "@/lib/review-queue";

export function localizeReviewItem(
  item: ReviewItem,
  messages: DashboardMessages["review"],
): Pick<ReviewItem, "title" | "reason" | "actionLabel"> {
  if (item.type === "AI_PRACTICE") {
    return {
      title: messages.aiTitle,
      reason: messages.aiReason,
      actionLabel: messages.actions.start,
    };
  }

  if (item.type === "MISTAKE") {
    return {
      title: item.title,
      reason: messages.recentMistake,
      actionLabel: messages.actions.tryAgain,
    };
  }

  if (item.type === "DIALOGUE") {
    return {
      title: formatMessage(messages.dialogueTitle, {
        title: item.contentTitle ?? item.title.replace(/^Replay:\s*/u, ""),
      }),
      reason: item.sourceLessonTitle
        ? formatMessage(messages.dialogueReason, {
            lesson: item.sourceLessonTitle,
          })
        : item.reason,
      actionLabel: messages.actions.replay,
    };
  }

  return {
    title: item.title,
    reason: item.sourceLessonTitle
      ? formatMessage(messages.learnedIn, { lesson: item.sourceLessonTitle })
      : item.reason,
    actionLabel: messages.actions.review,
  };
}
