"use client";

import { useEffect, useSyncExternalStore } from "react";
import { HanAvatar } from "@/components/ui/han-mascot";
import { Body, Caption } from "@/components/ui/typography";
import type { DashboardMessages } from "@/i18n/messages/types";
import { formatMessage } from "@/i18n/format";

// Storage key kept as-is (not renamed to match levelLabel below) -
// invalidating it would just re-show this banner once to every existing
// learner for no real benefit.
const STORAGE_KEY = "hango:last-seen-hsk-level";

/**
 * Detects a tier level-up (General Level crossing a new threshold,
 * points-system.md's hskLevelForPoints) purely client-side - no new query,
 * no LearnerProfile column, just a remembered last-seen label compared
 * against the level the Dashboard already computed server-side. Same
 * useSyncExternalStore shape as lesson-display-prefs.tsx/theme-toggle.tsx:
 * the server (and the client's first paint, before hydration settles) can't
 * know what a returning learner last saw, so both must render "nothing"
 * until the real stored value resolves - a plain useState+useEffect here
 * hit the same react-hooks/set-state-in-effect lint failure this codebase
 * already worked around twice this pass.
 */
let cachedLastSeen: string | null | undefined;
const listeners = new Set<() => void>();

function readLastSeen(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function getSnapshot(): string | null {
  cachedLastSeen ??= readLastSeen();
  return cachedLastSeen;
}

/** Sentinel, distinct from `null` (genuinely "never seen before") - tells the render below to show nothing until the real client value resolves, so server and first client paint always agree. */
function getServerSnapshot(): string | undefined {
  return undefined;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function recordSeen(level: string) {
  cachedLastSeen = level;
  try {
    window.localStorage.setItem(STORAGE_KEY, level);
  } catch {
    // Private-mode/storage-disabled - degrades to showing the banner again next visit, harmless for a cosmetic one-liner.
  }
  listeners.forEach((listener) => listener());
}

export function LevelUpBanner({
  levelLabel,
  messages,
}: {
  levelLabel: string;
  messages?: DashboardMessages["levelUp"];
}) {
  const lastSeen = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const resolved = lastSeen !== undefined;
  const isLevelUp = resolved && lastSeen !== null && lastSeen !== levelLabel;

  useEffect(() => {
    if (resolved && lastSeen !== levelLabel) {
      recordSeen(levelLabel);
    }
  }, [resolved, lastSeen, levelLabel]);

  if (!isLevelUp) return null;

  return (
    <div className="flex items-center gap-3 rounded-panel bg-accent-500/15 p-4">
      <HanAvatar pose="heart" size={36} />
      <div className="flex flex-col gap-0.5">
        <Caption className="font-semibold uppercase tracking-wide text-accent-300">
          {messages?.label ?? "Level up"}
        </Caption>
        <Body>
          {messages
            ? formatMessage(messages.message, { level: levelLabel })
            : `You've reached ${levelLabel}`}
        </Body>
      </div>
    </div>
  );
}
