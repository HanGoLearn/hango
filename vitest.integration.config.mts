import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "./vitest.config.mts";

// Integration tests hit the real Postgres database. Vitest's default is to
// fork one process per test file and run them in parallel; each process
// gets its own db.ts Prisma pool (max: 20 connections - see src/lib/db.ts's
// own comment on why that number was raised from 10). Running all ~28
// files in tests/integration in parallel multiplies that across as many
// forks as there are CPU cores, which can exceed the database's real
// connection ceiling and fail unrelated tests with "too many database
// connections" (observed 2026-08-31 - see
// project_integration_test_connection_limit memory). One shared
// process/pool avoids that entirely, at the cost of running integration
// files sequentially instead of in parallel.
export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      fileParallelism: false,
      // The shared integration database is remote. The 15-second default in
      // vitest.config.mts remains appropriate for unit/component tests, but a
      // valid integration request can cross it during ordinary provider
      // latency (observed at 15.146s on 2026-09-26). Keep this override scoped
      // to integration instead of weakening the faster suites globally.
      testTimeout: 30_000,
    },
  }),
);
