// Runs the integration (and, by default, smoke) suite against a throwaway
// local Postgres cluster instead of the shared remote dev database.
//
// Why this exists (project/AUDITORIA_INTEGRAL_Y_PROXIMOS_PASOS.md, BASE-05,
// 2026-09-16): the previous attempt to reproduce this project's integration
// baseline locally hung indefinitely against the remote database and had to
// be killed with no result - a latency/availability dependency that has
// nothing to do with whether the code under test is correct. This script
// removes that dependency: every run gets its own ephemeral, disposable
// Postgres 17 cluster (matching .github/workflows/ci.yml's version), seeded
// the same way CI seeds it, torn down unconditionally afterward - so a run
// against it is reproducible on any machine, offline, without touching the
// real dev database or waiting on its network round trips.
//
// Usage:
//   npx tsx scripts/test-integration-local.ts                  # integration + smoke
//   npx tsx scripts/test-integration-local.ts --no-smoke
//   npx tsx scripts/test-integration-local.ts tests/integration/some-file.test.ts
//
// Any positional args are forwarded to vitest, so a single file (or a vitest
// -t filter) can be targeted for fast iteration instead of the full suite.
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import EmbeddedPostgres from "embedded-postgres";

const PORT = 54329;
const USER = "hango";
const PASSWORD = "hango";
const DATABASE = "hango_local_test";
const AUTH_SECRET = "local-integration-placeholder-not-a-real-secret-32ch";
const LOCAL_BINARIES = {
  prisma: join(process.cwd(), "node_modules", "prisma", "build", "index.js"),
  tsx: join(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs"),
  vitest: join(process.cwd(), "node_modules", "vitest", "vitest.mjs"),
} as const;

const args = process.argv.slice(2);
const runSmoke = !args.includes("--no-smoke");
const forwardedArgs = args.filter((a) => a !== "--no-smoke");

function run(
  command: keyof typeof LOCAL_BINARIES,
  commandArgs: string[],
  env: Record<string, string | undefined>,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [LOCAL_BINARIES[command], ...commandArgs],
      {
        stdio: "inherit",
        env: env as NodeJS.ProcessEnv,
      },
    );
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else
        reject(
          new Error(
            `${command} ${commandArgs.join(" ")} exited with code ${code}`,
          ),
        );
    });
    child.on("error", reject);
  });
}

async function main() {
  const databaseDir = mkdtempSync(join(tmpdir(), "hango-pg-test-"));
  const pg = new EmbeddedPostgres({
    databaseDir,
    port: PORT,
    user: USER,
    password: PASSWORD,
    authMethod: "password",
    persistent: false,
    // Without this, initdb inherits the host OS locale - on Windows that's
    // a single-byte codepage (WIN1252), which can't store the curriculum's
    // Chinese text and fails seeding with "character ... has no equivalent
    // in encoding WIN1252". The `C` locale is available on every platform
    // (no locale-data dependency) and pairs with an explicit UTF8 encoding
    // to make the cluster's storage encoding host-independent, matching
    // what every other Postgres this project talks to (CI's container, the
    // shared dev database) already uses.
    initdbFlags: ["--encoding=UTF8", "--locale=C"],
  });

  // Never let a real key reach the child processes - every AI call must use
  // the app's own mock provider here, the same guarantee
  // .github/workflows/ci.yml documents for the remote CI run.
  const childEnv: Record<string, string | undefined> = { ...process.env };
  delete childEnv.OPENAI_API_KEY;
  childEnv.DATABASE_URL = `postgresql://${USER}:${PASSWORD}@127.0.0.1:${PORT}/${DATABASE}`;
  childEnv.AUTH_SECRET = AUTH_SECRET;
  childEnv.NODE_ENV = "test";
  // Never let orphan-cleanup tests compare the throwaway database with the
  // developer's real `.storage` directory. Every ephemeral database gets an
  // equally ephemeral object-storage root that is removed with the cluster.
  childEnv.HANGO_STORAGE_ROOT = join(databaseDir, "storage");

  console.log(
    `\n[test-integration-local] starting ephemeral Postgres 17 on 127.0.0.1:${PORT} (${databaseDir})`,
  );
  await pg.initialise();
  await pg.start();
  await pg.createDatabase(DATABASE);

  try {
    console.log("[test-integration-local] prisma migrate deploy");
    await run("prisma", ["migrate", "deploy"], childEnv);

    console.log("[test-integration-local] seeding curriculum (prisma/seed.ts)");
    await run("tsx", ["prisma/seed.ts"], childEnv);

    console.log(
      "[test-integration-local] seeding placement exam question bank",
    );
    await run("tsx", ["scripts/seed-placement-exam-full.mjs"], childEnv);

    console.log(
      "[test-integration-local] seeding Spanish fixtures for locale-asserting tests",
    );
    await run("tsx", ["scripts/seed-es-fixtures-for-tests.ts"], childEnv);

    console.log("[test-integration-local] running integration tests");
    await run(
      "vitest",
      [
        "run",
        "--config",
        "vitest.integration.config.mts",
        // Vitest treats extra positional args as additive test-file
        // patterns, not a narrowing filter - passing "tests/integration"
        // *and* a specific file would just run the whole directory again.
        // Default to the whole directory only when nothing more specific
        // was requested.
        ...(forwardedArgs.length > 0 ? forwardedArgs : ["tests/integration"]),
      ],
      childEnv,
    );

    if (runSmoke) {
      console.log("[test-integration-local] running smoke tests");
      await run("vitest", ["run", "tests/smoke"], childEnv);
    }

    console.log("[test-integration-local] PASSED");
  } finally {
    console.log(
      "[test-integration-local] stopping and deleting the ephemeral cluster",
    );
    await pg.stop().catch((error) => {
      console.error("[test-integration-local] failed to stop cleanly:", error);
    });
    rmSync(databaseDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error("[test-integration-local] FAILED:", error.message ?? error);
  // Be explicit: this runner is also used as a CI-quality gate, and a
  // failed child test process must never be reported as a successful shell
  // command after the PostgreSQL cleanup finishes.
  process.exit(1);
});
