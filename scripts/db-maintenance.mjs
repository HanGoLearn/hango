// Explicit, fingerprint-pinned account maintenance. No seed/reset/provider calls.
// Backups contain private data: encrypted, gitignored, never printed or uploaded.
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import {
  createHash,
  randomBytes,
  createCipheriv,
  createDecipheriv,
} from "node:crypto";
import { gzipSync, gunzipSync } from "node:zlib";
import { parse } from "dotenv";
import { Client } from "pg";

const args = process.argv.slice(2);
const argument = (name) => {
  const index = args.indexOf(name);
  return index < 0 ? undefined : args[index + 1];
};
const file = argument("--env-file");
const label = argument("--label");
const expected = argument("--expected-fingerprint");
const administrator = "hango.learn@gmail.com";
if (!file || !["local", "production"].includes(label))
  throw new Error("Explicit environment file and label required");
const url = parse(readFileSync(resolve(file))).DATABASE_URL;
if (!url || !/^postgres(?:ql)?:\/\//u.test(url))
  throw new Error("Explicit PostgreSQL URL required");
const fingerprint = createHash("sha256").update(url).digest("hex").slice(0, 16);
const quote = (identifier) => `"${identifier.replaceAll('"', '""')}"`;
const hash = (value) => createHash("sha256").update(value).digest("hex");
const client = new Client({
  connectionString: url,
  connectionTimeoutMillis: 10000,
  options: "-c statement_timeout=60000 -c lock_timeout=10000",
});

async function inspect() {
  const admin = await client.query(
    'SELECT "id", "role", ("emailVerified" IS NOT NULL) AS verified FROM "User" WHERE lower("email")=$1',
    [administrator],
  );
  if (
    admin.rowCount !== 1 ||
    admin.rows[0].role !== "ADMINISTRATOR" ||
    !admin.rows[0].verified
  )
    throw new Error("Exactly one verified administrator must be preserved");
  const count = await client.query('SELECT count(*)::int AS users FROM "User"');
  const curriculum = await client.query(
    'SELECT (SELECT count(*)::int FROM "Lesson") AS lessons, (SELECT count(*)::int FROM "Scenario") AS scenarios',
  );
  return {
    administratorId: admin.rows[0].id,
    users: count.rows[0].users,
    curriculum: curriculum.rows[0],
  };
}

async function backup() {
  await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
  try {
    const before = await inspect();
    const tables = await client.query(
      "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename",
    );
    const data = {};
    let size = 0;
    for (const { tablename } of tables.rows) {
      // Preserve the original PostgreSQL JSON text, including decimal precision.
      const rows = await client.query(
        `SELECT row_to_json(t)::text AS row FROM public.${quote(tablename)} t`,
      );
      data[tablename] = rows.rows.map((entry) => entry.row);
      size += data[tablename].reduce(
        (total, row) => total + Buffer.byteLength(row),
        0,
      );
      if (size > 512 * 1024 * 1024)
        throw new Error(
          "Backup exceeds safe memory limit; use pg_dump instead",
        );
    }
    const columns = await client.query(
      "SELECT table_name, column_name, ordinal_position, data_type, udt_name, column_default, is_nullable FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name, ordinal_position",
    );
    const constraints = await client.query(
      "SELECT conrelid::regclass::text AS table_name, conname, pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE connamespace='public'::regnamespace ORDER BY conrelid, conname",
    );
    const migrations = Object.fromEntries(
      readdirSync(resolve("prisma/migrations"), { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => [
          entry.name,
          readFileSync(
            resolve("prisma/migrations", entry.name, "migration.sql"),
            "utf8",
          ),
        ]),
    );
    const payload = JSON.stringify({
      format: "hango-logical-rows-v1",
      label,
      fingerprint,
      createdAt: new Date().toISOString(),
      before,
      columns: columns.rows,
      constraints: constraints.rows,
      migrations,
      data,
    });
    const directory = resolve(
      ".codex-tmp/db-backups",
      `${label}-${Date.now()}`,
    );
    mkdirSync(directory, { recursive: true });
    const key = randomBytes(32);
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([
      iv,
      cipher.update(gzipSync(payload)),
      cipher.final(),
      cipher.getAuthTag(),
    ]);
    const backupPath = join(directory, "rows.json.gz.aes");
    const keyPath = join(directory, "recovery.key");
    writeFileSync(backupPath, encrypted, { flag: "wx", mode: 0o600 });
    writeFileSync(keyPath, key, { flag: "wx", mode: 0o600 });
    const stored = readFileSync(backupPath);
    const decipher = createDecipheriv(
      "aes-256-gcm",
      readFileSync(keyPath),
      stored.subarray(0, 12),
    );
    decipher.setAuthTag(stored.subarray(-16));
    const recovered = gunzipSync(
      Buffer.concat([
        decipher.update(stored.subarray(12, -16)),
        decipher.final(),
      ]),
    );
    if (hash(recovered) !== hash(payload))
      throw new Error("Backup verification failed");
    const manifest = {
      label,
      fingerprint,
      before,
      tables: Object.fromEntries(
        Object.entries(data).map(([name, rows]) => [name, rows.length]),
      ),
      backupSha256: hash(stored),
      payloadSha256: hash(payload),
      verified: true,
    };
    writeFileSync(
      join(directory, "manifest.json"),
      JSON.stringify(manifest, null, 2),
      { flag: "wx", mode: 0o600 },
    );
    await client.query("COMMIT");
    console.log(JSON.stringify({ ...manifest, backupDirectory: directory }));
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function removeAccounts() {
  if (
    expected !== fingerprint ||
    argument("--preserve-admin") !== administrator
  )
    throw new Error(
      "Exact destination and administrator confirmation required",
    );
  const directory = resolve(argument("--backup-directory") ?? "missing-backup");
  const manifest = JSON.parse(
    readFileSync(join(directory, "manifest.json"), "utf8"),
  );
  if (
    !manifest.verified ||
    manifest.fingerprint !== fingerprint ||
    manifest.backupSha256 !==
      hash(readFileSync(join(directory, "rows.json.gz.aes")))
  )
    throw new Error("Verified backup for this exact destination required");
  await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");
  try {
    // Prevent concurrent signups while counting and deleting the exact target set.
    await client.query('LOCK TABLE "User" IN EXCLUSIVE MODE');
    const before = await inspect();
    const liveUsers = await client.query(
      'SELECT row_to_json(t)::text AS row FROM "User" t',
    );
    const stored = readFileSync(join(directory, "rows.json.gz.aes"));
    const decipher = createDecipheriv(
      "aes-256-gcm",
      readFileSync(join(directory, "recovery.key")),
      stored.subarray(0, 12),
    );
    decipher.setAuthTag(stored.subarray(-16));
    const recovered = JSON.parse(
      gunzipSync(
        Buffer.concat([
          decipher.update(stored.subarray(12, -16)),
          decipher.final(),
        ]),
      ).toString(),
    );
    if (
      hash([...liveUsers.rows.map((row) => row.row)].sort().join("\n")) !==
      hash([...recovered.data.User].sort().join("\n"))
    )
      throw new Error("Account data changed since backup; back up again");
    // FK descendants are the only tables affected by deleting User. Refuse a
    // stale backup if learning/auth/history data changed since it was captured.
    const dependentTables = await client.query(`WITH RECURSIVE related(oid) AS (
      SELECT 'public."User"'::regclass::oid
      UNION SELECT c.conrelid FROM pg_constraint c JOIN related r ON c.confrelid=r.oid WHERE c.contype='f'
    ) SELECT t.relname FROM related r JOIN pg_class t ON t.oid=r.oid ORDER BY t.relname`);
    for (const { relname } of dependentTables.rows) {
      const rows = await client.query(
        `SELECT row_to_json(t)::text AS row FROM public.${quote(relname)} t`,
      );
      const archived = recovered.data[relname] ?? [];
      if (
        hash(
          rows.rows
            .map((row) => row.row)
            .sort()
            .join("\n"),
        ) !== hash([...archived].sort().join("\n"))
      )
        throw new Error(
          "Dependent account data changed since backup; back up again",
        );
    }
    // Keep a non-identifying cost summary outside the database as well as the
    // complete encrypted usage rows. Never relabel deleted users' costs as admin.
    const costHistory = await client.query(
      'SELECT "feature", "provider", "model", count(*)::int AS calls, sum("estimatedCostUsd") AS estimated_cost_usd FROM "AiUsageLog" GROUP BY "feature", "provider", "model" ORDER BY "feature", "provider", "model"',
    );
    writeFileSync(
      join(directory, "cost-history.json"),
      JSON.stringify(costHistory.rows, null, 2),
      { flag: "wx", mode: 0o600 },
    );
    const audio = await client.query(
      'SELECT a."id", a."audioFilePath", s."userId" FROM "SpeakingAttempt" a JOIN "SpeakingSession" s ON s."id"=a."sessionId" WHERE s."userId"<>$1 AND a."audioFilePath" IS NOT NULL',
      [before.administratorId],
    );
    for (const recording of audio.rows) {
      const match = /^speaking\/([^/]+)\/[^/]+\.(?:webm|ogg|m4a|wav)$/.exec(
        recording.audioFilePath,
      );
      if (!match || match[1] !== recording.userId)
        throw new Error("Recording is outside its owner's private namespace");
      await client.query(
        `INSERT INTO "PrivateObjectDeletion" ("id", "storageKey", "ownerUserId", "speakingAttemptId", "reason", "status", "updatedAt") VALUES ($1,$2,$3,$4,'ACCOUNT_DELETION','PENDING',CURRENT_TIMESTAMP)
        ON CONFLICT ("storageKey") DO UPDATE SET "reason"='ACCOUNT_DELETION', "status"='PENDING', "nextAttemptAt"=CURRENT_TIMESTAMP, "processingStartedAt"=NULL, "lastError"=NULL, "updatedAt"=CURRENT_TIMESTAMP`,
        [
          randomBytes(16).toString("hex"),
          recording.audioFilePath,
          recording.userId,
          recording.id,
        ],
      );
    }
    await client.query(
      'UPDATE "BetaInvitation" SET "status"=\'REVOKED\', "revokedAt"=CURRENT_TIMESTAMP, "updatedAt"=CURRENT_TIMESTAMP WHERE lower("email") IN (SELECT lower("email") FROM "User" WHERE "id"<>$1)',
      [before.administratorId],
    );
    await client.query(
      'DELETE FROM "VerificationToken" WHERE lower("identifier") IN (SELECT lower("email") FROM "User" WHERE "id"<>$1)',
      [before.administratorId],
    );
    const removed = await client.query(
      'DELETE FROM "User" WHERE "id" <> $1 RETURNING "id"',
      [before.administratorId],
    );
    const after = await inspect();
    if (
      after.users !== 1 ||
      after.administratorId !== before.administratorId ||
      JSON.stringify(after.curriculum) !== JSON.stringify(before.curriculum)
    )
      throw new Error("Preservation verification failed; rolling back");
    await client.query("COMMIT");
    const result = {
      label,
      fingerprint,
      deletedAccounts: removed.rowCount,
      administratorPreserved: administrator,
      remainingAccounts: after.users,
      curriculumPreserved: after.curriculum,
      privateRecordingsQueued: audio.rowCount,
      backupDirectory: directory,
    };
    writeFileSync(
      join(directory, "deletion-result.json"),
      JSON.stringify(result, null, 2),
      { flag: "wx", mode: 0o600 },
    );
    console.log(JSON.stringify(result));
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

try {
  await client.connect();
  if (args.includes("--delete-accounts")) await removeAccounts();
  else if (args.includes("--backup")) await backup();
  else
    console.log(
      JSON.stringify({
        label,
        fingerprint,
        ...(await inspect()),
        deletionPerformed: false,
      }),
    );
} catch (error) {
  // Never expose URLs, row values or provider secrets via errors.
  console.error("Database maintenance failed", {
    code: error.code ?? "unavailable",
    reason: error.code ? undefined : error.message,
  });
  process.exitCode = 1;
} finally {
  await client.end();
}
