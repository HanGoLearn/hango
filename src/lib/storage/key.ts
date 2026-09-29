import { posix } from "node:path";

/**
 * Normalizes an internal provider-relative key and rejects absolute paths,
 * traversal, empty values and NUL bytes before they reach any storage vendor.
 */
export function normalizeStorageKey(key: string): string {
  const forwardSlashes = key.replaceAll("\\", "/");
  const segments = forwardSlashes.split("/");

  if (
    forwardSlashes.length === 0 ||
    forwardSlashes.startsWith("/") ||
    forwardSlashes.includes("\0") ||
    segments.includes("..")
  ) {
    throw new Error(`Unsafe storage key: ${key}`);
  }

  const normalized = posix.normalize(forwardSlashes);
  if (normalized === "." || normalized.startsWith("../")) {
    throw new Error(`Unsafe storage key: ${key}`);
  }

  return normalized;
}
