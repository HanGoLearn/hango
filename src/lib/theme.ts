/**
 * Shared theme-preference contract (2026-08-21) - used by both the server
 * read (`app/layout.tsx`) and the client write (`ThemeToggle`), so the
 * cookie name/shape can't drift between the two. "system" is stored
 * explicitly (not just "absence of cookie") so a learner who deliberately
 * picks "System" gets that recorded, distinct from a first-time visitor
 * who hasn't chosen anything yet - both currently render the same
 * (`prefers-color-scheme` fallback in globals.css, no `data-theme`
 * attribute), but keeping the distinction now costs nothing and avoids
 * conflating "no preference yet" with "explicitly wants to follow the OS."
 */
export const THEME_COOKIE_NAME = "hango-theme";

export type ThemePreference = "light" | "dark" | "system";

export function isThemePreference(
  value: string | undefined,
): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}
