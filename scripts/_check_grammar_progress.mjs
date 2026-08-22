import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const domainSlug = process.argv[2] || "foundations";

const points = await db.grammarPoint.findMany({
  where: {
    lessons: { some: { lesson: { scenarioLevel: { scenario: { domain: { slug: domainSlug } } } } } },
  },
  include: { examples: true, exercises: { where: { status: "PUBLISHED" } } },
});

const exCounts = {};
const exerCounts = {};
for (const p of points) {
  exCounts[p.examples.length] = (exCounts[p.examples.length] || 0) + 1;
  exerCounts[p.exercises.length] = (exerCounts[p.exercises.length] || 0) + 1;
}
console.log(domainSlug, "total points:", points.length);
console.log("example-count distribution:", exCounts);
console.log("published-exercise-count distribution:", exerCounts);

const incomplete = points.filter((p) => p.examples.length < 3 || p.exercises.length < 2);
if (incomplete.length > 0 && incomplete.length <= 20) {
  console.log("Incomplete points:", incomplete.map((p) => p.name).join(" | "));
} else if (incomplete.length > 0) {
  console.log(`${incomplete.length} incomplete points (too many to list)`);
}

await db.$disconnect();
