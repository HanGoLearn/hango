"use client";

import { ErrorState } from "@/components/ui/states";

export default function LessonError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      headingLevel="h1"
      title="Couldn't load this lesson"
      description="Something went wrong while loading this lesson. Please try again."
      onRetry={reset}
    />
  );
}
