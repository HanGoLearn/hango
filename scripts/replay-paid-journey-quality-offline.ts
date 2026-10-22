/** Regression probes derived from saved paid judgments. NOT new model outputs.
 * No provider, key, environment, database or accounting imports. */
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve, relative, isAbsolute } from "node:path";
import { prepareImportedJourneyQualityReview } from "../src/lib/journey-speaking-quality-import";
import { JourneyQualityCandidateSchema } from "../src/lib/journey-speaking-quality-candidate";
import { JOURNEY_EVIDENCE_TRANSPORT_VERSION } from "../src/lib/journey-speaking-quality-evidence-review";

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
    throw new Error("OFFLINE_NETWORK_FORBIDDEN");
  };
  const [file, first, second, attemptId, captureHash, snapshotHash, ...extra] =
    process.argv.slice(2);
  if (
    !file ||
    !first ||
    !second ||
    !attemptId ||
    !captureHash ||
    !snapshotHash ||
    extra.length
  )
    throw new Error("Expected private export, two responses and identity pins");
  const paths = [
    scoped(file, ".storage/journey-quality-imports"),
    scoped(first, ".storage/journey-quality-import-reviews"),
    scoped(second, ".storage/journey-quality-import-reviews"),
  ];
  if (new Set(paths).size !== 3) throw new Error("Distinct artifacts required");
  const texts = await Promise.all(paths.map((path) => readFile(path, "utf8")));
  if (texts.some((text) => text.length > 500000))
    throw new Error("Oversized artifact");
  const source = JSON.parse(texts[0]!);
  const pins = { attemptId, captureHash, snapshotHash };
  const legacy = prepareImportedJourneyQualityReview(source, pins);
  const selected = prepareImportedJourneyQualityReview(
    source,
    pins,
    "evidence",
  );
  const oldPayload = JSON.parse(legacy.request.input) as {
    turns: Array<{
      id: string;
      sequence: number;
      role: string;
      content: string;
    }>;
    targets: Array<{ id: string; kind: string; text: string }>;
  };
  const payload = JSON.parse(selected.request.input) as {
    turns: Array<{ id: string; sequence: number; content: string }>;
    partnerContext: Array<{ id: string; sequence: number; content: string }>;
    targets: Array<{ id: string; eligibleLearnerEvidenceIds: string[] }>;
  };
  const turns = new Map(oldPayload.turns.map((turn) => [turn.id, turn]));
  const targets = new Map(
    oldPayload.targets.map((target) => [target.id, target]),
  );
  const cases: Array<{
    response: number;
    kind: string;
    passed: boolean;
    observedCodes: string[];
  }> = [];
  const reports = [];
  function refs(citations: Array<{ turnId: string; quote: string }>) {
    const learnerEvidenceIds: string[] = [],
      partnerEvidenceIds: string[] = [];
    for (const citation of citations) {
      const turn = turns.get(citation.turnId);
      if (!turn)
        throw new Error("Original citation not in frozen clear capture");
      const catalog =
        turn.role === "user" ? payload.turns : payload.partnerContext;
      const fragment = catalog.find(
        (item) =>
          item.sequence === turn.sequence &&
          item.content.includes(citation.quote),
      );
      if (!fragment)
        throw new Error("Original fragment cannot be mapped faithfully");
      (turn.role === "user" ? learnerEvidenceIds : partnerEvidenceIds).push(
        fragment.id,
      );
    }
    return {
      learnerEvidenceIds: [...new Set(learnerEvidenceIds)],
      partnerEvidenceIds: [...new Set(partnerEvidenceIds)],
    };
  }
  for (let index = 1; index <= 2; index++) {
    const saved = JSON.parse(texts[index]!);
    if (
      saved.request.input !== legacy.request.input ||
      saved.result.outputStatus !== "complete"
    )
      throw new Error("Saved response context/status mismatch");
    const judgment = JourneyQualityCandidateSchema.parse(
      JSON.parse(saved.result.content),
    );
    const original = legacy.inspectResponse({
      status: "completed",
      text: saved.result.content,
    });
    cases.push({
      response: index,
      kind: "original-reinspection",
      passed: original.state === "REJECTED_CANDIDATE",
      observedCodes:
        original.state === "REJECTED_CANDIDATE"
          ? original.inspection.issues.map((x) => x.code)
          : [],
    });
    const oldFormat = selected.inspectResponse({
      status: "completed",
      text: saved.result.content,
    });
    cases.push({
      response: index,
      kind: "no-silent-legacy-conversion",
      passed: oldFormat.state === "REJECTED_CANDIDATE",
      observedCodes:
        oldFormat.state === "REJECTED_CANDIDATE"
          ? oldFormat.inspection.issues.map((x) => x.code)
          : [],
    });
    const convert = (item: {
      citations: Array<{ turnId: string; quote: string }>;
    }) => {
      const { citations, ...rest } = item;
      return { ...rest, ...refs(citations) };
    };
    const dimensions = {
      ...judgment.dimensions,
      communication: convert(judgment.dimensions.communication),
      vocabulary: convert(judgment.dimensions.vocabulary),
      grammar: convert(judgment.dimensions.grammar),
      interaction: convert(judgment.dimensions.interaction),
    };
    const projected = {
      ...judgment,
      transportVersion: JOURNEY_EVIDENCE_TRANSPORT_VERSION,
      dimensions,
      findings: judgment.findings.map(convert),
    };
    function probe(
      kind: string,
      value: unknown,
      code?: string,
      positive = false,
    ) {
      const result = selected.inspectResponse({
        status: "completed",
        text: JSON.stringify(value),
      });
      const codes =
        result.state === "REJECTED_CANDIDATE"
          ? result.inspection.issues.map((x) => x.code)
          : [];
      const passed = positive
        ? result.state === "VALIDATED_CANDIDATE" &&
          result.inspection.profile.score === null &&
          !result.inspection.profile.eligibleForRewards
        : result.state === "REJECTED_CANDIDATE" &&
          (!code || codes.includes(code));
      cases.push({ response: index, kind, passed, observedCodes: codes });
    }
    probe("original-selections-projected-as-test-only", projected);
    const unobserved = {
      observation: "NOT_OBSERVED",
      level: null,
      support: "UNKNOWN",
      reason: "Sonda de selección; no es otra evaluación del alumno.",
      learnerEvidenceIds: [],
      partnerEvidenceIds: [],
    };
    const base = {
      ...projected,
      dimensions: {
        communication: unobserved,
        vocabulary: unobserved,
        grammar: unobserved,
        interaction: unobserved,
        pronunciation: judgment.dimensions.pronunciation,
        fluency: judgment.dimensions.fluency,
      },
      findings: [] as unknown[],
    };
    for (const finding of judgment.findings) {
      const target = targets.get(finding.targetId);
      const users = finding.citations.filter(
        (cite) => turns.get(cite.turnId)?.role === "user",
      );
      const mapping = refs(finding.citations);
      if (
        !users.length &&
        !["NOT_OBSERVED", "NO_OPPORTUNITY"].includes(finding.state)
      )
        probe(
          `partner-only-production:${finding.id}`,
          { ...base, findings: [convert(finding)] },
          "MISSING_LEARNER_EVIDENCE",
        );
      if (
        target?.kind === "vocabulary" &&
        users.length &&
        !users.some((cite) => cite.quote.includes(target.text))
      ) {
        const eligible = payload.targets.find(
          (item) => item.id === finding.targetId,
        )!.eligibleLearnerEvidenceIds;
        if (mapping.learnerEvidenceIds.some((id) => !eligible.includes(id)))
          probe(
            `unrelated-word-selection:${finding.id}`,
            { ...base, findings: [convert(finding)] },
            "INELIGIBLE_TARGET_EVIDENCE",
          );
        else {
          // The original narrow quote cannot be written in the new contract.
          // The server-owned whole fragment now must actually contain the word.
          cases.push({
            response: index,
            kind: `server-quote-no-free-text:${finding.id}`,
            passed: mapping.learnerEvidenceIds.every(
              (id) =>
                payload.turns
                  .find((item) => item.id === id)
                  ?.content.includes(target.text) === true,
            ),
            observedCodes: [],
          });
        }
      }
    }
    probe("unlinked-interaction", {
      ...base,
      dimensions: { ...base.dimensions, interaction: dimensions.interaction },
    });
    for (const key of [
      "communication",
      "vocabulary",
      "grammar",
      "interaction",
    ] as const)
      if (
        ["OCCASIONAL", "CONTINUOUS"].includes(judgment.dimensions[key].support)
      )
        probe(
          `unsupported-assistance:${key}`,
          {
            ...base,
            dimensions: { ...base.dimensions, [key]: dimensions[key] },
          },
          "SUPPORT_WITHOUT_PRECEDING_EVIDENCE",
        );
    const positive = judgment.findings.find(
      (finding) =>
        finding.state === "INDEPENDENT" &&
        targets.get(finding.targetId)?.kind === "vocabulary" &&
        finding.citations.some(
          (cite) =>
            turns.get(cite.turnId)?.role === "user" &&
            cite.quote.includes(targets.get(finding.targetId)!.text),
        ),
    );
    if (!positive) throw new Error("Positive ownership control missing");
    probe(
      "valid-selection-roundtrip-not-a-grade",
      { ...base, findings: [convert(positive)] },
      undefined,
      true,
    );
    reports.push({
      response: index,
      sourceResponseSha256: digest(texts[index]!),
      originalPromptVersion: saved.request.promptVersion,
      originalInspection: original,
      projectedSelectionsAreTestProbesNotProviderOutput: true,
    });
  }
  const unchanged = (
    await Promise.all(paths.map((path) => readFile(path, "utf8")))
  ).every((text, index) => digest(text) === digest(texts[index]!));
  const audit = {
    version: "paid-response-offline-replay-2026-10-18-v1",
    createdAt: new Date().toISOString(),
    cases,
    reports,
    originalsUnchanged: unchanged,
    blockedNetworkAttempts,
    paidDispatches: 0,
    databaseWrites: 0,
    scoreChanged: false,
    passed:
      unchanged &&
      blockedNetworkAttempts === 0 &&
      cases.every((item) => item.passed),
  };
  await writeFile(
    `${paths[0]}.offline-paid-replay-v1.json`,
    JSON.stringify(audit),
    { flag: "wx", mode: 0o600 },
  );
  console.log(
    JSON.stringify({
      passed: audit.passed,
      savedResponses: 2,
      checks: cases.length,
      passedChecks: cases.filter((item) => item.passed).length,
      originalsUnchanged: unchanged,
      blockedNetworkAttempts,
      paidDispatches: 0,
      databaseWrites: 0,
      failures: cases.filter((item) => !item.passed),
    }),
  );
  if (!audit.passed) process.exitCode = 1;
}
main().catch(() => {
  console.error(
    "Offline replay stopped; no provider/DB operation. Original artifacts are never overwritten.",
  );
  process.exitCode = 1;
});
