"use client";

import { ErrorState } from "@/components/ui/states";
import { useLessonMessages } from "@/components/lesson/lesson-messages";

export default function LessonError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const messages = useLessonMessages();
  return (
    <ErrorState
      headingLevel="h1"
      title={messages.loadErrorTitle}
      description={messages.loadErrorDescription}
      onRetry={reset}
    />
  );
}
