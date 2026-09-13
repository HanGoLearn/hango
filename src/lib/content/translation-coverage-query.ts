import type { PrismaClient } from "@/generated/prisma/client";
import type { AppLocale } from "@/i18n/config";
import { contentLanguageForLocale } from "@/lib/content/localization";
import {
  summarizeTranslationCoverage,
  type CurriculumTranslationArea,
  type TranslationCoverageCount,
} from "@/lib/content/translation-coverage";

async function countArea(
  area: CurriculumTranslationArea,
  totalPromise: PromiseLike<number>,
  translationPromise: PromiseLike<number>,
): Promise<TranslationCoverageCount> {
  const [total, explicitTranslations] = await Promise.all([
    totalPromise,
    translationPromise,
  ]);
  return { area, total, explicitTranslations };
}

export async function queryCurriculumTranslationCoverage(
  database: PrismaClient,
  locale: AppLocale,
) {
  const language = contentLanguageForLocale(locale);
  const counts = await Promise.all([
    countArea(
      "domains",
      database.domain.count(),
      database.domainTranslation.count({ where: { locale: language } }),
    ),
    countArea(
      "scenarios",
      database.scenario.count(),
      database.scenarioTranslation.count({ where: { locale: language } }),
    ),
    countArea(
      "lessons",
      database.lesson.count(),
      database.lessonTranslation.count({ where: { locale: language } }),
    ),
    countArea(
      "lessonSteps",
      database.lessonStep.count(),
      database.lessonStepTranslation.count({ where: { locale: language } }),
    ),
    countArea(
      "learningObjectives",
      database.learningObjective.count(),
      database.learningObjectiveTranslation.count({
        where: { locale: language },
      }),
    ),
    countArea(
      "missions",
      database.mission.count(),
      database.missionTranslation.count({ where: { locale: language } }),
    ),
    countArea(
      "missionSuccessConditions",
      database.missionSuccessCondition.count(),
      database.missionSuccessConditionTranslation.count({
        where: { locale: language },
      }),
    ),
    countArea(
      "missionEvaluationCriteria",
      database.missionEvaluationCriterion.count(),
      database.missionEvaluationCriterionTranslation.count({
        where: { locale: language },
      }),
    ),
    countArea(
      "dialogues",
      database.dialogue.count(),
      database.dialogueTranslation.count({ where: { locale: language } }),
    ),
    countArea(
      "dialogueSpeakers",
      database.dialogueSpeaker.count(),
      database.dialogueSpeakerTranslation.count({
        where: { locale: language },
      }),
    ),
    countArea(
      "dialogueLines",
      database.dialogueLine.count(),
      database.dialogueLineTranslation.count({
        where: { locale: language },
      }),
    ),
    countArea(
      "vocabularyItems",
      database.vocabularyItem.count(),
      database.vocabularyItemTranslation.count({
        where: { locale: language },
      }),
    ),
    countArea(
      "vocabularyExamples",
      database.vocabularyExample.count(),
      database.vocabularyExampleTranslation.count({
        where: { locale: language },
      }),
    ),
    countArea(
      "grammarPoints",
      database.grammarPoint.count(),
      database.grammarPointTranslation.count({
        where: { locale: language },
      }),
    ),
    countArea(
      "grammarExamples",
      database.grammarExample.count(),
      database.grammarExampleTranslation.count({
        where: { locale: language },
      }),
    ),
    countArea(
      "exercises",
      database.exercise.count(),
      database.exerciseTranslation.count({ where: { locale: language } }),
    ),
    countArea(
      "exerciseOptions",
      database.exerciseOption.count(),
      database.exerciseOptionTranslation.count({
        where: { locale: language },
      }),
    ),
    countArea(
      "exerciseHints",
      database.exerciseHint.count(),
      database.exerciseHintTranslation.count({ where: { locale: language } }),
    ),
    countArea(
      "quizzes",
      database.quiz.count(),
      database.quizTranslation.count({ where: { locale: language } }),
    ),
    countArea(
      "quizQuestions",
      database.quizQuestion.count(),
      database.quizQuestionTranslation.count({
        where: { locale: language },
      }),
    ),
    countArea(
      "quizQuestionOptions",
      database.quizQuestionOption.count(),
      database.quizQuestionOptionTranslation.count({
        where: { locale: language },
      }),
    ),
    countArea(
      "writingTasks",
      database.writingTask.count(),
      database.writingTaskTranslation.count({
        where: { locale: language },
      }),
    ),
  ]);

  return summarizeTranslationCoverage(locale, counts);
}
