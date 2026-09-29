"use client";

const reported = new Set<string>();

function safeName(error: unknown): string {
  if (
    error instanceof Error &&
    /^[A-Za-z][A-Za-z0-9]{0,39}$/.test(error.name)
  ) {
    return error.name;
  }
  return "Error";
}

function safeDigest(error: unknown): string | undefined {
  if (!(error instanceof Error) || !("digest" in error)) return undefined;
  const digest = Reflect.get(error, "digest");
  return typeof digest === "string" && /^[A-Za-z0-9_-]{1,100}$/.test(digest)
    ? digest
    : undefined;
}

/** Reports only an error class and pathname—never message, stack, or user data. */
export function reportClientError(
  kind: "window_error" | "unhandled_rejection" | "react_boundary",
  error: unknown,
): void {
  if (typeof window === "undefined") return;
  const payload = {
    kind,
    path: window.location.pathname,
    errorName: safeName(error),
    digest: safeDigest(error),
  };
  const key = JSON.stringify(payload);
  if (reported.has(key)) return;
  reported.add(key);

  void fetch("/api/operations/client-error", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: key,
    credentials: "same-origin",
    keepalive: true,
  }).catch(() => undefined);
}
