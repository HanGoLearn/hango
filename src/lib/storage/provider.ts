/**
 * Storage Provider Abstraction (docs/03_engineering/storage.md - provider-
 * agnostic, backend-mediated, DB stores metadata/keys only, never blobs).
 * Business logic never touches a specific storage vendor directly.
 */
export interface StorageProvider {
  readonly name: string;
  /** Returns the storage key to persist in the database (not a public URL). */
  upload(key: string, data: Buffer, contentType: string): Promise<string>;
  /** A URL the current request can use to fetch the file - may be signed/temporary depending on the provider. */
  getUrl(key: string): Promise<string>;
  /** Raw file bytes, for server-side processing (e.g. merging several audio clips into one). */
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  /** Whether a file already exists at this key - lets content-addressed callers (see audio-content-key.ts) skip a paid regeneration when the content was already generated under a previous database row. */
  exists(key: string): Promise<boolean>;
}
