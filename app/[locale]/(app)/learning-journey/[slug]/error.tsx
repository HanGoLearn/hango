"use client";

import { ErrorState } from "@/components/ui/states";

export default function ScenarioDetailError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      headingLevel="h1"
      title="Couldn't load this scenario"
      description="Something went wrong while loading this scenario. Please try again."
      onRetry={reset}
    />
  );
}
