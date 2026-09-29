"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/states";
import { reportClientError } from "@/lib/client-error-reporting";

export default function LearningJourneyError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError("react_boundary", error);
  }, [error]);

  return (
    <ErrorState
      headingLevel="h1"
      title="Couldn't load your learning journey"
      description="Something went wrong while loading your scenarios. Please try again."
      onRetry={reset}
    />
  );
}
