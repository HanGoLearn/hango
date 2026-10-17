import "server-only";
import { db } from "@/lib/db";
import {
  planVocabularyQuestions,
  buildFillBlankQuestion,
  buildSentenceOrderQuestion,
} from "@/lib/content/vocabulary-quiz";
import {
  JOURNEY_LESSON_REPORT_VERSION,
  JourneyAssessmentSnapshotSchema,
  selectJourneyQuestionEvidence,
  passedJourneyQuickTestEvidence,
} from "@/lib/journey-lesson-report";

/** Freeze existing server-graded exercise evidence before the voice session.
 * No grades supplied by the browser, new AI calls, or legacy report writes. */
export async function getJourneyAssessmentSnapshot(
  userId: string,
  lessonId: string,
) {
  return db.$transaction(
    async (tx) => {
      const progress = await tx.learnerLessonProgress.findUnique({
        where: { userId_lessonId: { userId, lessonId } },
        select: { id: true, startedAt: true },
      });
      // Standalone capture tests/QA do not fabricate a completed lesson run.
      if (!progress) return undefined;
      const lesson = await tx.lesson.findUniqueOrThrow({
        where: { id: lessonId },
        select: {
          scenarioLevel: { select: { difficulty: true } },
          vocabulary: {
            where: { vocabularyItem: { status: "PUBLISHED" } },
            orderBy: { order: "asc" },
            select: {
              vocabularyItem: {
                select: {
                  id: true,
                  chineseForm: true,
                  meaning: true,
                  pinyin: true,
                  examples: {
                    orderBy: { order: "asc" },
                    select: { chineseText: true, translation: true },
                  },
                },
              },
            },
          },
          grammarPoints: {
            where: { grammarPoint: { status: "PUBLISHED" } },
            select: {
              grammarPoint: {
                select: {
                  exercises: {
                    where: { status: "PUBLISHED" },
                    select: { id: true },
                  },
                },
              },
            },
          },
        },
      });
      const comprehension = await tx.exercise.findMany({
        where: { lessonId, status: "PUBLISHED", grammarPointId: null },
        orderBy: [{ order: "asc" }, { id: "asc" }],
        select: { id: true },
      });
      // This preserves the existing combined comprehension/guided-practice
      // category; grammar exercises follow the actual published Grammar cards.
      const grammarKeys = [
        ...new Set(
          lesson.grammarPoints.flatMap((item) =>
            item.grammarPoint.exercises.map((exercise) => exercise.id),
          ),
        ),
      ];
      const comprehensionKeys = comprehension.map((item) => item.id);
      const exerciseKeys = [...grammarKeys, ...comprehensionKeys];
      const capturedAt = new Date();
      const [vocabularyAttempts, exerciseAttempts] = await Promise.all([
        tx.vocabularyQuizAttempt.findMany({
          where: {
            userId,
            lessonId,
            createdAt: { gte: progress.startedAt, lte: capturedAt },
          },
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
          take: 10_000,
          select: { id: true, questionKey: true, isCorrect: true },
        }),
        tx.exerciseAttempt.findMany({
          where: {
            userId,
            exerciseId: { in: exerciseKeys },
            createdAt: { gte: progress.startedAt, lte: capturedAt },
          },
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
          take: 10_000,
          select: { id: true, exerciseId: true, isCorrect: true },
        }),
      ]);
      // Do not turn a truncated query into a false missing/error report.
      if (
        vocabularyAttempts.length === 10_000 ||
        exerciseAttempts.length === 10_000
      )
        throw new Error("Assessment attempt read limit reached");
      const firstVocabulary = new Map<string, boolean>();
      for (const row of vocabularyAttempts)
        if (!firstVocabulary.has(row.questionKey))
          firstVocabulary.set(row.questionKey, row.isCorrect);
      const items = lesson.vocabulary.map((item) => item.vocabularyItem);
      const vocabularyKeys = items.flatMap((item) => {
        const quick = `${item.id}:quicktest`;
        if (firstVocabulary.get(quick) === true) return [quick];
        return planVocabularyQuestions(
          item.id,
          lessonId,
          lesson.scenarioLevel.difficulty,
          item.examples.length,
        )
          .filter((question) => {
            const example = item.examples[question.exampleIndex ?? -1];
            if (question.type === "blank")
              return Boolean(
                example &&
                buildFillBlankQuestion(items, item.id, example.chineseText),
              );
            if (question.type === "order")
              return Boolean(
                example &&
                buildSentenceOrderQuestion(
                  items,
                  item.id,
                  example.chineseText,
                  example.translation,
                ),
              );
            return true;
          })
          .map((question) => question.key);
      });
      const evidence = exerciseAttempts.map((row) => ({
        ...row,
        key: row.exerciseId,
      }));
      return JourneyAssessmentSnapshotSchema.parse({
        version: JOURNEY_LESSON_REPORT_VERSION,
        progressId: progress.id,
        progressStartedAt: progress.startedAt.toISOString(),
        capturedAt: capturedAt.toISOString(),
        vocabulary:
          passedJourneyQuickTestEvidence(
            items.map((item) => item.id),
            vocabularyAttempts.map((row) => ({ ...row, key: row.questionKey })),
          ) ??
          selectJourneyQuestionEvidence(
            vocabularyKeys,
            vocabularyAttempts.map((row) => ({ ...row, key: row.questionKey })),
          ),
        grammar: selectJourneyQuestionEvidence(grammarKeys, evidence),
        comprehension: selectJourneyQuestionEvidence(
          comprehensionKeys,
          evidence,
        ),
      });
    },
    { isolationLevel: "RepeatableRead" },
  );
}
