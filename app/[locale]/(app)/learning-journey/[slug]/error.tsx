"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/states";
import { reportClientError } from "@/lib/client-error-reporting";

export default function ScenarioDetailError({
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
      title="Couldn't load this scenario"
      description="Something went wrong while loading this scenario. Please try again."
      onRetry={reset}
    />
  );
}
