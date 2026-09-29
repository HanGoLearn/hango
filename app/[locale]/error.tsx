"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { reportClientError } from "@/lib/client-error-reporting";

export default function LocalizedError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams<{ locale?: string }>();
  const spanish = params.locale !== "en";

  useEffect(() => {
    reportClientError("react_boundary", error);
  }, [error]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-page px-5 py-12 text-text-primary">
      <div role="alert" className="max-w-lg text-center">
        <p className="font-interface text-caption font-semibold uppercase tracking-[0.12em] text-primary-400">
          HanGo
        </p>
        <h1 className="mt-2 font-display text-page-title font-semibold">
          {spanish ? "Algo no salió bien" : "Something went wrong"}
        </h1>
        <p className="mt-3 font-interface text-body text-text-secondary">
          {spanish
            ? "El problema quedó registrado de forma segura. Puedes intentarlo otra vez; si continúa, usa Feedback para contarnos qué estabas haciendo."
            : "The problem was recorded safely. You can try again; if it continues, use Feedback to tell us what you were doing."}
        </p>
        <Button className="mt-6" onClick={reset}>
          {spanish ? "Intentar de nuevo" : "Try again"}
        </Button>
      </div>
    </main>
  );
}
