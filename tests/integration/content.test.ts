import { describe, expect, it } from "vitest";
import { getScenarioBySlug } from "@/lib/content/scenario";
import { getLessonBySlug } from "@/lib/content/lesson";
import { getDialoguesForLesson } from "@/lib/content/dialogue";
import { getVocabularyForLesson } from "@/lib/content/vocabulary";
import { getGrammarForLesson } from "@/lib/content/grammar";
import { getExercisesForLesson } from "@/lib/content/exercise";
import { getQuizzesForLesson } from "@/lib/content/quiz";
import { getMissionForLesson } from "@/lib/content/mission";
import { validateLessonForPublish } from "@/lib/content/validation";
import { getLessonWithContent } from "@/lib/content/lesson-data";
import { getSpeakingLessonOptions } from "@/lib/content/speaking-prompts";
import {
  JOURNEY_CHAPTER_ORDER,
  resolveJourneyChapter,
} from "@/lib/content/learning-journey";
import { db } from "@/lib/db";

/**
 * Runs against the real seeded Restaurant Lesson 1 (`npm run db:seed` must
 * have been run — same assumption as every other integration test in this
 * project, which all use the real local database).
 */
describe("content services (integration, real seeded database)", () => {
  it("retrieves the Restaurant scenario with its published level and lesson", async () => {
    const scenario = await getScenarioBySlug("restaurant");
    expect(scenario).not.toBeNull();
    expect(scenario!.name).toBe("Restaurant");
    expect(scenario!.levels.length).toBeGreaterThan(0);
    expect(scenario!.levels[0]!.lessons[0]!.slug).toBe(
      "restaurant-entering-and-ordering",
    );
  });

  it("retrieves Restaurant Lesson 1 by slug (FASE 4 completion criterion)", async () => {
    const lesson = await getLessonBySlug("restaurant-entering-and-ordering");
    expect(lesson).not.toBeNull();
    expect(lesson!.title).toBe("Entering and Ordering");
    expect(lesson!.steps.length).toBe(6);
    expect(lesson!.competencies.length).toBe(3);
  });

  it("retrieves the lesson's dialogue with ordered lines and speakers", async () => {
    const lesson = await getLessonBySlug("restaurant-entering-and-ordering");
    const dialogues = await getDialoguesForLesson(lesson!.id);
    expect(dialogues).toHaveLength(1);
    expect(dialogues[0]!.lines).toHaveLength(12);
    expect(dialogues[0]!.lines[0]!.chineseText).toBe("欢迎光临，请问几位？");
    expect(dialogues[0]!.lines[0]!.speaker.name).toBe("服务员");
  });

  it("retrieves vocabulary, grammar, exercises, quiz, and mission", async () => {
    const lesson = await getLessonBySlug("restaurant-entering-and-ordering");
    const [vocabulary, grammar, exercises, quizzes, mission] =
      await Promise.all([
        getVocabularyForLesson(lesson!.id),
        getGrammarForLesson(lesson!.id),
        getExercisesForLesson(lesson!.id),
        getQuizzesForLesson(lesson!.id),
        getMissionForLesson(lesson!.id),
      ]);

    expect(vocabulary.length).toBe(6);
    expect(grammar.length).toBe(2);
    expect(exercises.length).toBe(5);
    expect(quizzes[0]!.questions.length).toBe(2);
    expect(mission).not.toBeNull();
    expect(mission!.successConditions.length).toBe(3);
  });

  it("puts every exercise in Comprehension when the lesson has no Guided Practice step", async () => {
    const lesson = await getLessonWithContent(
      "restaurant-entering-and-ordering",
    );
    expect(lesson!.steps.some((step) => step.type === "GUIDED_PRACTICE")).toBe(
      false,
    );
    expect(lesson!.comprehensionExercises).toHaveLength(5);
    expect(lesson!.guidedPracticeExercises).toHaveLength(0);
  });

  it("orders the Speaking QA picker exactly like the Learning Journey", async () => {
    const [options, scenarios] = await Promise.all([
      getSpeakingLessonOptions(),
      db.scenario.findMany({
        where: { status: "PUBLISHED" },
        orderBy: [{ domain: { order: "asc" } }, { order: "asc" }],
        include: {
          levels: {
            orderBy: { order: "asc" },
            include: {
              lessons: {
                where: { status: "PUBLISHED" },
                orderBy: { order: "asc" },
                select: { id: true },
              },
            },
          },
        },
      }),
    ]);

    const expectedIds = JOURNEY_CHAPTER_ORDER.flatMap((chapter) =>
      scenarios
        .filter(
          (scenario) =>
            resolveJourneyChapter(
              scenario.levels.map((level) => level.difficulty),
            ) === chapter,
        )
        .flatMap((scenario) =>
          scenario.levels.flatMap((level) =>
            level.lessons.map((lesson) => lesson.id),
          ),
        ),
    );

    expect(options.map((option) => option.id)).toEqual(expectedIds);
  });

  it("passes its own publish validation", async () => {
    const lesson = await db.lesson.findFirstOrThrow({
      where: { slug: "restaurant-entering-and-ordering" },
    });
    const result = await validateLessonForPublish(db, lesson.id);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects publishing a lesson missing required content", async () => {
    const level = await db.scenarioLevel.findFirstOrThrow({
      where: { scenario: { slug: "restaurant" } },
    });
    const incompleteLesson = await db.lesson.create({
      data: {
        scenarioLevelId: level.id,
        title: "Incomplete Test Lesson",
        slug: `incomplete-test-lesson-${Date.now()}`,
        communicationObjective: "Test objective",
        status: "DRAFT",
      },
    });

    const result = await validateLessonForPublish(db, incompleteLesson.id);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);

    await db.lesson.delete({ where: { id: incompleteLesson.id } });
  });
});
