import { access, mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import { dirname, join, normalize, relative } from "node:path";
import type { StorageProvider } from "@/lib/storage/provider";

const STORAGE_ROOT = join(process.cwd(), ".storage");

/**
 * Dev-only stand-in for real cloud storage (no S3/Blob provider configured
 * yet - same situation as the AI/TTS providers). Files live under a
 * gitignored `.storage/` directory at the project root; `getUrl` points at
 * an authenticated app route (src/app/api/audio/[...key]) rather than a
 * real signed URL, since there's no CDN in front of a local folder.
 */
export class LocalStorageProvider implements StorageProvider {
  readonly name = "local";

  async upload(
    key: string,
    data: Buffer,
    _contentType: string,
  ): Promise<string> {
    void _contentType;
    const filePath = resolveSafePath(key);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, data);
    return key;
  }

  async getUrl(key: string): Promise<string> {
    return `/api/audio/${key}`;
  }

  async download(key: string): Promise<Buffer> {
    return readFile(resolveSafePath(key));
  }

  async delete(key: string): Promise<void> {
    const filePath = resolveSafePath(key);
    await unlink(filePath).catch(() => undefined);
  }

  async exists(key: string): Promise<boolean> {
    try {
      await access(resolveSafePath(key));
      return true;
    } catch {
      return false;
    }
  }
}

/** Rejects any key that would resolve outside STORAGE_ROOT (e.g. via `..`). */
export function resolveSafePath(key: string): string {
  const filePath = normalize(join(STORAGE_ROOT, key));
  const rel = relative(STORAGE_ROOT, filePath);
  if (rel.startsWith("..") || rel === "") {
    throw new Error(`Unsafe storage key: ${key}`);
  }
  return filePath;
}

export { STORAGE_ROOT };
