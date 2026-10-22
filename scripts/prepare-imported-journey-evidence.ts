/** Offline preparation only. No provider, secrets, environment or DB imports. */
import { readFile, writeFile } from "node:fs/promises";
import { resolve, relative, isAbsolute } from "node:path";
import { prepareImportedJourneyQualityReview } from "../src/lib/journey-speaking-quality-import";
async function main() {
  const [file, attemptId, captureHash, snapshotHash, ...extra] =
    process.argv.slice(2);
  if (!file || !attemptId || !captureHash || !snapshotHash || extra.length)
    throw new Error("Private path and identity pins required");
  const path = resolve(file),
    scoped = relative(resolve(".storage/journey-quality-imports"), path);
  if (
    !scoped ||
    scoped.startsWith("..") ||
    isAbsolute(scoped) ||
    !path.endsWith(".json")
  )
    throw new Error("Private path required");
  const content = await readFile(path, "utf8");
  if (content.length > 500000) throw new Error("Oversized artifact");
  const prepared = prepareImportedJourneyQualityReview(
    JSON.parse(content),
    { attemptId, captureHash, snapshotHash },
    "evidence",
  );
  await writeFile(
    `${path}.prepared-evidence.json`,
    JSON.stringify({ request: prepared.request, receipt: prepared.receipt }),
    { flag: "wx", mode: 0o600 },
  );
  const payload = JSON.parse(prepared.request.input);
  console.log(
    JSON.stringify({
      promptVersion: prepared.request.promptVersion,
      learnerFragments: payload.turns.length,
      partnerFragments: payload.partnerContext.length,
      schemaBytes: Buffer.byteLength(
        JSON.stringify(prepared.request.responseFormat.schema),
      ),
      requestBytes: Buffer.byteLength(JSON.stringify(prepared.request)),
      paidDispatches: 0,
      databaseWrites: 0,
      readyForPaidDispatch: false,
    }),
  );
}
main().catch(() => {
  console.error(
    "Offline evidence preparation stopped; no provider or database operations.",
  );
  process.exitCode = 1;
});
