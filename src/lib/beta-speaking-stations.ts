import "server-only";

import {
  BETA_SPEAKING_STATIONS,
  type BetaSpeakingStationDefinition,
} from "@/lib/beta-learning-scope";
import { getSpeakingLessonOptions } from "@/lib/content/speaking-prompts";
import type { AppLocale } from "@/i18n/config";
import type { RolePlayContext } from "@/lib/ai-context";
import { getLessonBySlug } from "@/lib/content/lesson";
import { getMissionForLesson } from "@/lib/content/mission";
import { getDialoguesForLesson } from "@/lib/content/dialogue";
import { getVocabularyForLesson } from "@/lib/content/vocabulary";
import { getGrammarForLesson } from "@/lib/content/grammar";
import {
  buildSpeakingHelp,
  type SpeakingHelpPhrase,
} from "@/lib/speaking-help";

export interface BetaSpeakingConversationData {
  rolePlay: RolePlayContext;
  helpPhrases: SpeakingHelpPhrase[];
}

/** Use the lesson's own Speaking scene, not a scenario capstone or shadowing script. */
export async function getBetaSpeakingStationConversation(
  station: BetaSpeakingStationData,
  locale: AppLocale,
): Promise<BetaSpeakingConversationData | null> {
  const lesson = await getLessonBySlug(station.lessonSlug, locale);
  if (!lesson || lesson.id !== station.lessonId) return null;
  const [mission, dialogues, vocabulary, grammar] = await Promise.all([
    getMissionForLesson(lesson.id, locale),
    getDialoguesForLesson(lesson.id, locale),
    getVocabularyForLesson(lesson.id, locale),
    getGrammarForLesson(lesson.id, locale),
  ]);
  if (!mission) return null;
  const help = buildSpeakingHelp({
    learnerRole: mission.learnerRole ?? "learner",
    vocabulary: vocabulary.map(({ vocabularyItem }) => vocabularyItem),
    grammar: grammar.map(({ grammarPoint }) => grammarPoint),
    dialogues,
  });
  return {
    rolePlay: {
      aiRole: mission.aiRole ?? "conversation partner",
      learnerRole: mission.learnerRole ?? "learner",
      scenarioContext: mission.context ?? "",
      objective: mission.objective,
      lessonVocabulary: vocabulary.map(
        ({ vocabularyItem }) => vocabularyItem.chineseForm,
      ),
      lessonGrammar: grammar.map(({ grammarPoint }) => grammarPoint.structure),
      lessonPhrases: dialogues.flatMap((dialogue) =>
        dialogue.lines.map((line) => line.chineseText),
      ),
      lessonHskLevel: lesson.hskReference ?? undefined,
      correctionMode: "scene",
    },
    helpPhrases: [...help.questions, ...help.thingsToSay].slice(0, 4),
  };
}

export interface BetaSpeakingStationData {
  id: BetaSpeakingStationDefinition["id"];
  lessonId: string;
  lessonSlug: string;
  lessonTitle: string;
  scenarioTitle: string;
}

export async function getBetaSpeakingStations(
  locale: AppLocale,
): Promise<BetaSpeakingStationData[]> {
  const lessonOptions = await getSpeakingLessonOptions(locale);
  const definitions = BETA_SPEAKING_STATIONS.flatMap((definition) => {
    const lesson = lessonOptions.find(
      (option) => option.slug === definition.lessonSlug,
    );
    return lesson ? [{ definition, lesson }] : [];
  });

  return definitions.map(({ definition, lesson }) => ({
    id: definition.id,
    lessonId: lesson.id,
    lessonSlug: lesson.slug,
    lessonTitle: lesson.title,
    scenarioTitle: lesson.scenarioTitle,
  }));
}
