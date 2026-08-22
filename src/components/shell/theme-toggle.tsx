"use client";

import { useSyncExternalStore } from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import {
  THEME_COOKIE_NAME,
  isThemePreference,
  type ThemePreference,
} from "@/lib/theme";
import { cn } from "@/lib/cn";

const OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

/**
 * Theme toggle (2026-08-21) - reads/writes a plain cookie directly, no
 * server action, so switching feels instant, while `app/layout.tsx` reads
 * the same cookie server-side for a correct first paint - no flash of the
 * wrong theme, no `next-themes` dependency needed (every route here is
 * already dynamic/DB-backed per request, so a plain cookie read beats what
 * a client-side library can offer - see
 * project/learning-journey-optimization.md).
 *
 * Sync'd via `useSyncExternalStore`, same shape as
 * `lesson-display-prefs.tsx`'s established pattern for this exact
 * problem: the server-rendered HTML always assumes "system" (this
 * component has no server-side cookie access of its own - only the root
 * layout does) and the client reconciles to the real stored value right
 * after hydration, instead of a raw setState-in-effect.
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

function writeTheme(next: ThemePreference): void {
  cachedTheme = next;
  applyThemeAttribute(next);
  document.cookie = `${THEME_COOKIE_NAME}=${next}; path=/; max-age=31536000; SameSite=Lax`;
  listeners.forEach((listener) => listener());
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

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const ActiveIcon =
    OPTIONS.find((option) => option.value === theme)?.icon ?? Monitor;

  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger asChild>
        <IconButton
          icon={<ActiveIcon className="size-5" aria-hidden="true" />}
          aria-label="Change theme"
        />
      </DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          align="end"
          sideOffset={6}
          className="z-50 min-w-40 overflow-hidden rounded-card border border-border bg-surface p-1 shadow-elevated"
        >
          {OPTIONS.map((option) => {
            const Icon = option.icon;
            const isActive = option.value === theme;
            return (
              <DropdownMenuPrimitive.Item
                key={option.value}
                onSelect={() => writeTheme(option.value)}
                className={cn(
                  "flex cursor-default items-center gap-2 rounded-control px-3 py-2 font-interface text-body text-text-primary outline-none",
                  "data-[highlighted]:bg-elevated",
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                <span className="flex-1">{option.label}</span>
                {isActive && (
                  <Check
                    className="size-4 text-primary-500"
                    aria-hidden="true"
                  />
                )}
              </DropdownMenuPrimitive.Item>
            );
          })}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}
