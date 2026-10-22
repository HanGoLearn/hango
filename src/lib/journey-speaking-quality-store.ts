import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

/** Private development ledger. Never use public/, expose raw files through an
 * endpoint, remove a claim automatically, or use this as serverless storage. */
export function createLocalJourneyQualityStore(root: string) {
  const directory = resolve(root);
  function path(key: string, file: string) {
    if (!/^[a-f0-9]{64}$/.test(key))
      throw new Error("Invalid quality review key");
    return join(directory, key, file);
  }
  async function write(key: string, file: string, value: unknown) {
    await writeFile(path(key, file), JSON.stringify(value), {
      flag: "wx",
      mode: 0o600,
    });
  }
  async function read(
    key: string,
    file: string,
    limit: number,
  ): Promise<unknown | null> {
    try {
      const content = await readFile(path(key, file), "utf8");
      if (content.length > limit)
        throw new Error("Quality review file exceeds its read limit");
      return JSON.parse(content);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  }
  return {
    async claim(key: string, metadata: unknown) {
      const target = path(key, "claim.json");
      await mkdir(join(directory, key), { recursive: true, mode: 0o700 });
      try {
        await writeFile(target, JSON.stringify(metadata), {
          flag: "wx",
          mode: 0o600,
        });
        return true;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "EEXIST") return false;
        throw error;
      }
    },
    saveResponse: (key: string, value: unknown) =>
      write(key, "response.json", value),
    saveInspection: (key: string, value: unknown) =>
      write(key, "inspection.json", value),
    saveSummary: (key: string, value: unknown) =>
      write(key, "summary.json", value),
    readSummary: (key: string) => read(key, "summary.json", 4_000),
    readClaim: (key: string) => read(key, "claim.json", 4_000),
    readResponse: (key: string) => read(key, "response.json", 500_000),
  };
}

export const localJourneyQualityStore = createLocalJourneyQualityStore(
  join(process.cwd(), ".storage", "journey-quality-reviews"),
);
