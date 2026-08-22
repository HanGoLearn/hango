import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const item = await db.vocabularyItem.findFirst({
  where: { chineseForm: "银行", meaning: "bank" },
  include: { lessons: { include: { lesson: { select: { slug: true, updatedAt: true, createdAt: true } } } } },
});
console.log("VocabularyItem createdAt:", item?.createdAt, "updatedAt:", item?.updatedAt);
for (const l of item?.lessons ?? []) {
  console.log("Lesson:", l.lesson.slug, "createdAt:", l.lesson.createdAt, "updatedAt:", l.lesson.updatedAt);
}

const now = new Date();
console.log("Current server time:", now);

const recentLessons = await db.lesson.findMany({
  orderBy: { createdAt: "desc" },
  take: 5,
  select: { slug: true, createdAt: true },
});
console.log("Most recently created lessons:", recentLessons);

await db.$disconnect();
