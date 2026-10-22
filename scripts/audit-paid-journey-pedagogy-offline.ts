/** Only re-read a frozen, previously paid response. No key/env/provider/DB. */
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { isAbsolute, relative, resolve } from "node:path";
import { prepareImportedJourneyQualityReview } from "../src/lib/journey-speaking-quality-import";
import { JOURNEY_PEDAGOGY_AUDIT_VERSION } from "../src/lib/journey-speaking-quality-pedagogy";

const digest = (text: string) =>
  createHash("sha256").update(text).digest("hex");
function scoped(file: string, folder: string) {
  const path = resolve(file),
    part = relative(resolve(folder), path);
  if (
    !part ||
    part.startsWith("..") ||
    isAbsolute(part) ||
    !path.endsWith(".json")
  )
    throw new Error("Private artifact required");
  return path;
}
async function main() {
  let blockedNetworkAttempts = 0;
  globalThis.fetch = async () => {
    blockedNetworkAttempts++;
    throw new Error("OFFLINE_ONLY");
  };
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
  const paths = [
    scoped(file, ".storage/journey-quality-imports"),
    scoped(responseFile, ".storage/journey-quality-import-reviews"),
  ];
  const originals = await Promise.all(
    paths.map((path) => readFile(path, "utf8")),
  );
  if (originals.some((text) => text.length > 500000))
    throw new Error("Oversized artifact");
  const prepared = prepareImportedJourneyQualityReview(
    JSON.parse(originals[0]!),
    { attemptId, captureHash, snapshotHash },
    "evidence",
  );
  const saved = JSON.parse(originals[1]!);
  if (
    saved.request.input !== prepared.request.input ||
    saved.request.promptVersion !== prepared.request.promptVersion ||
    saved.request.instructions !== prepared.request.instructions ||
    JSON.stringify(saved.request.responseFormat) !==
      JSON.stringify(prepared.request.responseFormat) ||
    saved.result.outputStatus !== "complete"
  )
    throw new Error("Saved context/status mismatch");
  const result = prepared.inspectResponse({
    status: "completed",
    text: saved.result.content,
  });
  if (result.state !== "VALIDATED_CANDIDATE" || !result.pedagogy)
    throw new Error("Structurally valid evidence candidate required");
  const current = await Promise.all(
    paths.map((path) => readFile(path, "utf8")),
  );
  const originalsUnchanged = current.every(
    (text, index) => digest(text) === digest(originals[index]!),
  );
  if (!originalsUnchanged || blockedNetworkAttempts)
    throw new Error("Offline integrity failed");
  const audit = {
    version: JOURNEY_PEDAGOGY_AUDIT_VERSION,
    createdAt: new Date().toISOString(),
    originalSha256: originals.map(digest),
    originalsUnchanged,
    blockedNetworkAttempts,
    technicalState: result.state,
    pedagogy: result.pedagogy,
    originalLevelsPreserved: true,
    paidDispatches: 0,
    databaseWrites: 0,
    scoreChanged: false,
  };
  await writeFile(
    `${paths[1]}.${JOURNEY_PEDAGOGY_AUDIT_VERSION}.json`,
    JSON.stringify(audit),
    { flag: "wx", mode: 0o600 },
  );
  console.log(
    JSON.stringify({
      technicalState: result.state,
      decision: audit.pedagogy.decision,
      citedClearTurns: audit.pedagogy.coverage.citedLearnerTurns,
      totalClearTurns: audit.pedagogy.coverage.clearLearnerTurns,
      mismatchFindings: audit.pedagogy.acts
        .filter((item) => item.status === "EVIDENCE_MISMATCH")
        .map((item) => item.findingId),
      supportedActFindings: audit.pedagogy.acts
        .filter((item) => item.status === "PATTERN_SUPPORTED")
        .map((item) => item.findingId),
      alternativeEvidenceFindings: audit.pedagogy.acts
        .filter((item) => item.otherSupportedQuotes.length > 0)
        .map((item) => item.findingId),
      notices: audit.pedagogy.notices,
      originalsUnchanged,
      blockedNetworkAttempts,
      paidDispatches: 0,
      databaseWrites: 0,
      scoreChanged: false,
    }),
  );
}
main().catch(() => {
  console.error(
    "Offline pedagogy audit stopped. No paid/DB operation; original artifacts never overwritten.",
  );
  process.exitCode = 1;
});
