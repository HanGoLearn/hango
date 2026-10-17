import { db } from "@/lib/db";
import {
  buildJourneySpeakingBanks,
  JOURNEY_BANK_PLANS,
  journeyBankCandidateSlugs,
} from "@/lib/content/journey-speaking-banks";

/** Current lesson + at most eight related lessons, never the entire chapter. */
export async function getJourneySpeakingBanks(
  userId: string,
  lessonId: string,
) {
  if (!userId || !lessonId || lessonId.length > 100) return null;
  const published = {
    status: "PUBLISHED",
    scenarioLevel: { scenario: { status: "PUBLISHED" } },
  } as const;
  const select = {
    id: true,
    slug: true,
    steps: { select: { id: true, type: true } },
    learnerProgress: {
      where: { userId },
      take: 1,
      select: { completedStepIds: true },
    },
    vocabulary: {
      where: { vocabularyItem: { status: "PUBLISHED" } },
      orderBy: { order: "asc" },
      take: 20,
      select: {
        vocabularyItem: {
          select: {
            id: true,
            chineseForm: true,
            pinyin: true,
            meaning: true,
            status: true,
          },
        },
      },
    },
    grammarPoints: {
      where: { grammarPoint: { status: "PUBLISHED" } },
      orderBy: { order: "asc" },
      take: 8,
      select: {
        grammarPoint: {
          select: { id: true, name: true, structure: true, status: true },
        },
      },
    },
    dialogues: {
      where: { status: "PUBLISHED" },
      take: 2,
      orderBy: { id: "asc" },
      select: {
        lines: {
          orderBy: { order: "asc" },
          take: 12,
          select: { chineseText: true },
        },
      },
    },
  } as const;
  const [selected] = await db.lesson.findMany({
    where: {
      ...published,
      id: lessonId,
      slug: { in: Object.keys(JOURNEY_BANK_PLANS) },
    },
    take: 1,
    select,
  });
  if (!selected || selected.id !== lessonId) return null;
  const candidates = journeyBankCandidateSlugs(selected.slug);
  const related = candidates.length
    ? await db.lesson.findMany({
        where: { ...published, slug: { in: candidates } },
        take: 8,
        orderBy: { slug: "asc" },
        select,
      })
    : [];
  const lessons = [selected, ...related];
  const input = lessons.map((lesson) => {
    const completed = new Set(
      lesson.learnerProgress[0]?.completedStepIds ?? [],
    );
    return {
      id: lesson.id,
      slug: lesson.slug,
      studiedSteps: lesson.steps
        .filter((step) => completed.has(step.id))
        .map((step) => step.type),
      vocabulary: lesson.vocabulary.map((link) => link.vocabularyItem),
      grammar: lesson.grammarPoints.map((link) => link.grammarPoint),
      dialoguePhrases: lesson.dialogues.flatMap((dialogue) =>
        dialogue.lines.map((line) => line.chineseText),
      ),
    };
  });
  const current = input.find((lesson) => lesson.id === lessonId);
  return current ? buildJourneySpeakingBanks(current, input) : null;
}
