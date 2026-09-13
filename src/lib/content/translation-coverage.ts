import type { AppLocale } from "@/i18n/config";

export const CURRICULUM_TRANSLATION_AREAS = [
  "domains",
  "scenarios",
  "lessons",
  "lessonSteps",
  "learningObjectives",
  "missions",
  "missionSuccessConditions",
  "missionEvaluationCriteria",
  "dialogues",
  "dialogueSpeakers",
  "dialogueLines",
  "vocabularyItems",
  "vocabularyExamples",
  "grammarPoints",
  "grammarExamples",
  "exercises",
  "exerciseOptions",
  "exerciseHints",
  "quizzes",
  "quizQuestions",
  "quizQuestionOptions",
  "writingTasks",
] as const;

export type CurriculumTranslationArea =
  (typeof CURRICULUM_TRANSLATION_AREAS)[number];

export interface TranslationCoverageCount {
  area: CurriculumTranslationArea;
  total: number;
  explicitTranslations: number;
}

export interface TranslationCoverageRow extends TranslationCoverageCount {
  translated: number;
  fallback: number;
  coveragePercent: number;
}

/** English is the canonical base content; other locales require an explicit row. */
export function summarizeTranslationCoverage(
  locale: AppLocale,
  counts: readonly TranslationCoverageCount[],
): TranslationCoverageRow[] {
  return counts.map((count) => {
    const translated =
      locale === "en"
        ? count.total
        : Math.min(count.total, count.explicitTranslations);
    return {
      ...count,
      translated,
      fallback: Math.max(0, count.total - translated),
      coveragePercent:
        count.total === 0 ? 100 : Math.round((translated / count.total) * 100),
    };
  });
}
