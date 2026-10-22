/** Explicit manual one-shot only. Never imported by application routes. */
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve, relative, isAbsolute } from "node:path";
import { parse } from "dotenv";
import { prepareImportedJourneyQualityReview } from "../src/lib/journey-speaking-quality-import";
import {
  importedReviewBudget,
  runImportedReviewOnce,
  verifyAdditionalPromptV2Request,
  PROMPT_V2_ADDITIONAL_AUTHORIZATION,
  EVIDENCE_REVIEW_AUTHORIZATION,
} from "../src/lib/journey-speaking-quality-once";

let stage = "arguments";
async function main() {
  const [
    file,
    attemptId,
    captureHash,
    snapshotHash,
    expectedDb,
    mode,
    ...extra
  ] = process.argv.slice(2);
  if (
    !file ||
    !attemptId ||
    !captureHash ||
    !snapshotHash ||
    !expectedDb ||
    !mode ||
    extra.length ||
    ![
      "--preflight",
      "--one-paid-review-max-usd-0.05",
      "--preflight-additional-prompt-v2",
      "--one-additional-prompt-v2-review-max-usd-0.05",
      "--preflight-evidence",
      "--one-evidence-review-max-usd-0.05",
    ].includes(mode)
  )
    throw new Error("Invalid invocation");
  if (
    process.env.VERCEL ||
    process.env.NODE_ENV === "production" ||
    process.env.NODE_ENV === "test"
  )
    throw new Error("Local manual tool only");
  const root = resolve(".storage/journey-quality-imports");
  const path = resolve(file);
  const scoped = relative(root, path);
  if (
    !scoped ||
    scoped.startsWith("..") ||
    isAbsolute(scoped) ||
    !path.endsWith(".json")
  )
    throw new Error("Private artifact required");
  stage = "private-artifact";
  const content = await readFile(path, "utf8");
  if (content.length > 500000) throw new Error("Artifact too large");
  stage = "artifact-integrity";
  const evidence =
    mode === "--preflight-evidence" ||
    mode === "--one-evidence-review-max-usd-0.05";
  const prepared = prepareImportedJourneyQualityReview(
    JSON.parse(content),
    {
      attemptId,
      captureHash,
      snapshotHash,
    },
    evidence ? "evidence" : "legacy",
  );
  stage = "prepared-request-match";
  const prior = JSON.parse(
    await readFile(
      evidence ? `${path}.prepared-evidence.json` : `${path}.prepared.json`,
      "utf8",
    ),
  );
  const additional = mode.includes("additional-prompt-v2");
  if (additional)
    verifyAdditionalPromptV2Request(prior.request, prepared.request);
  else if (JSON.stringify(prior.request) !== JSON.stringify(prepared.request))
    throw new Error("Prepared request changed");
  stage = "local-environment";
  const config = parse(await readFile(".env.local", "utf8"));
  if (
    !/^[a-f0-9]{16}$/.test(expectedDb) ||
    createHash("sha256")
      .update(config.DATABASE_URL ?? "")
      .digest("hex")
      .slice(0, 16) !== expectedDb
  )
    throw new Error("Local accounting destination mismatch");
  // Explicit file only, no production environment download or ambient DB override.
  process.env.DATABASE_URL = config.DATABASE_URL;
  process.env.AUTH_SECRET = config.AUTH_SECRET;
  Object.assign(process.env, { NODE_ENV: "development" });
  process.env.DATABASE_POOL_MAX = "1";
  stage = "database-module";
  const { db } = await import("../src/lib/db");
  try {
    stage = "administrator-read";
    const administrator = await db.user.findUnique({
      where: { email: "hango.learn@gmail.com" },
      select: { id: true, role: true },
    });
    if (
      !administrator ||
      administrator.role !== "ADMINISTRATOR" ||
      !config.OPENAI_API_KEY
    )
      throw new Error("Verified local admin and provider required");
    stage = "budget-preflight";
    const budget = importedReviewBudget(prepared.request);
    if (
      mode === "--preflight" ||
      mode === "--preflight-additional-prompt-v2" ||
      mode === "--preflight-evidence"
    ) {
      console.log(
        JSON.stringify({
          ready: true,
          budget,
          localAccountingVerified: true,
          productionWrites: 0,
          paidDispatches: 0,
        }),
      );
      return;
    }
    stage = "provider-modules";
    const { OpenAiProvider } = await import("../src/lib/ai/providers/openai");
    const { trackAiOperation, recordAiUsage } =
      await import("../src/lib/ai-usage");
    const { createLocalJourneyQualityStore } =
      await import("../src/lib/journey-speaking-quality-store");
    const provider = new OpenAiProvider(config.OPENAI_API_KEY, budget.model);
    const identity = {
      userId: administrator.id,
      feature: "lesson-reflection" as const,
      experience: "LESSON_REFLECTION" as const,
      provider: "openai",
      model: budget.model,
    };
    if (additional) {
      stage = "freeze-new-authorized-request";
      await writeFile(
        `${path}.prepared-prompt-v2.json`,
        JSON.stringify({
          request: prepared.request,
          receipt: prepared.receipt,
          authorization: PROMPT_V2_ADDITIONAL_AUTHORIZATION,
        }),
        { flag: "wx", mode: 0o600 },
      );
    }
    stage = "one-shot-ledger";
    const result = await runImportedReviewOnce(
      prepared,
      {
        confirmOnePaidReview: true,
        maximumUsd: 0.05,
        ...(additional
          ? { additionalAuthorization: PROMPT_V2_ADDITIONAL_AUTHORIZATION }
          : {}),
        ...(evidence
          ? { evidenceAuthorization: EVIDENCE_REVIEW_AUTHORIZATION }
          : {}),
      },
      {
        store: createLocalJourneyQualityStore(
          resolve(".storage/journey-quality-import-reviews"),
        ),
        authorize: (operation) => trackAiOperation(identity, operation),
        complete: (request) => provider.complete(request),
        meter: (result, costUsd) =>
          recordAiUsage({
            ...identity,
            inputTokens: result.inputTokens,
            outputTokens: result.outputTokens,
            estimatedCostUsd: costUsd,
          }),
      },
    );
    console.log(JSON.stringify(result));
  } finally {
    await db.$disconnect();
  }
}
main().catch(() => {
  console.error(
    `Private one-shot tool stopped at ${stage}. Inspect the private ledger; do not repeat a paid dispatch after an ambiguous failure.`,
  );
  process.exitCode = 1;
});
