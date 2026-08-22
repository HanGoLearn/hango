import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const domain = await db.domain.findFirst({ where: { slug: "foundations" } });
const vocabCount = await db.lessonVocabulary.count({ where: { lesson: { scenarioLevel: { scenario: { domainId: domain.id } } } } });
const gpCount = await db.lessonGrammarPoint.count({ where: { lesson: { scenarioLevel: { scenario: { domainId: domain.id } } } } });
console.log("RESULT vocab links:", vocabCount, "grammar links:", gpCount);
await db.$disconnect();
