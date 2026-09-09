"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  isLearnerActivitySurface,
  resolveActivitySurface,
  type LearnerActivitySurface,
} from "@/lib/activity-surface";

const HEARTBEAT_MS = 15_000;
const RECENT_INTERACTION_MS = 60_000;
const SESSION_TIMEOUT_MS = 30 * 60_000;

interface SurfaceProgress {
  activeSeconds: number;
  interactionCount: number;
  sequence: number;
  lastInteractionAt: number;
  lastAccountedAt: number;
}

interface TrackerSession {
  id: string;
  startedAt: string;
  lastInteractionAt: number;
  surfaces: Partial<Record<LearnerActivitySurface, SurfaceProgress>>;
}

function createSession(): TrackerSession {
  return {
    id: crypto.randomUUID(),
    startedAt: new Date().toISOString(),
    lastInteractionAt: 0,
    surfaces: {},
  };
}

function progressFor(
  session: TrackerSession,
  surface: LearnerActivitySurface,
  now: number,
): SurfaceProgress {
  const existing = session.surfaces[surface];
  if (existing) return existing;
  const progress = {
    activeSeconds: 0,
    interactionCount: 0,
    sequence: 0,
    lastInteractionAt: now,
    lastAccountedAt: now,
  };
  session.surfaces[surface] = progress;
  return progress;
}

export function ActivityTracker() {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const routeSurfaceRef = useRef(resolveActivitySurface(pathname));
  const currentSurfaceRef = useRef(resolveActivitySurface(pathname));

  useEffect(() => {
    pathnameRef.current = pathname;
    routeSurfaceRef.current = resolveActivitySurface(pathname);
    currentSurfaceRef.current = routeSurfaceRef.current;
  }, [pathname]);

  useEffect(() => {
    let trackerSession = createSession();

    function sendHeartbeat(allowHidden = false) {
      if (!allowHidden && document.visibilityState !== "visible") return;
      const now = Date.now();
      const surface = currentSurfaceRef.current;
      const progress = trackerSession.surfaces[surface];
      if (
        !progress ||
        now - progress.lastInteractionAt > RECENT_INTERACTION_MS
      ) {
        return;
      }

      const elapsedSeconds = Math.max(
        0,
        Math.min(
          HEARTBEAT_MS / 1000,
          Math.floor((now - progress.lastAccountedAt) / 1000),
        ),
      );
      progress.lastAccountedAt = now;
      progress.activeSeconds += elapsedSeconds;
      progress.sequence += 1;

      void fetch("/api/activity/heartbeat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          clientSessionId: trackerSession.id,
          surface,
          path: pathnameRef.current,
          startedAt: trackerSession.startedAt,
          activeSeconds: progress.activeSeconds,
          interactionCount: progress.interactionCount,
          sequence: progress.sequence,
        }),
        credentials: "same-origin",
        keepalive: true,
      }).catch(() => {
        // The next monotonic heartbeat carries the full cumulative totals,
        // so a transient network failure needs no duplicate-prone retry.
      });
    }

    function handleInteraction(event: Event) {
      const now = Date.now();
      if (
        trackerSession.lastInteractionAt > 0 &&
        now - trackerSession.lastInteractionAt > SESSION_TIMEOUT_MS
      ) {
        trackerSession = createSession();
      }

      const markedSurface =
        event.target instanceof Element
          ? event.target.closest<HTMLElement>("[data-activity-surface]")
              ?.dataset.activitySurface
          : undefined;
      currentSurfaceRef.current = isLearnerActivitySurface(markedSurface)
        ? markedSurface
        : routeSurfaceRef.current;

      const progress = progressFor(
        trackerSession,
        currentSurfaceRef.current,
        now,
      );
      if (now - progress.lastInteractionAt > RECENT_INTERACTION_MS) {
        progress.lastAccountedAt = now;
      }
      progress.lastInteractionAt = now;
      progress.interactionCount += 1;
      trackerSession.lastInteractionAt = now;
    }

    function handleVisibilityChange() {
      const progress = trackerSession.surfaces[currentSurfaceRef.current];
      if (document.visibilityState === "hidden") {
        sendHeartbeat(true);
      } else if (progress) {
        // Resume from now; hidden time is never added to engagement time.
        progress.lastAccountedAt = Date.now();
      }
    }

    function handlePageHide() {
      sendHeartbeat(true);
    }

    const interactionEvents = ["pointerdown", "keydown", "touchstart"];
    for (const eventName of interactionEvents) {
      document.addEventListener(eventName, handleInteraction, {
        capture: true,
        passive: true,
      });
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    const interval = window.setInterval(() => sendHeartbeat(), HEARTBEAT_MS);

    return () => {
      sendHeartbeat(true);
      window.clearInterval(interval);
      for (const eventName of interactionEvents) {
        document.removeEventListener(eventName, handleInteraction, true);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, []);

  return null;
}
