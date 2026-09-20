import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { applyPlacementCredit } from "@/lib/placement-credit";
import { getOrCreateLearnerProfile } from "@/lib/learner-profile";

/**
 * "How placement results become real Learning Journey credit"
 * (project/TASKS.md, 2026-08-16; implemented 2026-08-24, scoped to General
 * Level points only). Builds a PlacementSession + a handful of real
 * PlacementAttempt rows directly (rather than replaying the full adaptive
 * exam like placement-exam.test.ts's multi-minute walkthroughs) so this
 * stays fast while still exercising real seeded questions and real
 * Lesson/LessonReflectionReport writes.
 */

const testUserIds: string[] = [];
const testSessionIds: string[] = [];

afterEach(async () => {
  if (testSessionIds.length > 0) {
    await db.placementAttempt.deleteMany({ where: { sessionId: { in: testSessionIds } } });
    await db.placementSession.deleteMany({ where: { id: { in: testSessionIds } } });
    testSessionIds.length = 0;
  }
  if (testUserIds.length > 0) {
    // Cascades to LearnerLessonCompletion/LessonReflectionReport/ScenarioCompletion.
    await db.user.deleteMany({ where: { id: { in: testUserIds } } });
    testUserIds.length = 0;
  }
});

async function createTestUser(email: string) {
  const user = await db.user.create({ data: { email } });
  testUserIds.push(user.id);
  // applyPlacementCredit's real caller (the onboarding/placement-exam flow)
  // always has a LearnerProfile by this point (app/(app)/layout.tsx and
  // onboarding both call getOrCreateLearnerProfile first) -
  // recomputeGeneralLevelPoints assumes the row already exists.
  await getOrCreateLearnerProfile(user.id);
  return user;
}

async function createSessionWithAttempts(
  userId: string,
  levels: { vocabulary: number; grammar: number; reading: number; listening: number },
) {
  const session = await db.placementSession.create({
    data: {
      userId,
      status: "COMPLETED",
      completedAt: new Date(),
      vocabularyHskLevel: levels.vocabulary,
      grammarHskLevel: levels.grammar,
      readingHskLevel: levels.reading,
      listeningHskLevel: levels.listening,
    },
  });
  testSessionIds.push(session.id);

  // Real HSK1 questions per skill, one correct + one wrong each, so
  // applyPlacementCredit's ratio computation has real (partial) evidence to
  // work from instead of an empty progress map.
  for (const skill of ["VOCABULARY", "GRAMMAR", "READING", "LISTENING"] as const) {
    const questions = await db.placementQuestion.findMany({
      where: { skill, hskLevel: 1 },
      take: 2,
    });
    if (questions.length < 2) continue;
    await db.placementAttempt.create({
      data: { sessionId: session.id, questionId: questions[0]!.id, isCorrect: true },
    });
    await db.placementAttempt.create({
      data: { sessionId: session.id, questionId: questions[1]!.id, isCorrect: false },
    });
  }

  return session;
}

describe("applyPlacementCredit (integration, real database, real seeded content)", () => {
  it("credits lessons at or below the lowest placed skill, tagged source PLACEMENT", async () => {
    const user = await createTestUser(`credit-basic-${Date.now()}@hango.dev`);
    const session = await createSessionWithAttempts(user.id, {
      vocabulary: 2,
      grammar: 1,
      reading: 2,
      listening: 2,
    });

    const result = await applyPlacementCredit(user.id, session.id);
    expect(result).not.toBeNull();
    // Grammar (1) is the weakest skill - eligibility is gated by it, not the average.
    expect(result!.creditedLevel).toBe(1);
    expect(result!.creditedLessonCount).toBeGreaterThan(0);

    const completions = await db.learnerLessonCompletion.findMany({
      where: { userId: user.id },
      include: { lesson: { select: { hskReference: true } } },
    });
    expect(completions.length).toBe(result!.creditedLessonCount);
    expect(completions.every((c) => c.source === "PLACEMENT")).toBe(true);
    expect(completions.every((c) => (c.lesson.hskReference ?? 99) <= 1)).toBe(true);

    const reports = await db.lessonReflectionReport.findMany({
      where: { userId: user.id },
    });
    expect(reports.length).toBe(result!.creditedLessonCount);
    expect(reports.every((r) => r.totalScore !== null)).toBe(true);
  }, 60000);

  it("excludes HSK7-9 even when every skill places at the diagnostic ceiling", async () => {
    const user = await createTestUser(`credit-ceiling-${Date.now()}@hango.dev`);
    const session = await createSessionWithAttempts(user.id, {
      vocabulary: 7,
      grammar: 7,
      reading: 7,
      listening: 7,
    });

    const result = await applyPlacementCredit(user.id, session.id);
    expect(result).not.toBeNull();
    expect(result!.creditedLevel).toBe(7);

    const completions = await db.learnerLessonCompletion.findMany({
      where: { userId: user.id },
      include: { lesson: { select: { hskReference: true } } },
    });
    expect(completions.length).toBeGreaterThan(0);
    expect(completions.every((c) => (c.lesson.hskReference ?? 99) <= 6)).toBe(true);
  }, 300000);

  it("credits nothing when the weakest skill never left Pre-HSK", async () => {
    const user = await createTestUser(`credit-zero-${Date.now()}@hango.dev`);
    const session = await createSessionWithAttempts(user.id, {
      vocabulary: 3,
      grammar: 0,
      reading: 3,
      listening: 3,
    });

    const result = await applyPlacementCredit(user.id, session.id);
    expect(result).toEqual({ creditedLevel: 0, creditedLessonCount: 0 });

    const completions = await db.learnerLessonCompletion.findMany({
      where: { userId: user.id },
    });
    expect(completions).toHaveLength(0);
  });

  it("uses only the persisted speaking result when it is weaker than the written exam", async () => {
    const user = await createTestUser(`credit-speaking-${Date.now()}@hango.dev`);
    const session = await createSessionWithAttempts(user.id, {
      vocabulary: 3,
      grammar: 3,
      reading: 3,
      listening: 3,
    });
    await db.placementSession.update({
      where: { id: session.id },
      data: { speakingHskLevel: 2 },
    });
    await db.placementSpeakingAttempt.create({
      data: {
        sessionId: session.id,
        hskLevel: 3,
        status: "COMPLETED",
        score: 48,
        passed: false,
        pronunciation: 48,
        fluency: 48,
        accuracy: 48,
        complexity: 48,
        communicationEffectiveness: 48,
        objectiveCompletionRatio: 1,
        completedAt: new Date(),
      },
    });

    const result = await applyPlacementCredit(user.id, session.id);
    expect(result).not.toBeNull();
    expect(result!.creditedLevel).toBe(2);

    const completions = await db.learnerLessonCompletion.findMany({
      where: { userId: user.id },
      include: { lesson: { select: { hskReference: true } } },
    });
    expect(completions.length).toBeGreaterThan(0);
    expect(completions.every((item) => (item.lesson.hskReference ?? 99) <= 2)).toBe(
      true,
    );
  }, 120000);

  it("is idempotent - a second call never duplicates or downgrades existing credit", async () => {
    const user = await createTestUser(`credit-idempotent-${Date.now()}@hango.dev`);
    const session = await createSessionWithAttempts(user.id, {
      vocabulary: 1,
      grammar: 1,
      reading: 1,
      listening: 1,
    });

    const first = await applyPlacementCredit(user.id, session.id);
    const second = await applyPlacementCredit(user.id, session.id);

    expect(second!.creditedLessonCount).toBe(0);
    const completions = await db.learnerLessonCompletion.findMany({
      where: { userId: user.id },
    });
    expect(completions.length).toBe(first!.creditedLessonCount);
  }, 90000);

  it("never overwrites a real completion with a placement-derived one", async () => {
    const user = await createTestUser(`credit-real-first-${Date.now()}@hango.dev`);
    const realLesson = await db.lesson.findFirst({
      where: { status: "PUBLISHED", hskReference: { lte: 1 } },
    });
    if (!realLesson) return;

    await db.learnerLessonCompletion.create({
      data: { userId: user.id, lessonId: realLesson.id, source: "COMPLETED" },
    });

    const session = await createSessionWithAttempts(user.id, {
      vocabulary: 1,
      grammar: 1,
      reading: 1,
      listening: 1,
    });
    await applyPlacementCredit(user.id, session.id);

    const completion = await db.learnerLessonCompletion.findUniqueOrThrow({
      where: { userId_lessonId: { userId: user.id, lessonId: realLesson.id } },
    });
    expect(completion.source).toBe("COMPLETED");
  }, 60000);
});
