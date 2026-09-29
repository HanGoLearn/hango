import { BlobNotFoundError, del, get, head, list, put } from "@vercel/blob";
import type { StorageProvider } from "@/lib/storage/provider";
import { normalizeStorageKey } from "@/lib/storage/key";

/** Private Vercel Blob storage. Database rows keep only provider-relative keys. */
export class VercelBlobStorageProvider implements StorageProvider {
  readonly name = "vercel-blob";

  constructor(private readonly token: string) {
    if (!token) {
      throw new Error(
        "BLOB_READ_WRITE_TOKEN is required for the vercel-blob storage provider.",
      );
    }
  }

  async upload(
    key: string,
    data: Buffer,
    contentType: string,
  ): Promise<string> {
    const pathname = normalizeStorageKey(key);
    const result = await put(pathname, data, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType,
      multipart: data.byteLength > 4 * 1024 * 1024,
      token: this.token,
    });
    return result.pathname;
  }

  async getUrl(key: string): Promise<string> {
    const pathname = normalizeStorageKey(key);
    const encodedPath = pathname
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/");
    return `/api/audio/${encodedPath}`;
  }

  async download(key: string): Promise<Buffer> {
    const pathname = normalizeStorageKey(key);
    const result = await get(pathname, {
      access: "private",
      token: this.token,
      useCache: false,
    });

    if (!result || result.statusCode !== 200 || !result.stream) {
      throw new BlobNotFoundError();
    }

    return Buffer.from(await new Response(result.stream).arrayBuffer());
  }

  async delete(key: string): Promise<void> {
    await del(normalizeStorageKey(key), { token: this.token });
  }

  async list(prefix: string): Promise<string[]> {
    const safePrefix = normalizeStorageKey(prefix);
    const keys: string[] = [];
    let cursor: string | undefined;

    do {
      const page = await list({
        prefix: safePrefix,
        cursor,
        token: this.token,
      });
      keys.push(...page.blobs.map((blob) => blob.pathname));
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);

    return keys.sort();
  }

  async exists(key: string): Promise<boolean> {
    try {
      await head(normalizeStorageKey(key), { token: this.token });
      return true;
    } catch (error) {
      if (error instanceof BlobNotFoundError) return false;
      throw error;
    }
  }
}
