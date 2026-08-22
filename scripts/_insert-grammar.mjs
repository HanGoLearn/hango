import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { readFileSync } from "node:fs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const batch = JSON.parse(readFileSync(process.argv[2], "utf8"));

for (const lessonEntry of batch) {
  const lesson = await db.lesson.findFirst({
    where: { slug: lessonEntry.lessonSlug },
    include: { grammarPoints: { include: { grammarPoint: { include: { examples: true, exercises: true } } } } },
  });
  if (!lesson) {
    console.error(`Lesson not found: ${lessonEntry.lessonSlug}`);
    process.exit(1);
  }
  for (const pointEntry of lessonEntry.points) {
    const link = lesson.grammarPoints.find((g) => g.grammarPoint.name === pointEntry.name);
    if (!link) {
      console.error(`Grammar point not found in lesson ${lessonEntry.lessonSlug}: ${pointEntry.name}`);
      continue;
    }
    const gp = link.grammarPoint;
    if (gp.examples.length < 3) {
      const existingOrders = new Set(gp.examples.map((e) => e.order));
      let nextOrder = 1;
      const toCreate = [];
      for (const ex of pointEntry.examples) {
        while (existingOrders.has(nextOrder)) nextOrder++;
        toCreate.push({ ...ex, order: nextOrder, grammarPointId: gp.id });
        existingOrders.add(nextOrder);
        nextOrder++;
      }
      if (toCreate.length > 0) await db.grammarExample.createMany({ data: toCreate });
    }
    if (gp.exercises.filter((e) => e.status === "PUBLISHED").length < 2) {
      await db.exercise.deleteMany({ where: { grammarPointId: gp.id } });
      for (const [order, exercise] of pointEntry.exercises.entries()) {
        await db.exercise.create({
          data: {
            lessonId: lesson.id,
            grammarPointId: gp.id,
            type: "MULTIPLE_CHOICE",
            difficulty: "INTERMEDIATE",
            prompt: exercise.prompt,
            correctAnswer: { optionIndex: exercise.options.findIndex((o) => o.isCorrect) },
            explanation: exercise.explanation,
            status: "PUBLISHED",
            order,
            options: { create: exercise.options.map((o, i) => ({ content: o.text, isCorrect: o.isCorrect, order: i })) },
          },
        });
      }
    }
  }
  console.log(`Inserted grammar for ${lessonEntry.lessonSlug}`);
}

await db.$disconnect();
