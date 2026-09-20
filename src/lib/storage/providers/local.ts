import {
  access,
  mkdir,
  readFile,
  readdir,
  writeFile,
  unlink,
} from "node:fs/promises";
import { dirname, join, normalize, relative, resolve } from "node:path";
import type { StorageProvider } from "@/lib/storage/provider";

const STORAGE_ROOT = process.env.HANGO_STORAGE_ROOT
  ? resolve(process.env.HANGO_STORAGE_ROOT)
  : join(process.cwd(), ".storage");

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
    try {
      await unlink(filePath);
    } catch (error) {
      // Deletion is intentionally idempotent, but real provider/filesystem
      // failures must reach the durable retry queue instead of being hidden.
      if (!isNodeError(error) || error.code !== "ENOENT") throw error;
    }
  }

  async list(prefix: string): Promise<string[]> {
    const prefixPath = resolveSafePath(prefix);
    const keys: string[] = [];

    async function walk(directory: string): Promise<void> {
      let entries;
      try {
        entries = await readdir(directory, { withFileTypes: true });
      } catch (error) {
        if (isNodeError(error) && error.code === "ENOENT") return;
        throw error;
      }

      for (const entry of entries) {
        const absolute = join(directory, entry.name);
        if (entry.isDirectory()) {
          await walk(absolute);
        } else if (entry.isFile()) {
          keys.push(relative(STORAGE_ROOT, absolute).replaceAll("\\", "/"));
        }
      }
    }

    await walk(prefixPath);
    return keys.sort();
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

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
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
