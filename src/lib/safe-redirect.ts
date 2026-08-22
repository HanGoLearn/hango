/**
 * Only allows same-origin relative paths as a redirect target. A raw
 * `callbackUrl` query param must never be trusted directly — accepting an
 * absolute URL (or a protocol-relative "//evil.com") would be an open
 * redirect, a classic login-flow vulnerability.
 */
export function getSafeRedirectPath(
  path: string | undefined | null,
  fallback: string,
): string {
  if (!path) return fallback;
  if (!path.startsWith("/")) return fallback;
  if (path.startsWith("//")) return fallback;
  return path;
}
