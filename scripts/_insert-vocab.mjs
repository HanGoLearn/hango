import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { readFileSync } from "node:fs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const batch = JSON.parse(readFileSync(process.argv[2], "utf8"));

for (const lessonEntry of batch) {
  const lesson = await db.lesson.findFirst({
    where: { slug: lessonEntry.lessonSlug },
    include: { vocabulary: { include: { vocabularyItem: { include: { examples: true } } } } },
  });
  if (!lesson) {
    console.error(`Lesson not found: ${lessonEntry.lessonSlug}`);
    process.exit(1);
  }
  for (const wordEntry of lessonEntry.words) {
    const link = lesson.vocabulary.find((v) => v.vocabularyItem.chineseForm === wordEntry.chineseForm);
    if (!link) {
      console.error(`Word not found in lesson ${lessonEntry.lessonSlug}: ${wordEntry.chineseForm}`);
      continue;
    }
    if (link.vocabularyItem.examples.length > 0) continue;
    await db.vocabularyExample.createMany({
      data: wordEntry.examples.map((ex, order) => ({
        vocabularyItemId: link.vocabularyItemId,
        order,
        chineseText: ex.chineseText,
        pinyin: ex.pinyin,
        translation: ex.translation,
      })),
    });
  }
  console.log(`Inserted vocab for ${lessonEntry.lessonSlug}`);
}

await db.$disconnect();
