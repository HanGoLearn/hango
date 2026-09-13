"use client";

import { ErrorState } from "@/components/ui/states";

export default function LearningJourneyError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      headingLevel="h1"
      title="Couldn't load your learning journey"
      description="Something went wrong while loading your scenarios. Please try again."
      onRetry={reset}
    />
  );
}
