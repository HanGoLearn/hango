import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const items = await db.vocabularyItem.findMany({
  where: { chineseForm: "银行" },
  include: { examples: true, lessons: { include: { lesson: { select: { slug: true } } } } },
});
for (const item of items) {
  console.log(`id=${item.id} pinyin=${item.pinyin} meaning=${item.meaning} examples=${item.examples.length} lessons=${item.lessons.map(l=>l.lesson.slug).join(",")}`);
}
await db.$disconnect();
