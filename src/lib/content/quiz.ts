import { db } from "@/lib/db";

export async function getQuizzesForLesson(lessonId: string) {
  return db.quiz.findMany({
    where: { lessonId, status: "PUBLISHED" },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: { options: { orderBy: { order: "asc" } } },
      },
    },
  });
}
