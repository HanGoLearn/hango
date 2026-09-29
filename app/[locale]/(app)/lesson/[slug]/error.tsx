"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/states";
import { useLessonMessages } from "@/components/lesson/lesson-messages";
import { reportClientError } from "@/lib/client-error-reporting";

export default function LessonError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const messages = useLessonMessages();

  // This boundary used to catch a real, silent bug (2026-09-26: a
  // double-tapped Continue racing a rejected duplicate submit - see
  // lesson-progress-data.ts) with nothing logged anywhere, so it read as
  // random. Logging whatever reaches here from now on is what makes the
  // next unrelated cause diagnosable instead of another guessing round.
  useEffect(() => {
    reportClientError("react_boundary", error);
  }, [error]);

  return (
    <>
      <ErrorState
        headingLevel="h1"
        title={messages.loadErrorTitle}
        description={messages.loadErrorDescription}
        onRetry={reset}
      />
      {/* Dev-only: surfaces the real error on screen instead of only in the
          browser console, so it can be read/screenshotted directly - added
          2026-09-26 after this boundary caught a recurring, otherwise
          undiagnosable "no pudimos cargar esta lección" in Grammar. Never
          renders in production (NODE_ENV check). */}
      {process.env.NODE_ENV === "development" && (
        <pre className="mx-auto mt-4 max-w-2xl overflow-auto rounded-control bg-elevated p-4 text-left text-supporting text-error-500">
          {error.name}: {error.message}
          {error.stack ? `\n\n${error.stack}` : ""}
        </pre>
      )}
    </>
  );
}
