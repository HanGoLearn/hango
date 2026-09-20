import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { getLessonBySlug } from "@/lib/content/lesson";
import { getVocabularyForLesson } from "@/lib/content/vocabulary";
import {
  buildVocabularyQuizOptions,
  seededRandom,
  type VocabularyQuizItem,
} from "@/lib/content/vocabulary-quiz";
import { recordVocabularyQuizAttempts } from "@/lib/vocabulary-interactivity";

const testUserIds: string[] = [];

afterEach(async () => {
  if (testUserIds.length > 0) {
    await db.user.deleteMany({ where: { id: { in: testUserIds } } });
    testUserIds.length = 0;
  }
});

async function createTestUser(label: string) {
  const user = await db.user.create({
    data: {
      email: `${label}-${Date.now()}-${Math.random().toString(36).slice(2)}@hango.dev`,
    },
  });
  testUserIds.push(user.id);
  return user;
}

async function seededLessonVocabulary() {
  const lesson = await getLessonBySlug("restaurant-entering-and-ordering");
  if (!lesson) throw new Error("Expected seeded lesson");
  const vocabulary = await getVocabularyForLesson(lesson.id);
  const items: VocabularyQuizItem[] = vocabulary.map(({ vocabularyItem }) => ({
    id: vocabularyItem.id,
    meaning: vocabularyItem.meaning,
    pinyin: vocabularyItem.pinyin,
    chineseForm: vocabularyItem.chineseForm,
  }));
  return { lesson, vocabulary, items };
}

describe("Vocabulary quiz server-owned grading", () => {
  it("recomputes correctness instead of trusting the browser", async () => {
    const user = await createTestUser("vocabulary-grade");
    const { lesson, vocabulary, items } = await seededLessonVocabulary();
    const word = vocabulary[0]!.vocabularyItem;
    const options = buildVocabularyQuizOptions(
      items,
      word.id,
      "meaning",
      undefined,
      seededRandom(`${word.id}:meaning`),
    );
    const wrong = options.find((option) => !option.isCorrect);
    if (!wrong) throw new Error("Expected a seeded distractor");

    await recordVocabularyQuizAttempts(user.id, lesson.id, [
      {
        vocabularyItemId: word.id,
        questionKey: `${word.id}:quicktest`,
        answer: { type: "OPTION", optionId: wrong.id },
      },
    ]);

    const stored = await db.vocabularyQuizAttempt.findFirstOrThrow({
      where: { userId: user.id, lessonId: lesson.id },
    });
    expect(stored.isCorrect).toBe(false);
  });

  it("accepts a canonical correct option and persists the server result", async () => {
    const user = await createTestUser("vocabulary-correct");
    const { lesson, vocabulary } = await seededLessonVocabulary();
    const word = vocabulary[0]!.vocabularyItem;

    await recordVocabularyQuizAttempts(user.id, lesson.id, [
      {
        vocabularyItemId: word.id,
        questionKey: `${word.id}:quicktest`,
        answer: { type: "OPTION", optionId: word.id },
      },
    ]);

    const stored = await db.vocabularyQuizAttempt.findFirstOrThrow({
      where: { userId: user.id, lessonId: lesson.id },
    });
    expect(stored.isCorrect).toBe(true);
  });

  it("rejects foreign vocabulary, fabricated questions and duplicate batch keys", async () => {
    const user = await createTestUser("vocabulary-scope");
    const { lesson, vocabulary } = await seededLessonVocabulary();
    const word = vocabulary[0]!.vocabularyItem;
    const lessonWordIds = vocabulary.map(({ vocabularyItem }) => vocabularyItem.id);
    const foreign = await db.lessonVocabulary.findFirstOrThrow({
      where: {
        lessonId: { not: lesson.id },
        vocabularyItemId: { notIn: lessonWordIds },
      },
    });

    await expect(
      recordVocabularyQuizAttempts(user.id, lesson.id, [
        {
          vocabularyItemId: foreign.vocabularyItemId,
          questionKey: `${foreign.vocabularyItemId}:quicktest`,
          answer: { type: "OPTION", optionId: foreign.vocabularyItemId },
        },
      ]),
    ).rejects.toThrow("does not belong");

    await expect(
      recordVocabularyQuizAttempts(user.id, lesson.id, [
        {
          vocabularyItemId: word.id,
          questionKey: `${word.id}:invented`,
          answer: { type: "OPTION", optionId: word.id },
        },
      ]),
    ).rejects.toThrow("not planned");

    const duplicate = {
      vocabularyItemId: word.id,
      questionKey: `${word.id}:quicktest`,
      answer: { type: "OPTION" as const, optionId: word.id },
    };
    await expect(
      recordVocabularyQuizAttempts(user.id, lesson.id, [duplicate, duplicate]),
    ).rejects.toThrow("Duplicate");

    expect(
      await db.vocabularyQuizAttempt.count({
        where: { userId: user.id, lessonId: lesson.id },
      }),
    ).toBe(0);
  });
});
