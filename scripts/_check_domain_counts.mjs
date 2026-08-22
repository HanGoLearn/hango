import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });
const domains = await db.domain.findMany({ select: { slug: true, name: true } });
for (const d of domains) {
  const count = await db.lesson.count({
    where: { scenarioLevel: { scenario: { domain: { slug: d.slug } } } },
  });
  console.log(`${d.slug}: ${count} lessons`);
}
await db.$disconnect();
