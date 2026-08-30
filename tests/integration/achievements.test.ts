import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  checkStreakAchievements,
  checkLevelAchievements,
  checkReflectionAchievements,
  checkLessonCompletionAchievements,
  checkLeaderboardAchievements,
  checkChapterCompletionAchievements,
  checkGraduateAchievement,
  checkSpeakingLabAchievements,
  checkWritingLabAchievements,
} from "@/lib/achievements";
import { getCoinBalance } from "@/lib/coins";
import { resolveJourneyChapter } from "@/lib/content/learning-journey";

// Cascade-deletes every Achievement/LessonReflectionReport/
// LearnerLessonCompletion row this file creates (all FK'd to userId with
// onDelete: Cascade, same convention as leaderboard.test.ts's cleanup) -
// only the *test user* needs deleting, never the real published lessons
// borrowed read-only below for their id.
const testEmails: string[] = [];

afterEach(async () => {
  if (testEmails.length > 0) {
    await db.user.deleteMany({ where: { email: { in: testEmails } } });
    testEmails.length = 0;
  }
});

async function createTestUser(email: string) {
  testEmails.push(email);
  return db.user.create({ data: { email } });
}

async function unlockedKeys(userId: string): Promise<string[]> {
  const rows = await db.achievement.findMany({
    where: { userId },
    select: { key: true },
  });
  return rows.map((row) => row.key).sort();
}

describe("achievements (integration, real database)", () => {
  it("unlocks streak achievements at the right thresholds, idempotently", async () => {
    const user = await createTestUser(`ach-streak-${Date.now()}@hango.dev`);

    await checkStreakAchievements(user.id, 5);
    expect(await unlockedKeys(user.id)).toEqual(["streak_3"]);

    await checkStreakAchievements(user.id, 10);
    expect(await unlockedKeys(user.id)).toEqual(["streak_3", "streak_7"]);

    // Calling again with the same value must not duplicate (@@unique).
    await checkStreakAchievements(user.id, 10);
    expect(await unlockedKeys(user.id)).toEqual(["streak_3", "streak_7"]);
  });

  it("unlocks the 60 and 100-day streak tiers, and stops crediting past what the streak actually reached", async () => {
    const user = await createTestUser(`ach-streak-long-${Date.now()}@hango.dev`);

    await checkStreakAchievements(user.id, 60);
    expect(await unlockedKeys(user.id)).toEqual(
      ["streak_3", "streak_7", "streak_30", "streak_60"].sort(),
    );

    await checkStreakAchievements(user.id, 100);
    expect(await unlockedKeys(user.id)).toEqual(
      ["streak_3", "streak_7", "streak_30", "streak_60", "streak_100"].sort(),
    );
  });

  it("unlocks every General Level tier up to and including the current one", async () => {
    const user = await createTestUser(`ach-level-${Date.now()}@hango.dev`);

    // 750 points -> level 3 ("Speaking with Ease", min 700) per
    // HSK_POINT_THRESHOLDS - should unlock tiers 1, 2 and 3, not 4.
    await checkLevelAchievements(user.id, 750);
    expect(await unlockedKeys(user.id)).toEqual([
      "level_tier_1",
      "level_tier_2",
      "level_tier_3",
    ]);
  });

  it("unlocks a perfect-score achievement only on a real 100, not 95", async () => {
    const perfect = await createTestUser(`ach-perfect-${Date.now()}@hango.dev`);
    await checkReflectionAchievements(perfect.id, 100);
    expect(await unlockedKeys(perfect.id)).toContain("reflection_perfect");

    const notPerfect = await createTestUser(
      `ach-notperfect-${Date.now()}@hango.dev`,
    );
    await checkReflectionAchievements(notPerfect.id, 95);
    expect(await unlockedKeys(notPerfect.id)).not.toContain(
      "reflection_perfect",
    );
  });

  it("unlocks the 5-lesson three-star achievement once 5 real Reflection reports score 90+", async () => {
    const user = await createTestUser(`ach-3star-${Date.now()}@hango.dev`);
    const lessons = await db.lesson.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true },
      take: 5,
    });
    expect(lessons.length).toBeGreaterThanOrEqual(5);

    for (const lesson of lessons) {
      await db.lessonReflectionReport.create({
        data: {
          userId: user.id,
          lessonId: lesson.id,
          vocabularyCovered: 0,
          vocabularyTotal: 0,
          totalScore: 92,
          hanNarrative: "test fixture",
          strengths: [],
          improvements: [],
        },
      });
    }

    await checkReflectionAchievements(user.id, 92);
    expect(await unlockedKeys(user.id)).toContain("reflection_three_star_5");
  });

  it("does not unlock the 5-lesson three-star achievement with only 4 qualifying reports", async () => {
    const user = await createTestUser(`ach-3star-short-${Date.now()}@hango.dev`);
    const lessons = await db.lesson.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true },
      take: 4,
    });
    expect(lessons.length).toBeGreaterThanOrEqual(4);

    for (const lesson of lessons) {
      await db.lessonReflectionReport.create({
        data: {
          userId: user.id,
          lessonId: lesson.id,
          vocabularyCovered: 0,
          vocabularyTotal: 0,
          totalScore: 92,
          hanNarrative: "test fixture",
          strengths: [],
          improvements: [],
        },
      });
    }

    await checkReflectionAchievements(user.id, 92);
    expect(await unlockedKeys(user.id)).not.toContain(
      "reflection_three_star_5",
    );
  });

  it("counts real lesson completions for the 10-lesson achievement", async () => {
    const user = await createTestUser(`ach-lessons-${Date.now()}@hango.dev`);
    const lessons = await db.lesson.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true },
      take: 10,
    });
    expect(lessons.length).toBeGreaterThanOrEqual(10);

    await db.learnerLessonCompletion.createMany({
      data: lessons.map((lesson) => ({ userId: user.id, lessonId: lesson.id })),
    });

    await checkLessonCompletionAchievements(user.id);
    expect(await unlockedKeys(user.id)).toContain("lessons_10");
    expect(await unlockedKeys(user.id)).not.toContain("lessons_50");
  });

  it("unlocks leaderboard achievements at rank thresholds, and does nothing for a null rank", async () => {
    const user = await createTestUser(`ach-rank-${Date.now()}@hango.dev`);

    await checkLeaderboardAchievements(user.id, null);
    expect(await unlockedKeys(user.id)).toEqual([]);

    await checkLeaderboardAchievements(user.id, 5);
    expect(await unlockedKeys(user.id)).toEqual(["leaderboard_top10"]);

    await checkLeaderboardAchievements(user.id, 1);
    expect(await unlockedKeys(user.id)).toEqual(
      ["leaderboard_rank1", "leaderboard_top10"].sort(),
    );
  });

  it("seenAt starts null and can be marked independently of the unlock itself", async () => {
    const user = await createTestUser(`ach-seen-${Date.now()}@hango.dev`);
    await checkStreakAchievements(user.id, 3);

    const before = await db.achievement.findFirst({
      where: { userId: user.id, key: "streak_3" },
    });
    expect(before?.seenAt).toBeNull();

    await db.achievement.updateMany({
      where: { userId: user.id, key: "streak_3" },
      data: { seenAt: new Date() },
    });
    const after = await db.achievement.findFirst({
      where: { userId: user.id, key: "streak_3" },
    });
    expect(after?.seenAt).not.toBeNull();
  });

  describe("chapter completion (real ADVANCED chapter content - the smallest, 12 scenarios)", () => {
    async function advancedChapterContent() {
      const scenarios = await db.scenario.findMany({
        select: {
          id: true,
          levels: {
            select: {
              difficulty: true,
              lessons: { where: { status: "PUBLISHED" }, select: { id: true } },
            },
          },
        },
      });
      const advanced = scenarios.filter(
        (s) => resolveJourneyChapter(s.levels.map((l) => l.difficulty)) === "ADVANCED",
      );
      return {
        scenarioIds: advanced.map((s) => s.id),
        lessonIds: advanced.flatMap((s) => s.levels.flatMap((l) => l.lessons.map((x) => x.id))),
      };
    }

    /** Marks every scenario/lesson in the chapter complete for `userId`, all lessons at `score`. */
    async function completeWholeChapter(
      userId: string,
      content: { scenarioIds: string[]; lessonIds: string[] },
      score: number,
    ) {
      await db.lessonReflectionReport.createMany({
        data: content.lessonIds.map((lessonId) => ({
          userId,
          lessonId,
          vocabularyCovered: 0,
          vocabularyTotal: 0,
          totalScore: score,
          hanNarrative: "test fixture",
          strengths: [],
          improvements: [],
        })),
      });
      await db.scenarioCompletion.createMany({
        data: content.scenarioIds.map((scenarioId) => ({
          userId,
          scenarioId,
          earnedPoints: 10,
          weightedReflectionAverage: score,
        })),
      });
    }

    it("does not unlock while some scenarios in the chapter are still incomplete", async () => {
      const user = await createTestUser(`ach-chapter-partial-${Date.now()}@hango.dev`);
      const content = await advancedChapterContent();
      expect(content.scenarioIds.length).toBeGreaterThan(1);

      // Complete only the first scenario's worth, not the whole chapter.
      const firstScenarioId = content.scenarioIds[0]!;
      await db.scenarioCompletion.create({
        data: { userId: user.id, scenarioId: firstScenarioId, earnedPoints: 10, weightedReflectionAverage: 95 },
      });

      await checkChapterCompletionAchievements(user.id, "ADVANCED");
      expect(await unlockedKeys(user.id)).not.toContain("chapter_completed_advanced");
    });

    it("does not unlock when the chapter is fully done but the average score is 70 or below", async () => {
      const user = await createTestUser(`ach-chapter-lowscore-${Date.now()}@hango.dev`);
      const content = await advancedChapterContent();
      await completeWholeChapter(user.id, content, 60);

      await checkChapterCompletionAchievements(user.id, "ADVANCED");
      expect(await unlockedKeys(user.id)).not.toContain("chapter_completed_advanced");
      expect(await getCoinBalance(user.id)).toBe(0);
    });

    it("unlocks and pays 250 coins once the whole chapter is done with an average above 70, idempotently", async () => {
      const user = await createTestUser(`ach-chapter-done-${Date.now()}@hango.dev`);
      const content = await advancedChapterContent();
      await completeWholeChapter(user.id, content, 95);

      await checkChapterCompletionAchievements(user.id, "ADVANCED");
      expect(await unlockedKeys(user.id)).toContain("chapter_completed_advanced");
      expect(await getCoinBalance(user.id)).toBe(250);

      // Re-checking (e.g. a later scenario rescoring in the same chapter) must not double-pay.
      await checkChapterCompletionAchievements(user.id, "ADVANCED");
      expect(await getCoinBalance(user.id)).toBe(250);
    });
  });

  describe("Graduate (all 3 chapter achievements already unlocked)", () => {
    it("does not unlock with only 2 of the 3 chapter achievements", async () => {
      const user = await createTestUser(`ach-graduate-partial-${Date.now()}@hango.dev`);
      await db.achievement.createMany({
        data: [
          { userId: user.id, key: "chapter_completed_beginner" },
          { userId: user.id, key: "chapter_completed_intermediate" },
        ],
      });

      await checkGraduateAchievement(user.id);
      expect(await unlockedKeys(user.id)).not.toContain("curriculum_graduate");
    });

    it("unlocks and pays 50 coins once all 3 chapter achievements exist, idempotently", async () => {
      const user = await createTestUser(`ach-graduate-done-${Date.now()}@hango.dev`);
      await db.achievement.createMany({
        data: [
          { userId: user.id, key: "chapter_completed_beginner" },
          { userId: user.id, key: "chapter_completed_intermediate" },
          { userId: user.id, key: "chapter_completed_advanced" },
        ],
      });

      await checkGraduateAchievement(user.id);
      expect(await unlockedKeys(user.id)).toContain("curriculum_graduate");
      expect(await getCoinBalance(user.id)).toBe(50);

      await checkGraduateAchievement(user.id);
      expect(await getCoinBalance(user.id)).toBe(50);
    });
  });

  describe("Lab first-session achievements", () => {
    it("does not unlock speaking_lab_first with no completed session", async () => {
      const user = await createTestUser(`ach-speaking-none-${Date.now()}@hango.dev`);
      await checkSpeakingLabAchievements(user.id);
      expect(await unlockedKeys(user.id)).not.toContain("speaking_lab_first");
    });

    it("unlocks speaking_lab_first and pays 15 coins on the first completed session, idempotently", async () => {
      const user = await createTestUser(`ach-speaking-done-${Date.now()}@hango.dev`);
      await db.speakingSession.create({
        data: {
          userId: user.id,
          activityType: "PRONUNCIATION",
          prompt: "test fixture",
          completionState: "COMPLETED",
          completedAt: new Date(),
        },
      });

      await checkSpeakingLabAchievements(user.id);
      expect(await unlockedKeys(user.id)).toContain("speaking_lab_first");
      expect(await getCoinBalance(user.id)).toBe(15);

      await checkSpeakingLabAchievements(user.id);
      expect(await getCoinBalance(user.id)).toBe(15);
    });

    it("does not unlock writing_lab_first with no submitted attempt", async () => {
      const user = await createTestUser(`ach-writing-none-${Date.now()}@hango.dev`);
      await checkWritingLabAchievements(user.id);
      expect(await unlockedKeys(user.id)).not.toContain("writing_lab_first");
    });

    it("unlocks writing_lab_first and pays 15 coins on the first submitted attempt, idempotently", async () => {
      const user = await createTestUser(`ach-writing-done-${Date.now()}@hango.dev`);
      await db.writingAttempt.create({
        data: {
          userId: user.id,
          customPrompt: { topic: "test fixture" },
          draft: "test",
          submittedResponse: "test",
          submittedAt: new Date(),
        },
      });

      await checkWritingLabAchievements(user.id);
      expect(await unlockedKeys(user.id)).toContain("writing_lab_first");
      expect(await getCoinBalance(user.id)).toBe(15);

      await checkWritingLabAchievements(user.id);
      expect(await getCoinBalance(user.id)).toBe(15);
    });
  });
});
