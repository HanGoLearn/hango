import { afterEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { getLessonBySlug } from "@/lib/content/lesson";
import { getExercisesForLesson } from "@/lib/content/exercise";
import { recordExerciseAttempt } from "@/lib/exercise-progress-data";
import {
  getCompetencyProgress,
  getVocabularyGrammarExposure,
  getScenarioMastery,
} from "@/lib/progress-data";
import { getReviewQueue, completeReviewItem } from "@/lib/review-data";

// Only auth() is mocked — everything else runs against the real database,
// with the mock AI provider (no OPENAI_API_KEY in this environment).
const { authMock } = vi.hoisted(() => ({ authMock: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: authMock }));

const testEmails: string[] = [];

afterEach(async () => {
  vi.clearAllMocks();
  if (testEmails.length > 0) {
    await db.user.deleteMany({ where: { email: { in: testEmails } } });
    testEmails.length = 0;
  }
});

async function createTestUser(email: string) {
  testEmails.push(email);
  const user = await db.user.create({ data: { email } });
  authMock.mockResolvedValue({ user: { id: user.id } });
  return user;
}

describe("Progress Evidence (integration, real database)", () => {
  it("completing an exercise records progress evidence for the lesson's competencies", async () => {
    const user = await createTestUser(
      `progress-exercise-${Date.now()}@hango.dev`,
    );
    const lesson = await getLessonBySlug("restaurant-entering-and-ordering");
    const [exercise] = await getExercisesForLesson(lesson!.id);
    const correctOption = exercise!.options.find((o) => o.isCorrect)!;

    await recordExerciseAttempt(user.id, exercise!.id, {
      type: "MULTIPLE_CHOICE",
      optionId: correctOption.id,
    });

    const evidence = await db.progressEvidence.findMany({
      where: { userId: user.id, source: "EXERCISE" },
    });
    expect(evidence.length).toBeGreaterThan(0);
    expect(evidence[0]!.result).toBe(1);
  });

  it("getCompetencyProgress reflects recorded evidence with a computed stage", async () => {
    const user = await createTestUser(
      `progress-competency-${Date.now()}@hango.dev`,
    );
    const lesson = await getLessonBySlug("restaurant-entering-and-ordering");
    const [exercise] = await getExercisesForLesson(lesson!.id);
    const correctOption = exercise!.options.find((o) => o.isCorrect)!;

    await recordExerciseAttempt(user.id, exercise!.id, {
      type: "MULTIPLE_CHOICE",
      optionId: correctOption.id,
    });

    const progress = await getCompetencyProgress(user.id);
    expect(progress.length).toBeGreaterThan(0);
    expect(progress[0]!.stage).toBe("PRACTICE");
  });

  it("ignores historical exercise evidence incorrectly attributed to Speaking", async () => {
    const user = await createTestUser(`progress-attribution-${Date.now()}@hango.dev`);
    const speaking = await db.competency.findFirstOrThrow({
      where: { name: "SPEAKING" },
    });
    await db.progressEvidence.create({
      data: {
        userId: user.id,
        competencyId: speaking.id,
        source: "EXERCISE",
        result: 1,
        difficulty: 3,
        relatedActivityId: "legacy-misattributed-exercise",
      },
    });

    const progress = await getCompetencyProgress(user.id);
    expect(progress.some((item) => item.name === "SPEAKING")).toBe(false);
  });

  it("a learner with no activity has no competency progress", async () => {
    const user = await createTestUser(`progress-empty-${Date.now()}@hango.dev`);
    expect(await getCompetencyProgress(user.id)).toEqual([]);
  });

  it("getVocabularyGrammarExposure counts distinct items from completed lessons", async () => {
    const user = await createTestUser(
      `progress-exposure-${Date.now()}@hango.dev`,
    );
    const lesson = await getLessonBySlug("restaurant-entering-and-ordering");
    await db.learnerLessonCompletion.create({
      data: { userId: user.id, lessonId: lesson!.id },
    });

    const exposure = await getVocabularyGrammarExposure(user.id);
    expect(exposure.vocabularyCount).toBe(6);
    expect(exposure.grammarCount).toBe(2);
  });

  it("getScenarioMastery reports completion percent for the Restaurant scenario", async () => {
    const user = await createTestUser(
      `progress-mastery-${Date.now()}@hango.dev`,
    );
    // FASE 15 gave Restaurant 4 lessons (was 1) — completing one is 25%.
    const lesson = await getLessonBySlug("restaurant-entering-and-ordering");
    await db.learnerLessonCompletion.create({
      data: { userId: user.id, lessonId: lesson!.id },
    });

    const mastery = await getScenarioMastery(user.id);
    const restaurant = mastery.find((m) => m.slug === "restaurant");
    expect(restaurant?.completionPercent).toBe(25);
  });
});

describe("Review Queue (integration, real database)", () => {
  it("is empty for a learner with no completed lessons", async () => {
    const user = await createTestUser(`review-empty-${Date.now()}@hango.dev`);
    expect(await getReviewQueue(user.id)).toEqual([]);
  });

  it("includes vocabulary, grammar, dialogue, and AI practice items for a learner with a completed lesson", async () => {
    const user = await createTestUser(`review-queue-${Date.now()}@hango.dev`);
    const lesson = await getLessonBySlug("restaurant-entering-and-ordering");
    await db.learnerLessonCompletion.create({
      data: { userId: user.id, lessonId: lesson!.id },
    });

    const queue = await getReviewQueue(user.id);
    const types = new Set(queue.map((item) => item.type));
    expect(types.has("VOCABULARY")).toBe(true);
    expect(types.has("GRAMMAR")).toBe(true);
    expect(types.has("DIALOGUE")).toBe(true);
    expect(types.has("AI_PRACTICE")).toBe(true);
  });

  it("includes recent mistakes after a wrong exercise attempt", async () => {
    const user = await createTestUser(`review-mistake-${Date.now()}@hango.dev`);
    const lesson = await getLessonBySlug("restaurant-entering-and-ordering");
    await db.learnerLessonCompletion.create({
      data: { userId: user.id, lessonId: lesson!.id },
    });
    const [exercise] = await getExercisesForLesson(lesson!.id);
    const wrongOption = exercise!.options.find((o) => !o.isCorrect)!;
    await recordExerciseAttempt(user.id, exercise!.id, {
      type: "MULTIPLE_CHOICE",
      optionId: wrongOption.id,
    });

    const queue = await getReviewQueue(user.id);
    expect(queue.some((item) => item.type === "MISTAKE")).toBe(true);
  });

  it("excludes an item recently marked reviewed (on cooldown)", async () => {
    const user = await createTestUser(
      `review-cooldown-${Date.now()}@hango.dev`,
    );
    const lesson = await getLessonBySlug("restaurant-entering-and-ordering");
    await db.learnerLessonCompletion.create({
      data: { userId: user.id, lessonId: lesson!.id },
    });

    const before = await getReviewQueue(user.id);
    const vocabItem = before.find((item) => item.type === "VOCABULARY")!;

    await completeReviewItem(user.id, "VOCABULARY", vocabItem.itemKey);

    const after = await getReviewQueue(user.id);
    expect(after.some((item) => item.id === vocabItem.id)).toBe(false);
  });
});
