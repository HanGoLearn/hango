import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { serverEnv } from "@/lib/env/server";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// max: 20, not the pg.Pool default of 10 (2026-08-30, Prisma audit) - a
// single page load routinely bursts 10+ concurrent queries (AppShell's
// daily-login check + profile + 5-query streak lookup + 4-query avatar
// data), so the default pool was queuing requests for a free connection
// mid-burst - confirmed live via server logs showing the same action
// (saveAvatarAnimalAction) alternate between ~140ms and ~950ms+ across
// consecutive calls in the same process, the signature of pool contention
// rather than one-time cold-start cost.
const adapter = new PrismaPg({
  connectionString: serverEnv.DATABASE_URL,
  max: 20,
});

export const db =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (serverEnv.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
