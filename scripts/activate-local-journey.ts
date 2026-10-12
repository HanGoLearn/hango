// Explicit local destination, no API keys, resets, seeds or secret exports.
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { parse } from "dotenv";
import { Client } from "pg";

const expected =
  process.argv[process.argv.indexOf("--expected-fingerprint") + 1];
const apply = process.argv.includes("--apply");
const values = parse(readFileSync(resolve(".env.local")));
const url = values.DATABASE_URL;
if (!url || !/^postgres(?:ql)?:\/\//u.test(url))
  throw new Error("Explicit local PostgreSQL configuration required");
const fingerprint = createHash("sha256").update(url).digest("hex").slice(0, 16);
if (!/^[a-f0-9]{16}$/u.test(expected ?? "") || fingerprint !== expected)
  throw new Error("Local destination fingerprint mismatch");
if (process.env.VERCEL || process.env.NODE_ENV === "production")
  throw new Error("Local activation cannot run in production");
const allowed = new Set([
  "20261011150000_journey_speaking_evidence_v2",
  "20261011170000_journey_speaking_capture_quality",
]);
async function main() {
  const client = new Client({
    connectionString: url,
    connectionTimeoutMillis: 10_000,
    options: "-c default_transaction_read_only=on -c statement_timeout=15000",
  });
  try {
    await client.connect();
    const rows = await client.query(
      'SELECT "migration_name", "finished_at", "rolled_back_at" FROM "_prisma_migrations"',
    );
    if (rows.rows.some((row) => !row.finished_at && !row.rolled_back_at))
      throw new Error("Unresolved migration exists");
    const applied = new Set(
      rows.rows
        .filter((row) => row.finished_at)
        .map((row) => row.migration_name),
    );
    const pending = readdirSync(resolve("prisma/migrations"), {
      withFileTypes: true,
    })
      .filter((entry) => entry.isDirectory() && !applied.has(entry.name))
      .map((entry) => entry.name);
    if (pending.some((name) => !allowed.has(name)))
      throw new Error(
        "Unexpected pending migrations; refusing broad deployment",
      );
    const curriculum = await client.query(`SELECT l."slug", l."hskReference",
      (SELECT count(*)::int FROM "LessonVocabulary" v WHERE v."lessonId"=l."id") AS words,
      (SELECT count(*)::int FROM "LessonGrammarPoint" g WHERE g."lessonId"=l."id") AS patterns,
      (SELECT count(*)::int FROM "Exercise" e JOIN "LessonGrammarPoint" g ON g."grammarPointId"=e."grammarPointId" WHERE g."lessonId"=l."id" AND e."status"='PUBLISHED') AS grammar_questions,
      (SELECT count(*)::int FROM "Exercise" e WHERE e."lessonId"=l."id" AND e."grammarPointId" IS NULL AND e."status"='PUBLISHED') AS practice_questions
      FROM "Lesson" l WHERE l."slug"='foundations-greetings-and-introductions'`);
    if (
      !curriculum.rows[0]?.grammar_questions ||
      !curriculum.rows[0]?.practice_questions
    )
      throw new Error(
        "First lesson needs real published exercise questions before activation",
      );
    console.log(
      JSON.stringify(
        {
          label: "local",
          fingerprint,
          pending,
          firstLesson: curriculum.rows[0],
          apply,
        },
        null,
        2,
      ),
    );
    if (apply && pending.length) {
      const LOCAL_DATABASE_URL = url;
      const migration = spawnSync(
        process.execPath,
        [resolve("node_modules/prisma/build/index.js"), "migrate", "deploy"],
        {
          cwd: process.cwd(),
          stdio: "inherit",
          env: {
            ...process.env,
            DATABASE_URL: LOCAL_DATABASE_URL,
            DIRECT_URL: LOCAL_DATABASE_URL,
            NODE_ENV: "development",
          },
        },
      );
      if (migration.status !== 0)
        throw new Error("Local migration failed; do not enable rollout");
    }
    const totals = await client.query(
      'SELECT count(*)::int AS users FROM "User"',
    );
    console.log(
      JSON.stringify({
        usersPreserved: totals.rows[0].users,
        resetPerformed: false,
      }),
    );
  } finally {
    await client.end();
  }
}
main().catch(() => {
  console.error(
    "Local activation preflight failed; no automatic fallback or reset.",
  );
  process.exitCode = 1;
});
