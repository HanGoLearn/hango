import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const slug = process.argv[2];
const domain = await db.domain.findFirst({ where: { slug } });
const scenarios = await db.scenario.findMany({
  where: { domainId: domain.id },
  orderBy: { order: "asc" },
  include: {
    levels: { orderBy: { order: "asc" }, include: { lessons: { orderBy: { order: "asc" }, include: {
      vocabulary: { include: { vocabularyItem: true } },
      grammarPoints: { include: { grammarPoint: { include: { examples: { orderBy: { order: "asc" } } } } } },
    } } } },
  },
});
for (const sc of scenarios) for (const lv of sc.levels) for (const lesson of lv.lessons) {
  console.log(`=== LESSON: ${lesson.slug} (${lesson.title}) ===`);
  console.log("VOCAB:");
  for (const v of lesson.vocabulary) console.log(`  ${v.vocabularyItem.chineseForm} | ${v.vocabularyItem.pinyin} | ${v.vocabularyItem.meaning}`);
  console.log("GRAMMAR:");
  for (const g of lesson.grammarPoints) {
    const gp = g.grammarPoint;
    const ex0 = gp.examples[0];
    console.log(`  ${gp.name} | ${gp.structure} | ex0: ${ex0 ? ex0.chineseText+" | "+ex0.pinyin+" | "+ex0.translation : "NONE"}`);
  }
  console.log("");
}
await db.$disconnect();
