// Explicit production maintenance connection; never falls back to local settings.
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { parse } from "dotenv";
import { Client } from "pg";

const args = process.argv.slice(2);
const argument = (name) => {
  const index = args.indexOf(name);
  return index < 0 ? undefined : args[index + 1];
};
const file = argument("--env-file");
if (!file) throw new Error("Explicit production environment file required");
const url = parse(readFileSync(resolve(file))).DATABASE_URL;
if (!url || !/^postgres(?:ql)?:\/\//u.test(url))
  throw new Error("Explicit PostgreSQL connection required");
const fingerprint = createHash("sha256").update(url).digest("hex").slice(0, 16);
if (fingerprint !== argument("--expected-fingerprint"))
  throw new Error("Production fingerprint mismatch");
const allowed = new Set([
  "20261010120000_separate_realtime_usage_limits",
  "20261010130000_separate_han_text_usage_limits",
  "20261010140000_shared_ai_experience_budgets",
  "20261011150000_journey_speaking_evidence_v2",
  "20261011170000_journey_speaking_capture_quality",
]);
const client = new Client({
  connectionString: url,
  connectionTimeoutMillis: 10000,
  options: "-c default_transaction_read_only=on -c statement_timeout=15000",
});
try {
  await client.connect();
  const identity = await client.query(`SELECT
    (SELECT id FROM "User" WHERE lower(email)='hango.learn@gmail.com' AND role='ADMINISTRATOR') AS admin_id,
    (SELECT id FROM "Lesson" WHERE slug='foundations-greetings-and-introductions') AS lesson_id,
    (SELECT count(*)::int FROM "Lesson") AS lessons,
    (SELECT count(*)::int FROM "Scenario") AS scenarios`);
  const destination = identity.rows[0];
  if (
    destination.admin_id !== "cmuttzogr000004l8hwvevmiz" ||
    destination.lesson_id !== "cmurrlgze00omtseohmebgigz" ||
    destination.lessons !== 164 ||
    destination.scenarios !== 41
  )
    throw new Error("Known production identity/curriculum mismatch");
  const history = await client.query(
    'SELECT migration_name, checksum, finished_at, rolled_back_at FROM "_prisma_migrations"',
  );
  if (history.rows.some((row) => !row.finished_at && !row.rolled_back_at))
    throw new Error("Unresolved migration exists");
  const applied = history.rows.filter(
    (row) => row.finished_at && !row.rolled_back_at,
  );
  for (const row of applied) {
    const sql = readFileSync(
      resolve("prisma/migrations", row.migration_name, "migration.sql"),
    );
    if (createHash("sha256").update(sql).digest("hex") !== row.checksum)
      throw new Error("Applied migration checksum mismatch");
  }
  const names = new Set(applied.map((row) => row.migration_name));
  const pending = readdirSync(resolve("prisma/migrations"), {
    withFileTypes: true,
  })
    .filter((entry) => entry.isDirectory() && !names.has(entry.name))
    .map((entry) => entry.name);
  if (pending.some((name) => !allowed.has(name)))
    throw new Error("Unexpected pending migration");
  const content = await client.query(
    `SELECT
    (SELECT count(*)::int FROM "Exercise" e JOIN "LessonGrammarPoint" g ON g."grammarPointId"=e."grammarPointId" WHERE g."lessonId"=$1 AND e.status='PUBLISHED') AS grammar_questions,
    (SELECT count(*)::int FROM "Exercise" e WHERE e."lessonId"=$1 AND e."grammarPointId" IS NULL AND e.status='PUBLISHED') AS practice_questions`,
    [destination.lesson_id],
  );
  if (
    !content.rows[0]?.grammar_questions ||
    !content.rows[0]?.practice_questions
  )
    throw new Error("Real published first-lesson questions required");
  console.log(
    JSON.stringify({
      label: "production",
      fingerprint,
      ...destination,
      ...content.rows[0],
      pending,
    }),
  );
  if (args.includes("--apply") && pending.length) {
    const PRODUCTION_DATABASE_URL = url;
    const migration = spawnSync(
      process.execPath,
      [resolve("node_modules/prisma/build/index.js"), "migrate", "deploy"],
      {
        cwd: process.cwd(),
        encoding: "utf8",
        env: {
          ...process.env,
          DATABASE_URL: PRODUCTION_DATABASE_URL,
          DIRECT_URL: PRODUCTION_DATABASE_URL,
        },
      },
    );
    // Do not print Prisma's datasource URL or environment contents.
    if (migration.status !== 0)
      throw new Error(
        "Production migration failed; inspect migration status before retry",
      );
    console.log(JSON.stringify({ migrationsApplied: pending }));
  }
  if (args.includes("--apply")) {
    await client.query(
      'SELECT "captureQuality" FROM "JourneySpeakingAttempt" LIMIT 0',
    );
    await client.query(
      'SELECT "recognition" FROM "JourneySpeakingTurn" LIMIT 0',
    );
    await client.query('SELECT id FROM "JourneySpeakingEvaluation" LIMIT 0');
    await client.query('SELECT experience FROM "AiUsageLog" LIMIT 0');
    console.log(
      JSON.stringify({ schemaReady: true, accountsOrCurriculumReset: false }),
    );
  }
} catch (error) {
  console.error("Production preflight failed", {
    code: error.code,
    reason: error.code ? undefined : error.message,
  });
  process.exitCode = 1;
} finally {
  await client.end();
}
