/**
 * Measures the REAL database-operations cost of one full, realistic
 * lesson session (Vocabulary -> Grammar -> Situation -> Comprehension ->
 * Speaking -> Reflection), end to end, calling the exact same data-layer
 * functions the real app's UI calls - not raw Prisma queries picked to
 * look favorable.
 *
 * WHY THIS EXISTS: user asked, after Prisma Postgres hit its 100,000-
 * operation quota, how many operations a real ~30-minute lesson session
 * actually costs - see project/db-operations-optimization.md. This is
 * the tool to get a REAL measured number instead of a code-reading
 * estimate (which was too wide a range - 150 to 450+ - to be useful).
 *
 * COST WARNING: this makes 2 real, paid AI-provider calls (Reflection's
 * speaking-score grading + narrative generation). Small but real money -
 * don't run this repeatedly without reason.
 *
 * AUTH: calls the data-layer functions directly, bypassing auth()/HTTP -
 * the same pattern already used throughout this project's own
 * integration tests (e.g. tests/integration/placement-exam.test.ts).
 * This is a trusted local script run by the project owner, not a live
 * request, so there is no real user session to authenticate or bypass.
 *
 * CLEANUP: creates one throwaway test user, then deletes it in a
 * `finally` block (runs even if a step throws). Every relevant table
 * cascades from User via `onDelete: Cascade` (confirmed in
 * prisma/schema.prisma), so deleting the user alone cleans up
 * everything this run creates: LearnerLessonProgress,
 * LearnerLessonCompletion, VocabularyQuizAttempt,
 * LearnerVocabularyInteraction, ExerciseAttempt, AiConversation +
 * AiMessage, LessonReflectionReport, ProgressEvidence.
 *
 * HOW TO MEASURE:
 * 1. Check your current Operations count in the Prisma Console.
 * 2. Run: npx vitest run scripts/measure-lesson-operations.test.ts
 * 3. Check the Operations count again - the delta is one full lesson's
 *    real cost. Multiply by however many lessons/day you want to model.
 *
 * WHY THIS RUNS VIA VITEST, NOT PLAIN NODE/TSX: several imported modules
 * (reflection.ts, vocabulary-interactivity.ts, grammar-interactivity.ts,
 * db.ts) start with `import "server-only"`, a package whose default
 * export unconditionally throws unless resolved under the "react-server"
 * condition (Next.js's own bundler sets this; plain node/tsx does not).
 * Vitest's resolution handled this correctly for the same kind of direct
 * data-layer import earlier this session - plain tsx did not.
 *
 * RUNNING THIS FILE SPECIFICALLY (not part of the normal suite): it
 * lives in tests/manual/, which matches vitest.config.mts's `tests/**`
 * include glob (so `npx vitest run <this file>` finds it directly - a
 * bare `scripts/` location does NOT match that glob and fails with "No
 * test files found", confirmed 2026-08-19). None of the `npm run test:*`
 * scripts target `tests/manual` specifically (they target tests/unit,
 * tests/component, tests/integration, tests/smoke), so `npm test` never
 * picks this up automatically - only an explicit `vitest run <this file>`
 * runs it.
 *
 * VERIFIED: run successfully multiple times once Prisma Postgres was
 * unblocked (project/db-operations-optimization.md) - real measured
 * baseline was ~500 operations/lesson before that document's Tier 1-4
 * fixes. Updated again 2026-08-19 (project/learning-journey-optimization.md
 * Facets B/C) to match the Vocabulary/Grammar steps no longer fetching
 * examples/exercises separately per item - re-run this after that change
 * to get a fresh real number, the ~500 baseline above predates it.
 */
import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { getLessonBySlug } from "@/lib/content/lesson";
import { getVocabularyForLesson } from "@/lib/content/vocabulary";
import { getGrammarForLesson } from "@/lib/content/grammar";
import { getExercisesForLesson } from "@/lib/content/exercise";
import {
  canAccessLesson,
  getOrCreateLessonProgress,
  advanceLessonStep,
} from "@/lib/lesson-progress-data";
import {
  recordVocabularyWordSeen,
  recordVocabularyQuizAttempts,
} from "@/lib/vocabulary-interactivity";
import {
  recordExerciseAttempt,
  recordExerciseAttempts,
} from "@/lib/exercise-progress-data";
import { saveRealtimeConversationTurn } from "@/lib/ai-teacher-data";
import { getOrGenerateLessonReflectionReport } from "@/lib/reflection";
import type { ExerciseAnswer } from "@/lib/exercise-progress";

/**
 * A real, seeded, PUBLISHED lesson with all 6 relevant step types
 * (prisma/seed.ts) - swap if that lesson is ever renamed/removed.
 */
const LESSON_SLUG = "restaurant-entering-and-ordering";

function answerForExercise(exercise: {
  type: string;
  options: { id: string }[];
}): ExerciseAnswer {
  switch (exercise.type) {
    case "MULTIPLE_CHOICE":
    case "TRUE_FALSE":
      return { type: exercise.type, optionId: exercise.options[0]!.id };
    case "SENTENCE_ORDERING":
      return { type: "SENTENCE_ORDERING", order: exercise.options.map((o) => o.id) };
    case "MATCHING":
      return { type: "MATCHING", pairs: [] };
    case "FILL_IN_BLANK":
      return { type: "FILL_IN_BLANK", text: "测试" };
    default:
      return { type: "SHORT_RESPONSE", text: "我觉得这个很有意思。" };
  }
}

describe("manual measurement tool - not part of the regular CI suite", () => {
  it("runs one full lesson session and leaves the database clean afterward", async () => {
    const email = `db-ops-measurement-${Date.now()}@hango.dev`;
    const user = await db.user.create({ data: { email } });
    console.log("Created throwaway measurement user:", user.id, email);

    try {
      const lesson = await getLessonBySlug(LESSON_SLUG);
      if (!lesson) {
        throw new Error(
          `Seed lesson "${LESSON_SLUG}" not found - update LESSON_SLUG at the top of this file to a real published lesson slug.`,
        );
      }
      const steps = lesson.steps;

      const canAccess = await canAccessLesson(user.id, lesson);
      console.log("canAccessLesson:", canAccess);
      await getOrCreateLessonProgress(user.id, lesson.id, steps[0]!.id);

      // --- VOCABULARY ---
      // Examples arrive already loaded with getVocabularyForLesson (2026-08-19,
      // project/learning-journey-optimization.md Facet C) - the real
      // Vocabulary Step no longer calls getVocabularyExamples per word, just
      // recordVocabularyWordSeen (interaction tracking only, no content).
      // Quiz answers are buffered per word and flushed as one batched call
      // when leaving the word (Facet C follow-up, same date) - simulated
      // here the same way, not as 5 separate calls.
      const vocabStep = steps.find((s) => s.type === "VOCABULARY");
      const vocabulary = await getVocabularyForLesson(lesson.id);
      console.log(`Vocabulary: ${vocabulary.length} words`);
      for (const v of vocabulary) {
        const item = v.vocabularyItem;
        await recordVocabularyWordSeen(user.id, item.id);
        // 5 quiz questions per word at INTERMEDIATE difficulty
        // (vocabularyQuestionsPerWord() in points-system.ts).
        const questionKeys = [
          `${item.id}:meaning`,
          `${item.id}:chineseForm`,
          `${item.id}:blank:0`,
          `${item.id}:blank:1`,
          `${item.id}:order`,
        ];
        await recordVocabularyQuizAttempts(
          user.id,
          lesson.id,
          questionKeys.map((questionKey) => ({
            vocabularyItemId: item.id,
            questionKey,
            isCorrect: true,
          })),
        );
      }
      if (vocabStep) {
        await advanceLessonStep(user.id, lesson.id, vocabStep.id, steps, undefined);
      }

      // --- GRAMMAR ---
      // Examples and exercises both arrive already loaded with
      // getGrammarForLesson (exercises added 2026-08-19, project/
      // learning-journey-optimization.md Facet B) - the real Grammar Step
      // no longer fetches either separately. Practice is graded in one
      // batched call (recordExerciseAttempts), not one call per exercise
      // (2026-08-19, same doc, "el grande con el cambio de experiencia") -
      // matches the real Grammar Step's "Check answers" button exactly.
      const grammarStep = steps.find((s) => s.type === "GRAMMAR");
      const grammarPoints = await getGrammarForLesson(lesson.id);
      const grammarExercises = grammarPoints.flatMap((g) => g.grammarPoint.exercises);
      console.log(
        `Grammar points: ${grammarPoints.length}, exercises: ${grammarExercises.length}`,
      );
      if (grammarExercises.length > 0) {
        await recordExerciseAttempts(
          user.id,
          grammarExercises.map((exercise) => ({
            exerciseId: exercise.id,
            answer: answerForExercise(exercise),
          })),
        );
      }
      if (grammarStep) {
        await advanceLessonStep(user.id, lesson.id, grammarStep.id, steps, undefined);
      }

      // --- SITUATION (read-only content, no submit action) ---
      const situationStep = steps.find((s) => s.type === "SITUATION");
      if (situationStep) {
        await advanceLessonStep(user.id, lesson.id, situationStep.id, steps, undefined);
      }

      // --- COMPREHENSION ---
      const comprehensionStep = steps.find((s) => s.type === "COMPREHENSION");
      const comprehensionExercises = await getExercisesForLesson(lesson.id);
      console.log(`Comprehension exercises: ${comprehensionExercises.length}`);
      for (const exercise of comprehensionExercises) {
        await recordExerciseAttempt(user.id, exercise.id, answerForExercise(exercise));
      }
      if (comprehensionStep) {
        await advanceLessonStep(user.id, lesson.id, comprehensionStep.id, steps, undefined);
      }

      // --- SPEAKING (synthetic transcript - live audio can't be scripted) ---
      const speakingStep = steps.find((s) => s.type === "SPEAKING");
      const mission = await db.mission.findFirst({
        where: { lessonId: lesson.id, status: "PUBLISHED" },
      });
      if (mission) {
        const rolePlay = {
          aiRole: mission.aiRole ?? "the AI",
          learnerRole: mission.learnerRole ?? "the learner",
          scenarioContext: mission.context ?? "",
          objective: mission.objective,
        };
        // Needs >=2 substantive learner turns or >=6 Chinese characters
        // to count as real Speaking evidence (hasEnoughSpeakingEvidence,
        // reflection-prompt.ts) - 3 turns comfortably clears that.
        const turns: [string, string][] = [
          ["你好，我想点菜。", "你好！请问你们想吃点什么？"],
          ["我要一份炒饭和一杯茶，谢谢。", "好的，还需要别的吗？"],
          ["不用了，这些就够了。", "好，马上就来。"],
        ];
        for (const [userText, assistantText] of turns) {
          await saveRealtimeConversationTurn(user.id, userText, assistantText, {
            lessonTitle: lesson.title,
            rolePlay,
          });
        }
      } else {
        console.log(
          "No published Mission for this lesson - Speaking score will be null. Fine for a cost measurement, just note it's not exercising that code path.",
        );
      }
      if (speakingStep) {
        await advanceLessonStep(user.id, lesson.id, speakingStep.id, steps, undefined);
      }

      // --- REFLECTION (the 2 real AI-provider calls happen here) ---
      const reflectionStep = steps.find((s) => s.type === "REFLECTION");
      const report = await getOrGenerateLessonReflectionReport(user.id, lesson.id);
      console.log("Reflection total score:", report.totalScore);
      expect(report).toBeTruthy();
      if (reflectionStep) {
        const result = await advanceLessonStep(user.id, lesson.id, reflectionStep.id, steps, undefined);
        console.log("Lesson completedAt:", result.completedAt);
        expect(result.completedAt).not.toBeNull();
      }

      console.log(
        "Simulated lesson run complete - check the Prisma Console Operations delta now.",
      );
    } finally {
      // Cascades every row this run created.
      await db.user.delete({ where: { id: user.id } });
      console.log("Cleaned up throwaway measurement user.");
    }
  }, 120000);
});
