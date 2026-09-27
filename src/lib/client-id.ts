/**
 * `crypto.randomUUID()` only exists in a secure context - HTTPS, or
 * localhost. It is undefined when the app is opened over plain HTTP on a
 * LAN address, which is exactly how a phone reaches a local dev server
 * during mobile QA, and calling it there throws.
 *
 * These ids are opaque correlation handles (an activity-tracking session,
 * a client-side list key), never anything security-bearing, so falling back
 * to `crypto.getRandomValues` - and, failing that, to `Math.random` - is a
 * degradation in id quality nothing here depends on, not in safety.
 */
export function randomId(): string {
  if (typeof crypto !== "undefined") {
    if (typeof crypto.randomUUID === "function") return crypto.randomUUID();

    if (typeof crypto.getRandomValues === "function") {
      const bytes = crypto.getRandomValues(new Uint8Array(16));
      return Array.from(bytes, (byte) =>
        byte.toString(16).padStart(2, "0"),
      ).join("");
    }
  }

  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
}
