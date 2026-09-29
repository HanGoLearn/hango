import "server-only";
import { serverEnv } from "@/lib/env/server";
import { LocalStorageProvider } from "@/lib/storage/providers/local";
import { VercelBlobStorageProvider } from "@/lib/storage/providers/vercel-blob";
import type { StorageProvider } from "@/lib/storage/provider";

let cached: StorageProvider | undefined;

/**
 * The one place that decides which `StorageProvider` the rest of the app
 * talks to - same pattern as src/lib/ai/index.ts. Development and tests use
 * local disk. Production defaults to private Vercel Blob and fails closed if
 * its server-only token is missing, so an ephemeral production filesystem can
 * never look healthy by accident.
 */
export function getStorageProvider(): StorageProvider {
  if (cached) return cached;

  const providerName =
    serverEnv.HANGO_STORAGE_PROVIDER ??
    (serverEnv.NODE_ENV === "production" ? "vercel-blob" : "local");

  if (serverEnv.NODE_ENV === "production" && providerName === "local") {
    throw new Error(
      "Local storage is not allowed in production. Configure the private vercel-blob provider.",
    );
  }

  if (providerName === "vercel-blob") {
    cached = new VercelBlobStorageProvider(
      serverEnv.BLOB_READ_WRITE_TOKEN,
      serverEnv.BLOB_STORE_ID,
    );
  } else {
    cached = new LocalStorageProvider();
  }

  return cached;
}

export * from "@/lib/storage/provider";
