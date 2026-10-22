/** Private offline data artifact preparation only. No provider/DB imports. */
import { readFile, writeFile } from "node:fs/promises";
import { resolve, relative, isAbsolute } from "node:path";
import { prepareImportedJourneyQualityReview } from "../src/lib/journey-speaking-quality-import";

async function main() {
  const [file, attemptId, captureHash, snapshotHash, ...extra] =
    process.argv.slice(2);
  if (!file || !attemptId || !captureHash || !snapshotHash || extra.length)
    throw new Error(
      "Expected private input path, attempt ID and independently verified capture/snapshot hashes",
    );
  const root = resolve(process.cwd(), ".storage", "journey-quality-imports");
  const input = resolve(file);
  const scoped = relative(root, input);
  if (
    !scoped ||
    scoped.startsWith("..") ||
    isAbsolute(scoped) ||
    !input.endsWith(".json")
  )
    throw new Error("Input must be a private quality-import artifact");
  const content = await readFile(input, "utf8");
  if (content.length > 500000) throw new Error("Input is too large");
  const prepared = prepareImportedJourneyQualityReview(JSON.parse(content), {
    attemptId,
    captureHash,
    snapshotHash,
  });
  // Generated artifact, exclusive creation; never overwrite the source or DB.
  await writeFile(`${input}.prepared.json`, JSON.stringify(prepared), {
    flag: "wx",
    mode: 0o600,
  });
  console.log(JSON.stringify(prepared.receipt));
}
main().catch(() => {
  console.error(
    "Private preparation failed; no provider or database operation was executed. Check pins, source and existing artifact privately.",
  );
  process.exitCode = 1;
});
