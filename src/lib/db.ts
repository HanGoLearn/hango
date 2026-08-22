import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { serverEnv } from "@/lib/env/server";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaPg({ connectionString: serverEnv.DATABASE_URL });

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    // Diagnostic only (2026-08-19, investigating the real vs. estimated
    // Prisma Postgres Operations gap for the Grammar batch) - gated behind
    // an env var so normal dev/prod behavior is unaffected. Remove once
    // that investigation is closed.
    ...(process.env.DEBUG_PRISMA_QUERIES ? { log: ["query"] as const } : {}),
  });

if (serverEnv.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
