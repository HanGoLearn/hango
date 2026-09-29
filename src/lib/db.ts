import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { serverEnv } from "@/lib/env/server";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Local development benefits from the larger pool established by the 2026-08-30
// audit. Serverless instances must stay smaller so concurrent Vercel functions
// do not multiply into an excessive number of database connections.
const poolMax =
  serverEnv.DATABASE_POOL_MAX ?? (serverEnv.NODE_ENV === "production" ? 5 : 20);

const adapter = new PrismaPg({
  connectionString: serverEnv.DATABASE_URL,
  max: poolMax,
});

export const db = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (serverEnv.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
