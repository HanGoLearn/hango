"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useTour } from "@/components/tour/tour-provider";
import { TourCard } from "@/components/tour/tour-card";
import { cn } from "@/lib/cn";
import { formatMessage } from "@/i18n/format";
import type { AppMessages } from "@/i18n/messages/types";

/** Breathing room between the spotlit element and the card. */
const CARD_GAP = 12;
/** How far the cutout is inflated past the element's own box. */
const SPOTLIGHT_PAD = 6;
/** Keeps the card off the very edge of the screen on either side. */
const EDGE = 16;
/**
 * Only used for the very first paint of a step, before the card has been
 * measured. Every placement decision after that uses its real height.
 */
const ASSUMED_CARD_HEIGHT = 300;
/**
 * A smooth `scrollIntoView` keeps moving after it returns, so the anchor's
 * box is re-read for this long before settling.
 */
const SETTLE_MS = 800;

/**
 * First match with a real box, not simply the first match: the sidebar and
 * the bottom nav answer to the same anchor and exactly one of them is
 * `display: none` at any width. Taking the first would spotlight a 0x0 rect
 * in the top-left corner on whichever breakpoint lost.
 */
function findVisibleAnchor(anchorId: string): HTMLElement | null {
  if (typeof document === "undefined") return null;
  const candidates = document.querySelectorAll<HTMLElement>(
    `[data-tour-id="${anchorId}"]`,
  );
  for (const candidate of candidates) {
    const box = candidate.getBoundingClientRect();
    if (box.width > 0 && box.height > 0) return candidate;
  }
  return null;
}

/**
 * The tour's scrim, cutout and card placement (2026-09-23, stage 1).
 *
 * The cutout is one element sized to the anchor with a 9999px box-shadow:
 * everything outside it dims and the anchor itself is never covered, so no
 * mask, no four-rect scrim, and the real element stays tappable underneath.
 *
 * `z-45` puts the scrim over the bottom nav and Han's bubble (both `z-40`),
 * which is what makes the dimming look deliberate rather than half-applied.
 * An earlier pass kept it at `z-30` on the assumption that a scrim above
 * the bubble would hide the step that points at it - wrong: the cutout is
 * a transparent box, so whatever sits inside it shows through at full
 * brightness no matter what the scrim's z-index is. The card goes one above
 * at `z-46`, and Han's own open panel (`z-50`) still wins over both, so
 * tapping the bubble mid-tour shows Han rather than a dimmed Han.
 */
export function TourOverlay({ messages }: { messages: AppMessages["tour"] }) {
  const { step, stepIndex, totalSteps, skip } = useTour();
  // Keyed by anchor so a measurement from the previous step can never be
  // read for this one, not even for the frame before the next measure.
  const [measured, setMeasured] = useState<{
    anchorId: string;
    rect: DOMRect;
  } | null>(null);
  const restoreFocusTo = useRef<HTMLElement | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  // Measured rather than assumed (2026-09-23): two rounds of "it's above
  // when it should be below" and "it comes out cut off" both came from
  // guessing how tall this card is. A magic constant can only ever be
  // wrong for some copy length; the real number never is.
  const [cardHeight, setCardHeight] = useState(0);
  const isOpen = step !== null;
  const anchorId = step?.anchor ?? null;
  const shouldScroll = step?.scrollIntoView ?? false;
  // Measured state is only trusted for the anchor it was taken from. For a
  // step that just became current, the box is read here during render
  // instead of waiting for the effect's first frame - otherwise every
  // advance renders one frame as a centred card and then jumps to the
  // anchor, which reads as a flicker.
  const rect =
    anchorId === null
      ? null
      : measured?.anchorId === anchorId
        ? measured.rect
        : (findVisibleAnchor(anchorId)?.getBoundingClientRect() ?? null);

  useEffect(() => {
    if (!anchorId) return;

    let frame = 0;
    const measure = () => {
      const element = findVisibleAnchor(anchorId);
      setMeasured(
        element ? { anchorId, rect: element.getBoundingClientRect() } : null,
      );
    };

    const element = findVisibleAnchor(anchorId);
    if (element && shouldScroll) {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      element.scrollIntoView({
        block: "center",
        behavior: reduceMotion ? "auto" : "smooth",
      });
    }

    // Every measurement happens inside a frame callback or a listener,
    // never synchronously in this effect's body.
    const startedAt = performance.now();
    const track = () => {
      measure();
      if (performance.now() - startedAt < SETTLE_MS) {
        frame = requestAnimationFrame(track);
      }
    };
    frame = requestAnimationFrame(track);

    // `true` so scrolling inside the shell's own scroll container counts,
    // not just the window.
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [anchorId, shouldScroll]);

  // Observed, not read once: the card's height changes with the step's copy
  // and with a narrow screen rewrapping it. setState lives in the observer's
  // callback, never in this effect's body.
  const stepId = step?.id ?? null;
  useEffect(() => {
    const element = cardRef.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const measuredHeight = entries[0]?.contentRect.height ?? 0;
      setCardHeight((current) =>
        Math.abs(current - measuredHeight) < 1 ? current : measuredHeight,
      );
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [stepId]);

  // Captured once when the tour opens and restored once when it closes -
  // keyed on `isOpen`, never on the step, or every advance would yank focus
  // back out of the card the moment it arrived.
  useEffect(() => {
    if (isOpen) {
      restoreFocusTo.current = document.activeElement as HTMLElement | null;
      return;
    }
    restoreFocusTo.current?.focus?.();
    restoreFocusTo.current = null;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      skip();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, skip]);

  if (!step) return null;

  // No anchor, or an anchor that isn't on this screen: the card centres
  // itself rather than pointing at an empty patch of page.
  const centred = rect === null;

  /**
   * Placed by how much room each side of the anchor actually has, never by
   * where the anchor happens to sit (2026-09-23 fix).
   *
   * The previous rule flipped the card above whenever the anchor's bottom
   * passed 55% of the viewport - which, for a tall anchor like the home
   * hero or the words panel, put the card's *bottom* edge near the top of
   * the screen and pushed the rest of it out of view entirely. Measuring
   * the gaps instead means the card lands wherever it fits, and `maxHeight`
   * guarantees it stays inside the screen even when the copy is long: it
   * scrolls rather than overflowing.
   *
   * When an anchor is big enough to leave no usable gap either side, the
   * card stops flanking it and pins to the foot of the screen - readable,
   * and the cutout still shows what is being talked about.
   */
  const cardStyle: CSSProperties = { left: 0, right: 0 };
  let pinToFoot = false;

  if (centred) {
    cardStyle.top = "50%";
    cardStyle.transform = "translateY(-50%)";
  } else {
    const spaceBelow = window.innerHeight - rect.bottom - CARD_GAP - EDGE;
    const spaceAbove = rect.top - CARD_GAP - EDGE;
    const needed = cardHeight || ASSUMED_CARD_HEIGHT;

    if (needed <= spaceBelow) {
      // Below wins ties: reading downward from the thing being described is
      // the order the eye already expects.
      cardStyle.top = rect.bottom + CARD_GAP;
    } else if (needed <= spaceAbove) {
      cardStyle.bottom = window.innerHeight - rect.top + CARD_GAP;
    } else {
      // Fits neither side whole. Pinning to the foot gives it the full
      // height instead of squeezing it into a gap and letting it scroll -
      // a card with an inner scrollbar reads as broken, not as compact.
      pinToFoot = true;
      cardStyle.maxHeight = window.innerHeight - EDGE * 2;
      cardStyle.overflowY = "auto";
    }
  }

  const copy = step.copy(messages);

  return (
    <>
      {centred ? (
        <span
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[45]"
          style={{ background: "rgb(0 0 0 / 0.65)" }}
        />
      ) : (
        <span
          aria-hidden="true"
          className="pointer-events-none fixed z-[45] rounded-panel ring-2 ring-primary-500/50"
          style={{
            top: rect.top - SPOTLIGHT_PAD,
            left: rect.left - SPOTLIGHT_PAD,
            width: rect.width + SPOTLIGHT_PAD * 2,
            height: rect.height + SPOTLIGHT_PAD * 2,
            boxShadow: "0 0 0 9999px rgb(0 0 0 / 0.65)",
          }}
        />
      )}

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="false"
        aria-label={messages.common.ariaLabel}
        className={cn(
          "fixed z-[46] mx-auto w-[calc(100%-2rem)] max-w-[380px]",
          pinToFoot && "bottom-[calc(1rem+env(safe-area-inset-bottom))]",
        )}
        style={cardStyle}
      >
        <TourCard
          copy={copy}
          pose={step.pose}
          centred={centred}
          messages={messages}
        />
      </div>

      <span aria-live="polite" className="sr-only">
        {formatMessage(messages.common.progress, {
          current: stepIndex + 1,
          total: totalSteps,
        })}
      </span>
    </>
  );
}
