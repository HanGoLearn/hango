/**
 * Measures the REAL database-operations cost of ONLY the batched Grammar
 * submission (`recordExerciseAttempts`), isolated from every other lesson
 * step - project/learning-journey-optimization.md, "solo el grammar voló
 * a 216 operaciones, que paso?" (2026-08-19).
 *
 * WHY THIS EXISTS (separate from measure-lesson-operations.test.ts): that
 * script's delta covers Vocabulary + Grammar + Situation + Comprehension +
 * Speaking + Reflection together, so it can't isolate Grammar's own cost -
 * and it also makes 2 real, paid OpenAI calls (Speaking grading +
 * Reflection narrative), which is not safe to re-run right now (user
 * confirmed $0.00 OpenAI balance same day). This script touches only
 * `recordExerciseAttempts` - no AI calls, no other steps - so the Console
 * delta maps 1:1 to exactly what the user measured.
 *
 * HOW TO MEASURE:
 * 1. Check your current Operations count in the Prisma Console.
 * 2. Run: npx vitest run tests/manual/measure-grammar-operations.test.ts
 * 3. Check the Operations count again - the delta is the real, isolated
 *    cost of one Grammar-step "Check answers" submission for this lesson's
 *    exercise count. Compare that delta directly against the 216 figure.
 *
 * Lives in tests/manual/ (not scripts/) so it matches vitest.config.mts's
 * `tests/**` include glob and is directly runnable - a bare `scripts/`
 * location does NOT match that glob and fails with "No test files found"
 * (confirmed 2026-08-19). None of the `npm run test:*` scripts target
 * `tests/manual` specifically, so `npm test` never picks this up.
 *
 * AUTH: calls the data-layer function directly, bypassing auth()/HTTP -
 * same pattern as every other integration test in this repo.
 *
 * CLEANUP: creates one throwaway test user, deletes it in a `finally`
 * block (runs even if the step throws) - every relevant table cascades
 * from User via `onDelete: Cascade` (prisma/schema.prisma), so deleting
 * the user alone cleans up the ExerciseAttempt + ProgressEvidence rows
 * this run creates.
 */
import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { getLessonBySlug } from "@/lib/content/lesson";
import { getGrammarForLesson } from "@/lib/content/grammar";
import { recordExerciseAttempts } from "@/lib/exercise-progress-data";
import type { ExerciseAnswer } from "@/lib/exercise-progress";

/**
 * The same lesson the live log being investigated used
 * ("family-describing-family-members") would be ideal for an exact match,
 * but this seed lesson is guaranteed present in every environment - swap
 * the slug if you want to match a specific lesson's exact exercise count.
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
  it("runs one batched Grammar submission and leaves the database clean afterward", async () => {
    const email = `db-ops-grammar-measurement-${Date.now()}@hango.dev`;
    const user = await db.user.create({ data: { email } });
    console.log("Created throwaway measurement user:", user.id, email);

    try {
      const lesson = await getLessonBySlug(LESSON_SLUG);
      if (!lesson) {
        throw new Error(
          `Seed lesson "${LESSON_SLUG}" not found - update LESSON_SLUG at the top of this file to a real published lesson slug.`,
        );
      }

      const grammarPoints = await getGrammarForLesson(lesson.id);
      const exercises = grammarPoints.flatMap((g) => g.grammarPoint.exercises);
      console.log(
        `Grammar points: ${grammarPoints.length}, total exercises in batch: ${exercises.length}`,
      );
      if (exercises.length === 0) {
        throw new Error(
          `Lesson "${LESSON_SLUG}" has no grammar exercises - pick a lesson that does.`,
        );
      }

      const answers = exercises.map((exercise) => ({
        exerciseId: exercise.id,
        answer: answerForExercise(exercise),
      }));

      console.log(
        "About to call recordExerciseAttempts (the real batched Grammar submission) - " +
          "check the Prisma Console Operations count NOW, immediately before this line runs.",
      );
      const results = await recordExerciseAttempts(user.id, answers);
      console.log(
        `Done - graded ${results.length} exercises. Check the Prisma Console Operations ` +
          "count again now; the delta is this one batched submission's real cost.",
      );
      expect(results).toHaveLength(exercises.length);
    } finally {
      await db.user.delete({ where: { id: user.id } });
      console.log("Cleaned up throwaway measurement user.");
    }
  }, 60000);
});
