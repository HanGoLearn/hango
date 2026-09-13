import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { queryCurriculumTranslationCoverage } from "@/lib/content/translation-coverage-query";

config({ path: ".env.local" });

async function main() {
  const locale = process.argv[2] === "en" ? "en" : "es";
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required.");

  const database = new PrismaClient({
    adapter: new PrismaPg({ connectionString, max: 2 }),
  });

  try {
    const rows = await queryCurriculumTranslationCoverage(database, locale);
    console.log(`Curriculum translation coverage: ${locale.toUpperCase()}`);
    console.table(
      rows.map((row) => ({
        area: row.area,
        translated: `${row.translated}/${row.total}`,
        fallback: row.fallback,
        coverage: `${row.coveragePercent}%`,
        explicitRows: row.explicitTranslations,
      })),
    );
  } finally {
    await database.$disconnect();
  }
}

void main();
