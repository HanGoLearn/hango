"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionTitle, Body, Caption } from "@/components/ui/typography";
import { restartTourAction, restoreTourHintsAction } from "@/lib/actions/tour";
import { localePath, type AppLocale } from "@/i18n/config";
import type { TourMessages } from "@/i18n/messages/types";

type Acknowledged = "replay" | "hints" | null;

/**
 * Settings controls for the guided tour (2026-09-23, stage 6) - the only
 * way back in once a learner has finished or skipped it.
 *
 * Neither control does anything immediately visible, so each confirms
 * itself in place and says *when* it will happen. A button that clears a
 * flag and then looks exactly as it did before reads as broken.
 */
export function TourSection({
  messages,
  locale,
}: {
  messages: TourMessages;
  locale: AppLocale;
}) {
  const router = useRouter();
  const [acknowledged, setAcknowledged] = useState<Acknowledged>(null);
  const [pending, startTransition] = useTransition();

  function run(which: Exclude<Acknowledged, null>) {
    startTransition(async () => {
      if (which === "replay") {
        await restartTourAction();
        // A completed learner is intentionally excluded from automatic
        // startup. The query parameter is the explicit replay request.
        router.push(`${localePath(locale, "/dashboard")}?tour=1`);
        return;
      }
      await restoreTourHintsAction();
      setAcknowledged(which);
    });
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <SectionTitle>{messages.settings.title}</SectionTitle>
        <Body className="text-text-secondary">
          {messages.settings.description}
        </Body>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex flex-col gap-1">
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={() => run("replay")}
          >
            {acknowledged === "replay" && (
              <Check className="size-4" aria-hidden="true" />
            )}
            {acknowledged === "replay"
              ? messages.settings.done
              : messages.settings.replay}
          </Button>
          {acknowledged === "replay" && (
            <Caption className="text-text-muted">
              {messages.settings.replayHint}
            </Caption>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={() => run("hints")}
          >
            {acknowledged === "hints" && (
              <Check className="size-4" aria-hidden="true" />
            )}
            {acknowledged === "hints"
              ? messages.settings.done
              : messages.settings.restoreHints}
          </Button>
          {acknowledged === "hints" && (
            <Caption className="text-text-muted">
              {messages.settings.restoreHintsHint}
            </Caption>
          )}
        </div>
      </div>
    </section>
  );
}
