"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { useAiTeacher } from "@/components/ai-teacher/ai-teacher-provider";
import { HanAvatar } from "@/components/ui/han-mascot";
import { cn } from "@/lib/cn";
import { pathWithoutLocale } from "@/i18n/config";

// Dynamically loaded, ssr:false (2026-09-08 optimization pass) - this
// bubble is unconditionally part of AppShell (every authenticated page),
// but AiTeacherChat statically imports HanVoiceConversation (~1980 lines
// plus ~10 more voice/WebRTC modules) whether or not the learner ever opens
// Han. Radix's Dialog.Content isn't mounted while `open` is false, so this
// chunk is only fetched the first time the learner actually opens the
// bubble, not on every page load.
const AiTeacherChat = dynamic(
  () =>
    import("@/components/ai-teacher/ai-teacher-chat").then(
      (mod) => mod.AiTeacherChat,
    ),
  { ssr: false },
);

/**
 * Single floating entry point for Han, identical on every screen size
 * (2026-08-21 "floating bubble" redesign - replaces the old desktop docked
 * side panel + separate mobile bottom drawer). The docked panel reserved
 * ~400px of the content column on desktop even collapsed (a 56px icon
 * strip), competing with the lesson/dashboard content design_system.md
 * says should stay the visual priority; this floats over the page instead
 * of pushing it, and needs one open/close model instead of two.
 *
 * `modal={false}` deliberately - Han is a chat widget the learner can glance
 * past, not a page-blocking dialog. No Overlay/scrim is rendered for the
 * same reason: the page stays fully visible and interactive behind the
 * floating card on every breakpoint, including mobile.
 */
export function AiTeacherBubble() {
  const { open, setOpen, openTeacher } = useAiTeacher();
  const pathname = usePathname();
  const hiddenForHanRoute = Boolean(
    pathname && pathWithoutLocale(pathname).startsWith("/han"),
  );

  useEffect(() => {
    // Do not merely hide an open Tutor dialog while a standalone Han product
    // owns the screen. Close it so it cannot reappear with stale/shared state
    // as soon as the learner leaves Companion, Tutor page, or Vocabulary.
    if (hiddenForHanRoute) setOpen(false);
  }, [hiddenForHanRoute, setOpen]);

  // The /han page (2026-08-31) already gives Han Tutor and Han Companion
  // their own full-page surfaces, both driven by this same shared
  // `open`/`mode`/`context` state - showing the floating trigger there too
  // would pop a second, redundant Han panel over the first.
  if (hiddenForHanRoute) return null;

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (next) void openTeacher();
        else setOpen(false);
      }}
      modal={false}
    >
      <DialogPrimitive.Trigger
        aria-label="Open Han"
        data-activity-surface="HAN_TUTOR"
        data-tour-id="han-bubble"
        className="fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 size-14 rounded-full shadow-modal transition-transform duration-fast ease-standard hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 md:bottom-4"
      >
        {/* Fills the trigger edge-to-edge (2026-08-21) - previously a
            smaller 44px avatar centered inside a 56px bg-primary-500
            button, leaving a visible red ring around Han instead of just
            showing Han himself. */}
        <HanAvatar pose="idle" size={56} />
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          data-activity-surface="HAN_TUTOR"
          onInteractOutside={(event) => {
            // Han is part of the persistent app shell. A navigation click is
            // intentionally allowed to reach the page behind this non-modal
            // panel, but it must not dismiss the conversation as a side
            // effect. The explicit X, bubble trigger, and Escape key remain
            // the deliberate ways to close it.
            event.preventDefault();
          }}
          className={cn(
            "fixed z-50 flex flex-col overflow-hidden rounded-panel border border-border bg-surface shadow-modal focus:outline-none",
            // Mobile: near-full-screen floating card (small viewports can't
            // fit a compact anchored card usefully) - clears TopBar above
            // and the trigger bubble + BottomNav below.
            "top-[calc(5rem+env(safe-area-inset-top))] right-3 bottom-[calc(6rem+env(safe-area-inset-bottom))] left-3",
            // sm+: compact card anchored above the trigger bubble, same
            // position/behavior all the way up through desktop - one
            // interaction model, not a desktop-vs-mobile split.
            "sm:top-auto sm:right-4 sm:bottom-24 sm:left-auto sm:h-[32rem] sm:max-h-[70vh] sm:w-96 xl:w-[26rem]",
          )}
        >
          <div className="flex items-center justify-between border-b border-border p-4">
            <div className="flex items-center gap-2">
              <HanAvatar pose="idle" size={22} />
              <DialogPrimitive.Title className="font-interface text-card-title font-semibold text-text-primary">
                Han
              </DialogPrimitive.Title>
            </div>
            <DialogPrimitive.Close
              aria-label="Close Han"
              className="-m-2 rounded-control p-3.5 text-text-secondary hover:bg-elevated hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
            >
              <X className="size-4" aria-hidden="true" />
            </DialogPrimitive.Close>
          </div>
          <DialogPrimitive.Description className="sr-only">
            Chat with Han about your current lesson.
          </DialogPrimitive.Description>
          <div className="min-h-0 flex-1 p-4">
            <AiTeacherChat rolePlayEnabled={false} />
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
