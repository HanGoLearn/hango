import { db } from "@/lib/db";

export async function getDialoguesForLesson(lessonId: string) {
  return db.dialogue.findMany({
    where: { lessonId, status: "PUBLISHED" },
    include: {
      speakers: { orderBy: { order: "asc" } },
      lines: { orderBy: { order: "asc" }, include: { speaker: true } },
    },
  });
}
