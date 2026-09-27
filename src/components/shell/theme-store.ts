"use client";

import { useSyncExternalStore } from "react";
import {
  THEME_COOKIE_NAME,
  isThemePreference,
  type ThemePreference,
} from "@/lib/theme";

/**
 * Client-side theme preference store, extracted from ThemeToggle
 * (2026-09-20) so the onboarding appearance step can write the exact same
 * cookie through the exact same code path. Duplicating the cookie
 * read/write in a second component is how the two drift apart.
 *
 * Reads/writes a plain cookie directly, no server action, so switching
 * feels instant. The first-paint side reads this same cookie via a
 * `beforeInteractive` inline script (see root-document.tsx), which is what
 * avoids a flash of the wrong theme.
 *
 * Sync'd via `useSyncExternalStore`, same shape as `lesson-display-prefs`'s
 * established pattern: the server-rendered HTML always assumes "system"
 * (no server-side cookie access here) and the client reconciles to the
 * real stored value right after hydration, instead of a raw
 * setState-in-effect.
 */
let cachedTheme: ThemePreference | null = null;
const listeners = new Set<() => void>();

function readStoredTheme(): ThemePreference {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${THEME_COOKIE_NAME}=([^;]*)`),
  );
  const value = match ? decodeURIComponent(match[1] ?? "") : undefined;
  return isThemePreference(value) ? value : "system";
}

function getSnapshot(): ThemePreference {
  cachedTheme ??= readStoredTheme();
  return cachedTheme;
}

function getServerSnapshot(): ThemePreference {
  return "system";
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function applyThemeAttribute(theme: ThemePreference): void {
  const root = document.documentElement;
  if (theme === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", theme);
  }
}

export function setThemePreference(next: ThemePreference): void {
  cachedTheme = next;
  applyThemeAttribute(next);
  document.cookie = `${THEME_COOKIE_NAME}=${next}; path=/; max-age=31536000; SameSite=Lax`;
  listeners.forEach((listener) => listener());
}

export function useThemePreference(): ThemePreference {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// Live-updates "System" if the OS theme changes while the tab stays open.
// The CSS `prefers-color-scheme` fallback in globals.css already gets
// first load/reload right with zero JS; this only re-touches the
// `data-theme` attribute (removing it again, since it's already absent in
// "system" mode) so that same CSS fallback re-evaluates - registered once
// at module scope, not per-render.
if (typeof window !== "undefined") {
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
      if (getSnapshot() === "system") applyThemeAttribute("system");
    });
}
