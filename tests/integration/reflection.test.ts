import { afterEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";

const { completeMock } = vi.hoisted(() => ({ completeMock: vi.fn() }));
vi.mock("@/lib/ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai")>();
  return {
    ...actual,
    getAiProvider: () => ({ name: "test-mock", complete: completeMock }),
  };
});

const { authMock } = vi.hoisted(() => ({ authMock: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: authMock }));

const { getLessonReflectionReportAction } =
  await import("@/lib/actions/reflection");
const { getOrGenerateLessonReflectionReport, recordVocabularyInteraction } =
  await import("@/lib/reflection");

const testEmails: string[] = [];
const testLessonIds: string[] = [];
const testVocabularyIds: string[] = [];

afterEach(async () => {
  vi.clearAllMocks();
  completeMock.mockReset();
  if (testLessonIds.length > 0) {
    await db.lesson.deleteMany({ where: { id: { in: testLessonIds } } });
    testLessonIds.length = 0;
  }
  if (testVocabularyIds.length > 0) {
    await db.vocabularyItem.deleteMany({
      where: { id: { in: testVocabularyIds } },
    });
    testVocabularyIds.length = 0;
  }
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

const NARRATIVE_RESPONSE = JSON.stringify({
  narrative: "Great work today - your grammar was spot on.",
  strengths: ["Nailed the grammar exercises"],
  improvements: ["Explore the last vocabulary word"],
});

const SPEAKING_RESPONSE = JSON.stringify({
  pronunciation: 0,
  fluency: 60,
  accuracy: 80,
  complexity: 50,
  communicationEffectiveness: 75,
  // Pre-existing bug found 2026-08-19 (unrelated to this session's Tier 1/2
  // work): these 2 fields were missing here, so parseSpeakingConversationFeedback
  // silently fell back to 0 for both (reflection-prompt.ts:166-170), and the
  // multiplicative formula (points-system.ts's computeSpeakingConversationScore)
  // zeroed out the whole score regardless of the rubric fields above. Set to
  // 1 here (full credit) so this fixture exercises the rubric average only.
  vocabularyUsageRatio: 1,
  objectiveCompletionRatio: 1,
  notes: "Solid attempt.",
  recommendedNextStep: "Try longer sentences.",
});

describe("Lesson reflection report (integration, real database, mocked AI provider)", () => {
  it("computes real scores from vocabulary interactions and exercise attempts, and caches the report", async () => {
    const user = await createTestUser(
      `reflection-full-${Date.now()}@hango.dev`,
    );
    // Excludes "restaurant" - other integration test files assert exact
    // lesson/completion counts against that real scenario, and this test
    // creates (then deletes) a throwaway lesson under whatever level
    // findFirstOrThrow() lands on, which can transiently skew those counts
    // if the two run in parallel against the same level.
    const level = await db.scenarioLevel.findFirstOrThrow({
      where: { scenario: { slug: { not: "restaurant" } } },
    });
    const lesson = await db.lesson.create({
      data: {
        scenarioLevelId: level.id,
        title: `Test Reflection Lesson ${Date.now()}`,
        slug: `test-reflection-lesson-${Date.now()}`,
        communicationObjective: "Order food",
        status: "PUBLISHED",
      },
    });
    testLessonIds.push(lesson.id);
    const speakingCompetency = await db.competency.findFirstOrThrow({
      where: { name: "SPEAKING" },
    });
    await db.lessonCompetency.create({
      data: { lessonId: lesson.id, competencyId: speakingCompetency.id },
    });

    // 2 vocabulary items, only 1 interacted with.
    const wordA = await db.vocabularyItem.create({
      data: {
        chineseForm: "要",
        pinyin: "yào",
        meaning: "want",
        status: "PUBLISHED",
      },
    });
    const wordB = await db.vocabularyItem.create({
      data: {
        chineseForm: "菜",
        pinyin: "cài",
        meaning: "dish",
        status: "PUBLISHED",
      },
    });
    testVocabularyIds.push(wordA.id, wordB.id);
    await db.lessonVocabulary.createMany({
      data: [
        { lessonId: lesson.id, vocabularyItemId: wordA.id, order: 0 },
        { lessonId: lesson.id, vocabularyItemId: wordB.id, order: 1 },
      ],
    });
    await recordVocabularyInteraction(user.id, wordA.id);

    // 1 comprehension exercise, answered correctly.
    const comprehensionExercise = await db.exercise.create({
      data: {
        lessonId: lesson.id,
        type: "MULTIPLE_CHOICE",
        prompt: "Test comprehension question",
        correctAnswer: { optionIndex: 0 },
        status: "PUBLISHED",
      },
    });
    await db.exerciseAttempt.createMany({
      data: [
        {
          userId: user.id,
          exerciseId: comprehensionExercise.id,
          answer: { type: "MULTIPLE_CHOICE", optionId: "wrong" },
          isCorrect: false,
          attemptNumber: 1,
        },
        {
          userId: user.id,
          exerciseId: comprehensionExercise.id,
          answer: { type: "MULTIPLE_CHOICE", optionId: "corrected" },
          isCorrect: true,
          attemptNumber: 2,
        },
      ],
    });

    // A mission (needed for the speaking role-play context).
    await db.mission.create({
      data: {
        lessonId: lesson.id,
        title: "Test mission",
        objective: "Order food",
        learnerRole: "Customer",
        aiRole: "Waiter",
        status: "PUBLISHED",
      },
    });

    // A speaking practice exchange in the shared AiConversation thread.
    const conversation = await db.aiConversation.create({
      data: { userId: user.id },
    });
    await db.aiMessage.createMany({
      data: [
        {
          conversationId: conversation.id,
          role: "USER",
          content: "你好",
          contextSnapshot: {
            lessonTitle: lesson.title,
            rolePlay: { aiRole: "Waiter", learnerRole: "Customer" },
          },
        },
        {
          conversationId: conversation.id,
          role: "ASSISTANT",
          content: "欢迎光临",
          contextSnapshot: {
            lessonTitle: lesson.title,
            rolePlay: { aiRole: "Waiter", learnerRole: "Customer" },
          },
        },
        {
          conversationId: conversation.id,
          role: "USER",
          content: "两位",
          contextSnapshot: {
            lessonTitle: lesson.title,
            rolePlay: { aiRole: "Waiter", learnerRole: "Customer" },
          },
        },
        {
          conversationId: conversation.id,
          role: "ASSISTANT",
          content: "想吃什么？",
          contextSnapshot: {
            lessonTitle: lesson.title,
            rolePlay: { aiRole: "Waiter", learnerRole: "Customer" },
          },
        },
        {
          conversationId: conversation.id,
          role: "USER",
          content: "我要米饭",
          contextSnapshot: {
            lessonTitle: lesson.title,
            rolePlay: { aiRole: "Waiter", learnerRole: "Customer" },
          },
        },
      ],
    });

    completeMock
      .mockResolvedValueOnce({
        content: SPEAKING_RESPONSE,
        provider: "test-mock",
        model: "test-model",
        inputTokens: 10,
        outputTokens: 10,
      })
      .mockResolvedValueOnce({
        content: NARRATIVE_RESPONSE,
        provider: "test-mock",
        model: "test-model",
        inputTokens: 10,
        outputTokens: 10,
      });

    const report = await getOrGenerateLessonReflectionReport(
      user.id,
      lesson.id,
    );

    expect(report.vocabularyCovered).toBe(1);
    expect(report.vocabularyTotal).toBe(2);
    expect(report.comprehensionScore).toBe(0); // first attempt is the real score; correction does not overwrite it
    expect(report.grammarScore).toBeNull();
    // (0 + 60 + 80 + 50 + 75) / 5 = 53, gated by vocabularyUsageRatio=1 and
    // objectiveCompletionRatio=1 (full credit) - pronunciation is not
    // fabricated from a transcript, hence 0 there specifically.
    expect(report.speakingScore).toBe(53);
    expect(report.hanNarrative).toContain("grammar was spot on");
    expect(report.strengths).toEqual(["Nailed the grammar exercises"]);
    expect(completeMock).toHaveBeenCalledTimes(2);

    // Second call is served from cache - no further AI calls.
    const second = await getOrGenerateLessonReflectionReport(
      user.id,
      lesson.id,
    );
    expect(second.hanNarrative).toBe(report.hanNarrative);
    expect(completeMock).toHaveBeenCalledTimes(2);
    const speakingEvidence = await db.progressEvidence.findMany({
      where: {
        userId: user.id,
        competencyId: speakingCompetency.id,
        source: "SPEAKING",
        relatedActivityId: `lesson-reflection-speaking:${lesson.id}`,
      },
    });
    expect(speakingEvidence).toHaveLength(1);
    expect(speakingEvidence[0]!.result).toBeCloseTo(0.53);
  });

  it("regenerates a stale cached report (legacy speaking rubric) with scores that match the real underlying data", async () => {
    // Exercises the duplicate-query path fixed in
    // project/db-operations-optimization.md's Tier 2 ("computes every
    // sub-score twice when regenerating a stale cached report") - no
    // prior test covered stale-report regeneration at all before this one.
    const user = await createTestUser(
      `reflection-stale-${Date.now()}@hango.dev`,
    );
    // Excludes "restaurant" - other integration test files assert exact
    // lesson/completion counts against that real scenario, and this test
    // creates (then deletes) a throwaway lesson under whatever level
    // findFirstOrThrow() happens to land on, which can transiently skew
    // those counts if the two run in parallel against the same level.
    const level = await db.scenarioLevel.findFirstOrThrow({
      where: { scenario: { slug: { not: "restaurant" } } },
    });
    const lesson = await db.lesson.create({
      data: {
        scenarioLevelId: level.id,
        title: `Test Stale Reflection Lesson ${Date.now()}`,
        slug: `test-stale-reflection-lesson-${Date.now()}`,
        communicationObjective: "Order food",
        status: "PUBLISHED",
      },
    });
    testLessonIds.push(lesson.id);

    const word = await db.vocabularyItem.create({
      data: {
        chineseForm: "要",
        pinyin: "yào",
        meaning: "want",
        status: "PUBLISHED",
      },
    });
    testVocabularyIds.push(word.id);
    await db.lessonVocabulary.create({
      data: { lessonId: lesson.id, vocabularyItemId: word.id, order: 0 },
    });

    const comprehensionExercise = await db.exercise.create({
      data: {
        lessonId: lesson.id,
        type: "MULTIPLE_CHOICE",
        prompt: "Test comprehension question",
        correctAnswer: { optionIndex: 0 },
        status: "PUBLISHED",
      },
    });
    await db.exerciseAttempt.create({
      data: {
        userId: user.id,
        exerciseId: comprehensionExercise.id,
        answer: { type: "MULTIPLE_CHOICE", optionId: "right" },
        isCorrect: true,
        attemptNumber: 1,
      },
    });

    // Seed a stale cached report directly - `speakingDimensions` without
    // `vocabularyUsageRatio` is the pre-2026-08-16 legacy shape, which
    // getOrGenerateLessonReflectionReport treats as stale and regenerates
    // in full, deliberately mismatched against the real data above (stale
    // comprehensionScore: 0) to prove the regenerated report reflects
    // fresh data, not the cached values.
    await db.lessonReflectionReport.create({
      data: {
        userId: user.id,
        lessonId: lesson.id,
        vocabularyCovered: 0,
        vocabularyTotal: 0,
        vocabularyScore: null,
        comprehensionScore: 0,
        grammarScore: null,
        speakingScore: 80,
        speakingDimensions: {
          pronunciation: 80,
          fluency: 80,
          accuracy: 80,
          complexity: 80,
          communicationEffectiveness: 80,
          notes: "old",
          recommendedNextStep: "old",
        },
        totalScore: 24,
        hanNarrative: "Old narrative.",
        strengths: ["old strength"],
        improvements: ["old improvement"],
      },
    });

    completeMock.mockResolvedValueOnce({
      content: NARRATIVE_RESPONSE,
      provider: "test-mock",
      model: "test-model",
      inputTokens: 10,
      outputTokens: 10,
    });

    const report = await getOrGenerateLessonReflectionReport(
      user.id,
      lesson.id,
    );

    // Regenerated, not the stale cached values.
    expect(report.hanNarrative).not.toBe("Old narrative.");
    expect(report.comprehensionScore).toBe(100);
    expect(report.grammarScore).toBeNull();
    expect(report.vocabularyTotal).toBe(1);
    // No mission, so no speaking AI call - only the narrative call.
    expect(completeMock).toHaveBeenCalledTimes(1);

    // Persisted, not just returned - a second call must hit the new cache,
    // not regenerate again.
    completeMock.mockClear();
    const second = await getOrGenerateLessonReflectionReport(
      user.id,
      lesson.id,
    );
    expect(second.comprehensionScore).toBe(100);
    expect(completeMock).not.toHaveBeenCalled();
  });

  it("returns null scores gracefully when there's no data yet", async () => {
    const user = await createTestUser(
      `reflection-empty-${Date.now()}@hango.dev`,
    );
    // Excludes "restaurant" - other integration test files assert exact
    // lesson/completion counts against that real scenario, and this test
    // creates (then deletes) a throwaway lesson under whatever level
    // findFirstOrThrow() lands on, which can transiently skew those counts
    // if the two run in parallel against the same level.
    const level = await db.scenarioLevel.findFirstOrThrow({
      where: { scenario: { slug: { not: "restaurant" } } },
    });
    const lesson = await db.lesson.create({
      data: {
        scenarioLevelId: level.id,
        title: `Test Empty Lesson ${Date.now()}`,
        slug: `test-empty-lesson-${Date.now()}`,
        communicationObjective: "Order food",
        status: "PUBLISHED",
      },
    });
    testLessonIds.push(lesson.id);

    completeMock.mockResolvedValue({
      content: NARRATIVE_RESPONSE,
      provider: "test-mock",
      model: "test-model",
      inputTokens: 10,
      outputTokens: 10,
    });

    const report = await getOrGenerateLessonReflectionReport(
      user.id,
      lesson.id,
    );
    expect(report.vocabularyCovered).toBe(0);
    expect(report.vocabularyTotal).toBe(0);
    expect(report.comprehensionScore).toBeNull();
    expect(report.grammarScore).toBeNull();
    expect(report.speakingScore).toBeNull();
    // No mission and no transcript - only the narrative call happens.
    expect(completeMock).toHaveBeenCalledTimes(1);
  });

  it("the server action rejects unauthenticated requests", async () => {
    authMock.mockResolvedValue(null);
    const result = await getLessonReflectionReportAction("nonexistent-id");
    expect(result.ok).toBe(false);
    expect(completeMock).not.toHaveBeenCalled();
  });
});

describe("recordVocabularyInteraction (2026-08-20, replaced upsert with create + swallowed P2002 - project/learning-journey-optimization.md)", () => {
  it("records a first interaction", async () => {
    const user = await createTestUser(
      `vocab-interaction-${Date.now()}@hango.dev`,
    );
    const word = await db.vocabularyItem.create({
      data: { chineseForm: "喝", pinyin: "hē", meaning: "drink", status: "PUBLISHED" },
    });
    testVocabularyIds.push(word.id);

    await recordVocabularyInteraction(user.id, word.id);

    const rows = await db.learnerVocabularyInteraction.findMany({
      where: { userId: user.id, vocabularyItemId: word.id },
    });
    expect(rows).toHaveLength(1);
  });

  it("stays idempotent on a repeat call for the same word - no throw, no duplicate row", async () => {
    const user = await createTestUser(
      `vocab-interaction-repeat-${Date.now()}@hango.dev`,
    );
    const word = await db.vocabularyItem.create({
      data: { chineseForm: "喝", pinyin: "hē", meaning: "drink", status: "PUBLISHED" },
    });
    testVocabularyIds.push(word.id);

    await recordVocabularyInteraction(user.id, word.id);
    await expect(
      recordVocabularyInteraction(user.id, word.id),
    ).resolves.toBeUndefined();

    const rows = await db.learnerVocabularyInteraction.findMany({
      where: { userId: user.id, vocabularyItemId: word.id },
    });
    expect(rows).toHaveLength(1);
  });
});
