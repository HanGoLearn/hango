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
const counts = {};
for (const i of items) {
  counts[i.examples.length] = (counts[i.examples.length] || 0) + 1;
}
console.log(domainSlug, "example-count distribution:", counts);

await db.$disconnect();
