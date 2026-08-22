import "server-only";
import { LocalStorageProvider } from "@/lib/storage/providers/local";
import type { StorageProvider } from "@/lib/storage/provider";

let cached: StorageProvider | undefined;

/**
 * The one place that decides which `StorageProvider` the rest of the app
 * talks to - same pattern as src/lib/ai/index.ts. Always `LocalStorageProvider`
 * for now (no cloud storage account configured yet); swapping in a real S3/
 * Blob-style provider later is a one-file change here, not a rewrite of
 * every caller.
 */
export function getStorageProvider(): StorageProvider {
  cached ??= new LocalStorageProvider();
  return cached;
}

export * from "@/lib/storage/provider";
