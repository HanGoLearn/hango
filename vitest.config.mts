import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.{ts,tsx}"],
    setupFiles: ["tests/setup-env.ts"],
    // Prisma Postgres's serverless connection has enough cold-start/
    // network latency variance that the 5000ms vitest default caused
    // random, unrelated integration tests to time out under normal load
    // (observed 2026-08-19: 3 consecutive runs of the same file, each
    // timing out a different test, ~24s total suite duration every time -
    // the signature of infra latency, not a logic bug).
    testTimeout: 15000,
  },
});
