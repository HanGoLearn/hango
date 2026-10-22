/** Offline only: no provider, environment, database or metering imports. */
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve, relative, isAbsolute } from "node:path";
import { prepareImportedJourneyQualityReview } from "../src/lib/journey-speaking-quality-import";
import { JOURNEY_QUALITY_INSPECTION_VERSION } from "../src/lib/journey-speaking-quality-candidate";

function privatePath(file: string, folder: string) {
  const path = resolve(file),
    scope = relative(resolve(folder), path);
  if (
    !scope ||
    scope.startsWith("..") ||
    isAbsolute(scope) ||
    !path.endsWith(".json")
  )
    throw new Error("Private artifact path required");
  return path;
}
async function main() {
  const [file, responseFile, attemptId, captureHash, snapshotHash, ...extra] =
    process.argv.slice(2);
  if (
    !file ||
    !responseFile ||
    !attemptId ||
    !captureHash ||
    !snapshotHash ||
    extra.length
  )
    throw new Error(
      "Expected private export/response and independent identity pins",
    );
  const inputPath = privatePath(file, ".storage/journey-quality-imports");
  const responsePath = privatePath(
    responseFile,
    ".storage/journey-quality-import-reviews",
  );
  const [original, responseText] = await Promise.all([
    readFile(inputPath, "utf8"),
    readFile(responsePath, "utf8"),
  ]);
  if (original.length > 500000 || responseText.length > 500000)
    throw new Error("Oversized artifact");
  const prepared = prepareImportedJourneyQualityReview(JSON.parse(original), {
    attemptId,
    captureHash,
    snapshotHash,
  });
  const saved = JSON.parse(responseText);
  // Old prompt stays frozen. Only validation rules change; data must be identical.
  if (saved.request.input !== prepared.request.input)
    throw new Error("Frozen review data mismatch");
  const result = prepared.inspectResponse({
    status:
      saved.result.outputStatus === "complete"
        ? "completed"
        : saved.result.outputStatus === "refused"
          ? "refused"
          : "incomplete",
    text: saved.result.content,
  });
  const audit = {
    inspectionVersion: JOURNEY_QUALITY_INSPECTION_VERSION,
    originalResponseSha256: createHash("sha256")
      .update(responseText)
      .digest("hex"),
    originalPromptVersion: saved.request.promptVersion,
    inspectedAt: new Date().toISOString(),
    paidDispatches: 0,
    databaseWrites: 0,
    scoreChanged: false,
    result,
  };
  // New exclusive artifact, never overwrite the original judgment or rejection.
  await writeFile(
    `${responsePath}.${JOURNEY_QUALITY_INSPECTION_VERSION}.json`,
    JSON.stringify(audit),
    { flag: "wx", mode: 0o600 },
  );
  console.log(
    JSON.stringify({
      inspectionVersion: audit.inspectionVersion,
      state: result.state,
      issues:
        result.state === "REJECTED_CANDIDATE" ? result.inspection.issues : [],
      paidDispatches: 0,
      databaseWrites: 0,
      scoreChanged: false,
    }),
  );
}
main().catch(() => {
  console.error(
    "Offline inspection stopped; original artifacts remain unchanged. No AI or database operation.",
  );
  process.exitCode = 1;
});
