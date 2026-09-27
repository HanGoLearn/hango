"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import {
  stepsForLeg,
  type TourLeg,
  type TourStep,
} from "@/components/tour/tour-steps";
import {
  completeTourAction,
  markTourHintsSeenAction,
  skipTourAction,
} from "@/lib/actions/tour";
import { pathWithoutLocale } from "@/i18n/config";

export interface TourContextValue {
  /** Null while nothing is running. */
  step: TourStep | null;
  leg: TourLeg | null;
  /** 0-based within the active leg; -1 when closed. */
  stepIndex: number;
  totalSteps: number;
  start: () => void;
  next: () => void;
  back: () => void;
  /** Leaves without finishing. */
  skip: () => void;
  /** From the first leg's last card: take the optional walk through the app. */
  startSections: () => void;
  /** From the first leg's last card: decline the walk and go study. */
  finishWelcome: () => void;
  /** Sections already explained, by either mechanism. */
  seenHints: string[];
  /** Records one, so its standalone hint never repeats it. */
  markHintSeen: (hintId: string) => void;
}

const TourContext = createContext<TourContextValue | null>(null);

export function useTour(): TourContextValue {
  const value = useContext(TourContext);
  if (!value) {
    throw new Error("useTour must be used inside a TourProvider");
  }
  return value;
}

/** Never changes after load, so nothing to subscribe to. */
const noopSubscribe = () => () => {};

/**
 * Whether this page load asked for the tour. Read through
 * `useSyncExternalStore` rather than an effect: the query string is
 * external state that exists before React renders, and reading it this way
 * keeps the server snapshot (`false`) honest instead of setting state after
 * mount and re-rendering. `window.location` rather than `useSearchParams`
 * so the shell that wraps every authenticated page doesn't inherit a
 * Suspense boundary requirement.
 */
function useTourRequested(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => new URLSearchParams(window.location.search).get("tour") === "1",
    () => false,
  );
}

interface TourPosition {
  leg: TourLeg;
  index: number;
}

export function TourProvider({
  children,
  autoStart = false,
  initialSeenHints = [],
}: {
  children: ReactNode;
  /**
   * True only for a learner who finished onboarding, hasn't studied yet and
   * has neither completed nor skipped the tour - see `resolveTourState`.
   */
  autoStart?: boolean;
  initialSeenHints?: string[];
}) {
  const requested = useTourRequested();
  const pathname = usePathname();
  // Null means the learner hasn't moved yet, so the opening position still
  // comes from the trigger below.
  const [position, setPosition] = useState<TourPosition | null>(null);
  const [closed, setClosed] = useState(false);
  const [seenHints, setSeenHints] = useState<string[]>(initialSeenHints);

  // Every step of the first leg points at something on the dashboard, so
  // the tour must not open by itself anywhere else - a learner who lands
  // straight on a lesson would otherwise get a card pointing at a streak
  // strip that isn't on the page. `?tour=1` stays unconditional: it is a
  // deliberate request, and its own fallback already centres the card.
  const onDashboard = pathWithoutLocale(pathname) === "/dashboard";
  const opensItself = !closed && (requested || (autoStart && onDashboard));
  const rawPosition = useMemo<TourPosition | null>(
    () => position ?? (opensItself ? { leg: "welcome", index: 0 } : null),
    [position, opensItself],
  );

  const currentPath = pathWithoutLocale(pathname);

  /**
   * Arriving somewhere is what finishes a step that asked the learner to go
   * there. Derived rather than pushed into state from an effect: the route
   * already is the source of truth, so re-deriving is both simpler and free
   * of the render-then-correct flicker a state update would cause.
   */
  const active = useMemo<TourPosition | null>(() => {
    if (!rawPosition) return null;
    const legSteps = stepsForLeg(rawPosition.leg);
    let index = rawPosition.index;
    while (index < legSteps.length && legSteps[index]?.route === currentPath) {
      index += 1;
    }
    return index === rawPosition.index
      ? rawPosition
      : { leg: rawPosition.leg, index };
  }, [rawPosition, currentPath]);

  // Persist the route-driven advance for the next navigation. The current
  // render already shows the derived step, so the state synchronization is
  // deferred to a microtask instead of forcing a cascading effect render.
  useEffect(() => {
    if (!rawPosition || !active) return;
    if (rawPosition.leg !== active.leg || active.index <= rawPosition.index) {
      return;
    }
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setPosition(active);
    });
    return () => {
      cancelled = true;
    };
  }, [active, rawPosition]);

  const steps = active ? stepsForLeg(active.leg) : [];
  const step = active ? (steps[active.index] ?? null) : null;

  const close = useCallback(() => {
    setPosition(null);
    setClosed(true);

    // A replay launched from Settings arrives as `?tour=1`. Once the
    // learner closes that replay, leaving the flag in the address would
    // start it again after a refresh even though the server already knows
    // it was completed or skipped. Preserve every unrelated query value
    // and the hash while removing only this one-shot trigger.
    const url = new URL(window.location.href);
    if (url.searchParams.has("tour")) {
      url.searchParams.delete("tour");
      window.history.replaceState(
        window.history.state,
        "",
        `${url.pathname}${url.search}${url.hash}`,
      );
    }
  }, []);

  const start = useCallback(() => {
    setClosed(false);
    setPosition({ leg: "welcome", index: 0 });
  }, []);

  const skip = useCallback(() => {
    close();
    void skipTourAction();
  }, [close]);

  const finishWelcome = useCallback(() => {
    close();
    void completeTourAction();
  }, [close]);

  const markHintSeen = useCallback((hintId: string) => {
    setSeenHints((current) =>
      current.includes(hintId) ? current : [...current, hintId],
    );
    void markTourHintsSeenAction([hintId]);
  }, []);

  const startSections = useCallback(() => {
    // The first leg counts as done the moment its last card is answered,
    // either way - so abandoning the optional walk later never reopens it.
    void completeTourAction();
    setPosition({ leg: "sections", index: 0 });
  }, []);

  const next = useCallback(() => {
    if (!active) return;
    const legSteps = stepsForLeg(active.leg);
    const upcoming = legSteps[active.index + 1];
    if (upcoming) {
      // Deliberately does *not* record the section as explained: this is
      // the "move on without going there" escape, and a place the learner
      // skipped past should still get its own note when they finally open
      // it. Only arriving counts.
      setPosition({ leg: active.leg, index: active.index + 1 });
      return;
    }
    // Running off the end of the first leg is only reachable by keyboard
    // now that its last card branches; either way it means finished.
    if (active.leg === "welcome") {
      close();
      void completeTourAction();
      return;
    }
    close();
  }, [active, close]);

  const back = useCallback(() => {
    if (!active || active.index <= 0) return;
    setPosition({ leg: active.leg, index: active.index - 1 });
  }, [active]);

  /**
   * A section counts as explained when the learner is actually standing on
   * it - keyed off the route, never off how far the walk has advanced.
   * Advancing with "Next" skips a section *without* seeing it, and that
   * section must still get its own note the day they finally open it.
   */
  const arrivedHintId = useMemo(() => {
    if (active?.leg !== "sections") return null;
    const arrived = stepsForLeg("sections").find(
      (candidate) => candidate.route === currentPath,
    );
    return arrived?.hintId ?? null;
  }, [active?.leg, currentPath]);

  useEffect(() => {
    if (!arrivedHintId) return;
    // Local list follows the write rather than racing it.
    void Promise.resolve(markTourHintsSeenAction([arrivedHintId])).then(() => {
      setSeenHints((current) =>
        current.includes(arrivedHintId) ? current : [...current, arrivedHintId],
      );
    });
  }, [arrivedHintId]);

  const value = useMemo<TourContextValue>(
    () => ({
      step,
      leg: active?.leg ?? null,
      stepIndex: active?.index ?? -1,
      totalSteps: active ? stepsForLeg(active.leg).length : 0,
      start,
      next,
      back,
      skip,
      startSections,
      finishWelcome,
      seenHints,
      markHintSeen,
    }),
    [
      step,
      active,
      start,
      next,
      back,
      skip,
      startSections,
      finishWelcome,
      seenHints,
      markHintSeen,
    ],
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}
