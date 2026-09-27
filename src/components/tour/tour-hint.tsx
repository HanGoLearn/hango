"use client";

import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { HanAvatar } from "@/components/ui/han-mascot";
import { useTour } from "@/components/tour/tour-provider";
import { resolveHintForPath } from "@/components/tour/tour-hints";
import { pathWithoutLocale } from "@/i18n/config";
import type { AppMessages } from "@/i18n/messages/types";

/**
 * The standalone section explanation (2026-09-23, stage 5) - deliberately
 * the quieter sibling of a tour card.
 *
 * No scrim, no cutout, no progress dots, and Han at 32px rather than 44:
 * this is a note, not a step in a sequence. Ten of these carrying the same
 * weight as the guided walkthrough would stop reading as a teacher and
 * start reading as nagging.
 *
 * It never shows while the tour itself is running - being handed a hint
 * about the page Han is already standing on would be absurd - and never for
 * a section the optional second leg already covered, which is what the
 * shared `seenHints` list is for.
 */
export function TourHint({ messages }: { messages: AppMessages["tour"] }) {
  const pathname = usePathname();
  const { seenHints, markHintSeen, step } = useTour();

  const hint = resolveHintForPath(pathWithoutLocale(pathname));
  if (!hint) return null;
  if (step) return null;
  if (seenHints.includes(hint.id)) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[44] mx-auto w-[calc(100%-2rem)] max-w-[380px] md:bottom-6"
    >
      <div className="flex items-start gap-3 rounded-panel border border-border-strong bg-surface p-3.5 shadow-modal">
        <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-500/15">
          <HanAvatar pose="curious" size={32} />
        </span>
        <div className="flex min-w-0 flex-col gap-2">
          <p className="font-interface text-supporting leading-relaxed text-text-primary">
            {hint.body(messages)}
          </p>
          <Button
            type="button"
            variant="tertiary"
            className="self-start px-0 font-semibold text-accent-300"
            onClick={() => markHintSeen(hint.id)}
          >
            {messages.common.gotIt}
          </Button>
        </div>
      </div>
    </div>
  );
}
