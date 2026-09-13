import { db } from "@/lib/db";
import type { AppLocale } from "@/i18n/config";
import { localizeContentRecord } from "@/lib/content/localization";

export async function getQuizzesForLesson(
  lessonId: string,
  locale: AppLocale = "en",
) {
  const quizzes = await db.quiz.findMany({
    where: { lessonId, status: "PUBLISHED" },
    include: {
      translations: true,
      questions: {
        orderBy: { order: "asc" },
        include: {
          translations: true,
          options: {
            orderBy: { order: "asc" },
            include: { translations: true },
          },
        },
      },
    },
  });

  return quizzes.map((quiz) => {
    const localizedQuiz = localizeContentRecord(quiz, locale, ["title"]);
    return {
      ...localizedQuiz,
      questions: localizedQuiz.questions.map((question) => {
        const localizedQuestion = localizeContentRecord(question, locale, [
          "prompt",
          "explanation",
        ]);
        return {
          ...localizedQuestion,
          options: localizedQuestion.options.map((option) =>
            localizeContentRecord(option, locale, ["content"]),
          ),
        };
      }),
    };
  });
}
