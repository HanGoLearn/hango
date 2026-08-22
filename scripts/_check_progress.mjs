import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });
const lessonCount = await db.lesson.count();
const domainCount = await db.domain.count();
console.log(`Domains: ${domainCount}, Lessons: ${lessonCount}`);
await db.$disconnect();
