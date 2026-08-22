import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const domainThresholds = {
  "foundations": 3,
  "daily-life": 6, "travel": 6, "getting-around": 6, "making-friends": 6, "health": 6, "work-and-office": 6,
  "everyday-life": 6, "advanced-situations": 6,
};

let totalMissingVocab = 0, totalMissingGrammarEx = 0, totalMissingGrammarExer = 0;

for (const [slug, threshold] of Object.entries(domainThresholds)) {
  const domain = await db.domain.findFirst({ where: { slug } });
  const scenarios = await db.scenario.findMany({
    where: { domainId: domain.id },
    include: {
      levels: { include: { lessons: { include: {
        vocabulary: { include: { vocabularyItem: { include: { examples: true } } } },
        grammarPoints: { include: { grammarPoint: { include: { examples: true, exercises: { where: { status: "PUBLISHED" } } } } } },
      } } } },
    },
  });
  let vocabMissing = [], gpMissingEx = [], gpMissingExer = [];
  for (const sc of scenarios) for (const lv of sc.levels) for (const lesson of lv.lessons) {
    for (const lv2 of lesson.vocabulary) {
      const item = lv2.vocabularyItem;
      if (item.examples.length < threshold) vocabMissing.push(`${lesson.slug} | ${item.chineseForm} | has:${item.examples.length}`);
    }
    for (const g of lesson.grammarPoints) {
      const gp = g.grammarPoint;
      if (gp.examples.length < 3) gpMissingEx.push(`${lesson.slug} | ${gp.name} | ex:${gp.examples.length}`);
      if (gp.exercises.length < 2) gpMissingExer.push(`${lesson.slug} | ${gp.name} | exer:${gp.exercises.length}`);
    }
  }
  totalMissingVocab += vocabMissing.length;
  totalMissingGrammarEx += gpMissingEx.length;
  totalMissingGrammarExer += gpMissingExer.length;
  if (vocabMissing.length || gpMissingEx.length || gpMissingExer.length) {
    console.log(`=== ${slug} ===`);
    vocabMissing.forEach(l => console.log("VOCAB: " + l));
    gpMissingEx.forEach(l => console.log("GRAMMAR_EX: " + l));
    gpMissingExer.forEach(l => console.log("GRAMMAR_EXER: " + l));
  }
}
console.log(`\nTOTALS: vocab=${totalMissingVocab} grammarEx=${totalMissingGrammarEx} grammarExer=${totalMissingGrammarExer}`);
await db.$disconnect();
