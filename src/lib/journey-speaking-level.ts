import { z } from "zod";
import { hskNumberForPoints, tierNameForLevel } from "./points-system";
import type { JourneyAttemptSnapshot } from "./journey-speaking-attempt-contract";

/** Frozen per attempt; earned progress is context, never acoustic evidence. */
export const JOURNEY_SPEAKING_LEVEL_VERSION =
  "journey-speaking-level-2026-10-21-v1";
export const JourneySpeakingLevelSchema = z
  .object({
    version: z.literal(JOURNEY_SPEAKING_LEVEL_VERSION),
    generalPoints: z.number().finite().min(0),
    generalLevel: z.number().int().min(0).max(9),
    lessonLevel: z.number().int().min(1).max(9),
    entryLevel: z.number().int().min(1).max(9),
    stretchLevel: z.number().int().min(1).max(9),
  })
  .strict();
export type JourneySpeakingLevel = z.infer<typeof JourneySpeakingLevelSchema>;

export function buildJourneySpeakingLevel(
  hskReference: number | null,
  difficulty: string,
  generalPoints: number,
): JourneySpeakingLevel {
  const points = Number.isFinite(generalPoints)
    ? Math.max(0, generalPoints)
    : 0;
  const generalLevel = hskNumberForPoints(points);
  const lessonLevel =
    hskReference && Number.isInteger(hskReference)
      ? Math.max(1, Math.min(9, hskReference))
      : difficulty === "ADVANCED"
        ? 6
        : difficulty === "UPPER_INTERMEDIATE"
          ? 5
          : difficulty === "INTERMEDIATE"
            ? 3
            : 1;
  return {
    version: JOURNEY_SPEAKING_LEVEL_VERSION,
    generalPoints: points,
    generalLevel,
    lessonLevel,
    // At most one step of support below the lesson, not an unrelated task.
    entryLevel: Math.max(
      1,
      Math.min(lessonLevel, Math.max(lessonLevel - 1, generalLevel)),
    ),
    // Progress can unlock one bounded stretch, only after clear comprehension.
    stretchLevel: Math.min(
      9,
      lessonLevel + (generalLevel > lessonLevel ? 1 : 0),
    ),
  };
}

export function journeySpeakingLevelInstructions(
  level: JourneySpeakingLevel,
  mode: "conversation" | "evaluation" | "audio" = "audio",
): string {
  return [
    `FROZEN JOURNEY LEVEL ${level.version}: earned General Level ${level.generalLevel} (${tierNameForLevel(level.generalLevel)}), ${level.generalPoints} points. Curriculum task band ${level.lessonLevel}; entry support band ${level.entryLevel}; maximum optional stretch band ${level.stretchLevel}. These internal bands are NOT official HSK certification.`,
    "Spanish/English help pauses immersion and is not an error.",
    ...(mode === "conversation"
      ? [
          "Conversation: begin with the entry support band and the lesson's core words and patterns. Earned progress may reduce scaffolding; optional stretch up to the stated ceiling needs several understood exchanges or an explicit request, never points alone. Keep the same scene and objectives. Do not force advanced language into an early lesson, stack unfamiliar expressions, or repeat known questions to fill targets. Spanish/English help pauses immersion and is not an error.",
        ]
      : [
          "Evaluation: anchor ALL dimensions to the curriculum task band, not a native speaker or the learner's points. Score only demonstrated evidence; no bonus or penalty for earned points, no harder grading for an experienced learner repeating an early lesson, no missing-word quota. A high grade on this task is not global mastery.",
        ]),
    ...(mode === "audio"
      ? [
          level.lessonLevel <= 2
            ? "Early task acoustic anchors: short phrases, deliberate pace and planning pauses are expected. Require intelligible basic initial/final and lexical-tone contrasts, including valid tone sandhi and neutral tones; do not require native speed, long discourse or advanced vocabulary. A single clear syllable is not enough to establish consistent accuracy."
            : level.lessonLevel <= 5
              ? "Developing task acoustic anchors: expect connected familiar phrases, increasingly stable tone contrasts and intelligible phrase grouping. Distinguish normal planning pauses from repeated communication breakdown; do not require native speed or penalize a harmless accent."
              : "Advanced task acoustic anchors: expect sustained intelligible connected speech, stable tone contrasts in context, and purposeful phrase grouping. Evaluate audible recurring disruptions, not accent identity; never invent tone errors from the transcript.",
        ]
      : []),
  ].join("\n");
}

export const JourneyAudioLessonContextSchema = z
  .object({
    contextHash: z.string().regex(/^[a-f0-9]{64}$/),
    level: JourneySpeakingLevelSchema,
    lesson: z
      .object({
        id: z.string().min(1).max(100),
        slug: z.string().min(1).max(100),
        title: z.string().max(300),
        difficulty: z.string().max(40),
        objective: z.string().max(1200),
        successConditions: z.array(z.string().max(400)).max(16),
        coreVocabulary: z.array(z.string().max(120)).max(32),
        coreGrammar: z.array(z.string().max(240)).max(16),
      })
      .strict(),
  })
  .strict();
export type JourneyAudioLessonContext = z.infer<
  typeof JourneyAudioLessonContextSchema
>;

export function buildJourneyAudioLessonContext(
  snapshot: JourneyAttemptSnapshot,
  contextHash: string,
): JourneyAudioLessonContext | undefined {
  if (!snapshot.speakingLevel) return undefined; // Historical attempts stay frozen.
  return JourneyAudioLessonContextSchema.parse({
    contextHash,
    level: snapshot.speakingLevel,
    lesson: {
      id: snapshot.lessonId,
      slug: snapshot.lessonSlug,
      title: snapshot.lessonTitle.slice(0, 300),
      difficulty: snapshot.difficulty,
      objective: snapshot.objective.slice(0, 1200),
      successConditions: snapshot.successConditions
        .slice(0, 16)
        .map((item) => item.text.slice(0, 400)),
      coreVocabulary: snapshot.banks.core.vocabulary
        .slice(0, 32)
        .map((item) => item.text.slice(0, 120)),
      coreGrammar: snapshot.banks.core.grammar
        .slice(0, 16)
        .map((item) => item.text.slice(0, 240)),
    },
  });
}
