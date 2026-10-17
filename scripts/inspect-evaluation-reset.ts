// Explicit destination, read-only connection, no application env/key loading.
// Preflight only: this script cannot reset, back up or delete any records.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { parse } from "dotenv";
import { Client } from "pg";
import { ADMIN_EMAIL } from "../src/lib/admin-identity";

const args = process.argv.slice(2);
const fileIndex = args.indexOf("--env-file");
const labelIndex = args.indexOf("--label");
const file = args[fileIndex + 1];
const label = args[labelIndex + 1];
if (
  fileIndex < 0 ||
  labelIndex < 0 ||
  !file ||
  !["local", "production"].includes(label ?? "")
)
  throw new Error(
    "Provide explicit --env-file and --label local|production (read-only).",
  );
const values = parse(readFileSync(resolve(file)));
const connectionString = values.DATABASE_URL;
if (!connectionString || !/^postgres(?:ql)?:\/\//u.test(connectionString))
  throw new Error(
    "Explicit PostgreSQL DATABASE_URL required; no inferred destination.",
  );
const configurationFingerprint = createHash("sha256")
  .update(connectionString)
  .digest("hex")
  .slice(0, 16);
const client = new Client({
  connectionString,
  connectionTimeoutMillis: 8_000,
  query_timeout: 8_000,
  options: "-c default_transaction_read_only=on -c statement_timeout=5000",
});
async function main() {
  try {
    await client.connect();
    const readonly = await client.query("SHOW default_transaction_read_only");
    if (readonly.rows[0]?.default_transaction_read_only !== "on")
      throw new Error("Read-only guard failed");
    const administrator = await client.query(
      'SELECT "id", "email", "role", ("emailVerified" IS NOT NULL) AS verified FROM "User" WHERE lower("email") = $1',
      [ADMIN_EMAIL],
    );
    const totals = await client.query(
      'SELECT count(*)::int AS users, count(*) FILTER (WHERE "role" = \'ADMINISTRATOR\')::int AS administrators FROM "User"',
    );
    const learning = await client.query(
      'SELECT (SELECT count(*)::int FROM "LessonReflectionReport") AS reports, (SELECT count(*)::int FROM "LearnerLessonCompletion") AS completions, (SELECT count(*)::int FROM "LearnerLessonProgress") AS progress, (SELECT count(*)::int FROM "AiUsageLog") AS usage_logs, (SELECT coalesce(sum("estimatedCostUsd"), 0) FROM "AiUsageLog") AS recorded_cost_usd, (SELECT count(*)::int FROM "Lesson" WHERE "status" = \'PUBLISHED\') AS published_lessons',
    );
    console.log(
      JSON.stringify(
        {
          label,
          configurationFingerprint,
          // Fingerprint identifies configuration, NOT physical database identity.
          readOnly: true,
          administrator: administrator.rows,
          totals: totals.rows[0],
          learning: learning.rows[0],
          deletionPerformed: false,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    console.error("Read-only preflight failed", {
      code:
        error && typeof error === "object" && "code" in error
          ? error.code
          : "unavailable",
    });
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}
void main();
