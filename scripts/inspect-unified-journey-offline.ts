/** Read a privately exported, already-paid review. No provider, DB or env keys. */
import { readFile } from "node:fs/promises";
import { resolve, relative, isAbsolute } from "node:path";
import { createHash } from "node:crypto";
import { prepareUnifiedJourneyReview } from "../src/lib/journey-unified-speaking-server";
import type { JourneyEvaluationContext } from "../src/lib/journey-speaking-evaluation";

globalThis.fetch = async () => {
  throw new Error("OFFLINE_ONLY");
};
async function main() {
  const [file, expectedAttempt, expectedSnapshot, expectedRequest, ...extra] =
    process.argv.slice(2);
  if (
    !file ||
    !expectedAttempt ||
    !/^[a-f0-9]{64}$/.test(expectedSnapshot ?? "") ||
    !/^[a-f0-9]{64}$/.test(expectedRequest ?? "") ||
    extra.length
  )
    throw new Error("Private export and independent identity pins required");
  const path = resolve(file);
  const part = relative(resolve(".storage/journey-incidents"), path);
  if (
    !part ||
    part.startsWith("..") ||
    isAbsolute(part) ||
    !path.endsWith(".json")
  )
    throw new Error("Private scoped artifact required");
  const text = await readFile(path, "utf8");
  if (text.length > 500_000) throw new Error("Oversized export");
  const data = JSON.parse(text);
  const attempt = data.attempt;
  function canonical(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(canonical);
    if (value && typeof value === "object")
      return Object.fromEntries(
        Object.entries(value)
          .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
          .map(([k, v]) => [k, canonical(v)]),
      );
    return value;
  }
  const snapshotHash = createHash("sha256")
    .update(JSON.stringify(canonical(attempt.snapshot)))
    .digest("hex");
  if (
    attempt.id !== expectedAttempt ||
    snapshotHash !== expectedSnapshot ||
    data.evaluation.requestHash !== expectedRequest
  )
    throw new Error("Export identity mismatch");
  const context: JourneyEvaluationContext = {
    snapshot: attempt.snapshot,
    locale: attempt.locale,
    closeReason: attempt.closeReason,
    quality: attempt.captureQuality,
    turns: attempt.turns.map(
      (turn: {
        id: string;
        sequence: number;
        role: "user" | "assistant";
        content: string;
        recognition: unknown;
      }) => ({
        id: turn.id,
        sequence: turn.sequence,
        role: turn.role,
        content: turn.content,
        ...(turn.recognition ? { recognition: turn.recognition } : {}),
      }),
    ),
  } as JourneyEvaluationContext;
  const prepared = prepareUnifiedJourneyReview(attempt.id, context);
  const rebuilt = prepared.store(data.evaluation.response);
  const result = prepared.inspect(data.evaluation);
  console.log(
    JSON.stringify({
      requestHashMatches: rebuilt.requestHash === expectedRequest,
      state: result?.state ?? "CONTEXT_MISMATCH",
      issues:
        result?.state === "REJECTED_CANDIDATE" ? result.inspection.issues : [],
      dimensions:
        result?.state === "VALIDATED_CANDIDATE"
          ? Object.fromEntries(
              Object.entries(result.inspection.profile.dimensions).map(
                ([key, d]) => [key, "level" in d ? d.level : null],
              ),
            )
          : null,
      originalUnchanged: text === (await readFile(path, "utf8")),
      paidRequests: 0,
      databaseWrites: 0,
    }),
  );
}
void main().catch(() => {
  console.error("Offline inspection failed; private data was not printed.");
  process.exitCode = 1;
});
