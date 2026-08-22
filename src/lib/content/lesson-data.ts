import { getLessonBySlug } from "@/lib/content/lesson";
import { getDialoguesForLesson } from "@/lib/content/dialogue";
import { getVocabularyForLesson } from "@/lib/content/vocabulary";
import { getGrammarForLesson } from "@/lib/content/grammar";
import { getExercisesForLesson } from "@/lib/content/exercise";
import { getQuizzesForLesson } from "@/lib/content/quiz";
import { getMissionForLesson } from "@/lib/content/mission";
import { toClientExercise } from "@/lib/exercise-progress";

/**
 * Aggregates every piece of content a lesson's steps can render, in one
 * call (6.1's lesson route needs all of it up front, not one query per
 * step). `Exercise` has no field saying whether it belongs to the
 * COMPREHENSION or GUIDED_PRACTICE step (schema gap, flagged in FASE 6
 * research) - as a documented default, if the lesson has no GUIDED_PRACTICE
 * step at all, every exercise goes to Comprehension; otherwise the first
 * exercise is comprehension-check and the rest are guided practice.
 *
 * Exercises, quiz questions, and (2026-08-19) each grammar point's practice
 * exercises are all sanitized via `toClientExercise` before this reaches a
 * Client Component - grading data (`correctAnswer`, `ExerciseOption.isCorrect`)
 * never leaves the server (7.1 "Validate answers" - real grading happens
 * again, independently, in src/lib/exercise-progress-data.ts /
 * quiz-progress-data.ts).
 */
export async function getLessonWithContent(slug: string) {
  const lesson = await getLessonBySlug(slug);
  if (!lesson) return null;

  const [dialogues, vocabulary, grammar, exercises, quizzes, mission] =
    await Promise.all([
      getDialoguesForLesson(lesson.id),
      getVocabularyForLesson(lesson.id),
      getGrammarForLesson(lesson.id),
      getExercisesForLesson(lesson.id),
      getQuizzesForLesson(lesson.id),
      getMissionForLesson(lesson.id),
    ]);

  const clientExercises = exercises.map((exercise) =>
    toClientExercise(exercise),
  );
  const hasGuidedPracticeStep = lesson.steps.some(
    (step) => step.type === "GUIDED_PRACTICE",
  );

  return {
    ...lesson,
    dialogues,
    vocabulary,
    grammar: grammar.map((lessonGrammarPoint) => ({
      ...lessonGrammarPoint,
      grammarPoint: {
        ...lessonGrammarPoint.grammarPoint,
        exercises: lessonGrammarPoint.grammarPoint.exercises.map((exercise) =>
          toClientExercise(exercise),
        ),
      },
    })),
    comprehensionExercises: hasGuidedPracticeStep
      ? clientExercises.slice(0, 1)
      : clientExercises,
    guidedPracticeExercises: hasGuidedPracticeStep
      ? clientExercises.slice(1)
      : [],
    quizzes: quizzes.map((quiz) => ({
      ...quiz,
      questions: quiz.questions.map((question) => toClientExercise(question)),
    })),
    mission,
  };
}

export type LessonWithContent = NonNullable<
  Awaited<ReturnType<typeof getLessonWithContent>>
>;
