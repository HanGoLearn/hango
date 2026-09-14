import { db } from "@/lib/db";
import { getLessonBySlug } from "@/lib/content/lesson";
import { getDialoguesForLesson } from "@/lib/content/dialogue";
import {
  getMissionForLesson,
  getMissionForScenario,
} from "@/lib/content/mission";
import type { JourneyChapter } from "@/lib/content/learning-journey";
import { getPublishedJourneyLessonSequence } from "@/lib/content/learning-journey-data";
import { createTtlCache } from "@/lib/ttl-cache";
import type { AppLocale } from "@/i18n/config";

export interface ShadowingLine {
  id: string;
  chineseText: string;
  pinyin: string;
  speakerName: string;
  speakerOrder: number;
}

export interface SpeakingPrompt {
  prompt: string;
  lessonId?: string;
  scenarioId?: string;
  /** Only set for SHADOWING, where the target text is exact - enables local tone-contour scoring (tone-analysis.ts). */
  pinyin?: string;
  /** Only set for SHADOWING - lets the learner play the lesson's own native-speaker dialogue audio before shadowing it. */
  dialogueId?: string;
  /** Only set for SHADOWING - the dialogue's individual lines, for the "Conversation" shadowing sub-mode (conversation-shadowing.tsx). */
  lines?: ShadowingLine[];
}

export interface SpeakingLessonOption {
  id: string;
  slug: string;
  title: string;
  scenarioTitle: string;
  scenarioSlug: string;
  /** The owning ScenarioLevel, shown in the QA picker so a report maps back to the exact Learning Journey section. */
  difficulty: string;
  /** Same chapter grouping as the Learning Journey page (CHAPTER_CONFIG, content/learning-journey.ts) - lets the picker group by Foundations/Everyday Life/Advanced Situations instead of one flat list. */
  chapter: JourneyChapter;
}

/** No live publish/unpublish action exists in this app - content only changes via seed scripts/migrations, same reasoning as every other Tier 3 curriculum cache this session (getLessonCompetencyIds, getCachedPublishedScenarioTree). */
const SPEAKING_LESSON_OPTIONS_TTL_MS = 5 * 60 * 1000;

/**
 * Every published lesson, for the Speaking Lab's lesson picker - fixes the
 * FASE 10 placeholder that only ever offered Restaurant Lesson 1. Cached
 * (2026-08-21, project/learning-journey-optimization.md): this same,
 * user-independent, 164-lesson query was already running twice per
 * Speaking Lab page load (page.tsx calls this directly AND
 * getSpeakingPrompts calls it again internally when no lessonId is in the
 * URL, both inside the same Promise.all) - the exact stampede shape
 * already found and fixed at the ttl-cache.ts level for
 * getContinueLearningTarget/getScenariosWithProgress, so wrapping this in
 * the same cache collapses both the in-request duplicate and every
 * repeat page load within the TTL window down to zero extra operations.
 */
export const getSpeakingLessonOptions = createTtlCache(
  async (locale: AppLocale = "en"): Promise<SpeakingLessonOption[]> => {
    const lessons = await getPublishedJourneyLessonSequence(locale);
    return lessons.map((lesson) => ({
      id: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
      scenarioTitle: lesson.scenarioTitle,
      scenarioSlug: lesson.scenarioSlug,
      difficulty: lesson.difficulty,
      chapter: lesson.chapter,
    }));
  },
  SPEAKING_LESSON_OPTIONS_TTL_MS,
);

/**
 * Sources speaking prompts from existing lesson content instead of a
 * dedicated content model (same approach as the original FASE 10 version -
 * no docs define a "speaking prompt" entity distinct from what
 * dialogues/missions already provide). Now takes a `lessonId` so every
 * published lesson can be practiced, not just one hardcoded lesson.
 *
 * Only Shadowing and Scenario Role Play remain here - Pronunciation and
 * Guided Conversation were removed from Speaking Lab entirely (user
 * decision, 2026-08-08): "Practice with Han" (free-topic-practice.tsx)
 * covers open-ended spoken practice better than a fixed one-word or
 * one-objective prompt did. Shadowing uses the lesson's *entire* dialogue
 * (all lines, long-form) rather than a single line, since we already have
 * native-speaker audio for the whole thing (dialogue-audio.ts); Scenario
 * Role Play uses the lesson's mission.
 */
export async function getSpeakingPrompts(lessonId?: string): Promise<{
  SHADOWING: SpeakingPrompt | null;
  SCENARIO_ROLE_PLAY: SpeakingPrompt | null;
}> {
  const empty = { SHADOWING: null, SCENARIO_ROLE_PLAY: null };

  const resolvedLessonId =
    lessonId ?? (await getSpeakingLessonOptions())[0]?.id;
  const lesson = resolvedLessonId
    ? await db.lesson.findFirst({
        where: { id: resolvedLessonId, status: "PUBLISHED" },
      })
    : null;
  if (!lesson) return empty;

  // getLessonBySlug pulls in the scenarioLevel/scenario relation the same
  // way the rest of the app already resolves a lesson's owning scenario.
  const lessonWithScenario = await getLessonBySlug(lesson.slug);
  if (!lessonWithScenario) return empty;
  const scenario = lessonWithScenario.scenarioLevel.scenario;

  const [dialogues, scenarioMission] = await Promise.all([
    getDialoguesForLesson(lesson.id),
    getMissionForScenario(scenario.id),
  ]);
  // Prefer the scenario's own final mission (a capstone spanning the whole
  // scenario) over the lesson's own mission, same preference the FASE 10
  // version used - most scenarios only seed the lesson-level one, though.
  const mission = scenarioMission ?? (await getMissionForLesson(lesson.id));

  const dialogue = dialogues[0];
  const shadowingText = dialogue?.lines
    .map((line) => line.chineseText)
    .join("");
  const shadowingPinyin = dialogue?.lines.map((line) => line.pinyin).join(" ");

  return {
    SHADOWING:
      dialogue && shadowingText
        ? {
            prompt: shadowingText,
            pinyin: shadowingPinyin,
            lessonId: lesson.id,
            dialogueId: dialogue.id,
            lines: dialogue.lines.map((line) => ({
              id: line.id,
              chineseText: line.chineseText,
              pinyin: line.pinyin,
              speakerName: line.speaker.name,
              speakerOrder: line.speaker.order,
            })),
          }
        : null,
    // lessonId is only set when falling back to the lesson's own mission -
    // a scenario-final-mission session isn't lesson-scoped, so it must stay
    // scenario-only (recordSpeakingEvidence in speaking-data.ts only
    // records competency evidence for lesson-scoped sessions; a scenario
    // capstone attempt shouldn't be misattributed to this one lesson).
    SCENARIO_ROLE_PLAY: mission
      ? scenarioMission
        ? { prompt: mission.objective, scenarioId: scenario.id }
        : { prompt: mission.objective, lessonId: lesson.id }
      : null,
  };
}
