import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const domainSlug = process.argv[2] || "foundations";

const items = await db.vocabularyItem.findMany({
  where: {
    lessons: { some: { lesson: { scenarioLevel: { scenario: { domain: { slug: domainSlug } } } } } },
  },
  include: { examples: true },
});

const total = items.length;
const withExamples = items.filter((i) => i.examples.length > 0).length;
const missing = items.filter((i) => i.examples.length === 0);

console.log(`${domainSlug}: ${withExamples}/${total} vocab items have examples`);
if (missing.length > 0 && missing.length <= 30) {
  console.log("Missing:", missing.map((i) => i.chineseForm).join(", "));
} else if (missing.length > 0) {
  console.log(`${missing.length} items missing examples (too many to list)`);
}

await db.$disconnect();
