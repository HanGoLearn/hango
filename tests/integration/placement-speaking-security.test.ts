import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import type { PlacementSpeakingEvaluation } from "@/lib/placement-speaking";
import {
  claimPlacementSpeakingAttempt,
  completePlacementSpeakingAttempt,
  getOrCreatePlacementSpeakingAttempt,
  PlacementSpeakingInvalidStateError,
  PlacementSpeakingNotFoundError,
} from "@/lib/placement-speaking-data";

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

async function createSpeakingSession(userId: string) {
  return db.placementSession.create({
    data: {
      userId,
      status: "SPEAKING",
      vocabularyHskLevel: 5,
      grammarHskLevel: 4,
      readingHskLevel: 6,
      listeningHskLevel: 5,
    },
  });
}

function evaluation(score: number): PlacementSpeakingEvaluation {
  return {
    pronunciation: score,
    fluency: score,
    accuracy: score,
    complexity: score,
    communicationEffectiveness: score,
    objectiveCompletionRatio: 1,
    score,
    notes: "Test evaluation",
    recommendedNextStep: "Continue",
    mistakes: [],
  };
}

describe("Placement speaking authorization and integrity", () => {
  it("derives the level on the server and never exposes another learner's attempt", async () => {
    const owner = await createTestUser("speaking-owner");
    const attacker = await createTestUser("speaking-attacker");
    const session = await createSpeakingSession(owner.id);

    const attempt = await getOrCreatePlacementSpeakingAttempt(
      owner.id,
      session.id,
    );
    expect(attempt.level).toBe(4);

    await expect(
      getOrCreatePlacementSpeakingAttempt(attacker.id, session.id),
    ).rejects.toBeInstanceOf(PlacementSpeakingNotFoundError);
    await expect(
      claimPlacementSpeakingAttempt(
        attacker.id,
        session.id,
        attempt.attemptId,
      ),
    ).rejects.toBeInstanceOf(PlacementSpeakingNotFoundError);

    const persisted = await db.placementSpeakingAttempt.findUniqueOrThrow({
      where: { id: attempt.attemptId },
    });
    expect(persisted.hskLevel).toBe(4);
    expect(persisted.status).toBe("PENDING");
  });

  it("accepts only one concurrent submission claim and rejects replay", async () => {
    const user = await createTestUser("speaking-replay");
    const session = await createSpeakingSession(user.id);
    const attempt = await getOrCreatePlacementSpeakingAttempt(
      user.id,
      session.id,
    );

    const claims = await Promise.allSettled([
      claimPlacementSpeakingAttempt(user.id, session.id, attempt.attemptId),
      claimPlacementSpeakingAttempt(user.id, session.id, attempt.attemptId),
    ]);
    expect(claims.filter((result) => result.status === "fulfilled")).toHaveLength(
      1,
    );
    expect(claims.filter((result) => result.status === "rejected")).toHaveLength(
      1,
    );

    const completed = await completePlacementSpeakingAttempt(
      user.id,
      session.id,
      attempt.attemptId,
      [
        { role: "assistant", content: "最近团队的效率怎么样？" },
        { role: "user", content: "我觉得我们可以改变工作流程。" },
      ],
      [0.91],
      evaluation(84),
      { provider: "openai", model: "test-model" },
    );
    expect(completed.nextAttempt?.level).toBe(5);
    expect(completed.outcome).toBeNull();

    await expect(
      completePlacementSpeakingAttempt(
        user.id,
        session.id,
        attempt.attemptId,
        [{ role: "user", content: "replay" }],
        [1],
        evaluation(100),
        { provider: "openai", model: "test-model" },
      ),
    ).rejects.toBeInstanceOf(PlacementSpeakingInvalidStateError);

    const persisted = await db.placementSpeakingAttempt.findUniqueOrThrow({
      where: { id: attempt.attemptId },
    });
    expect(persisted.status).toBe("COMPLETED");
    expect(persisted.score).toBe(84);
    expect(persisted.passed).toBe(true);
    expect(persisted.evaluatorProvider).toBe("openai");
  });

  it("ends the oral climb from persisted evidence and stores a server-derived result", async () => {
    const user = await createTestUser("speaking-result");
    const session = await createSpeakingSession(user.id);
    const first = await getOrCreatePlacementSpeakingAttempt(user.id, session.id);
    await claimPlacementSpeakingAttempt(user.id, session.id, first.attemptId);

    const passed = await completePlacementSpeakingAttempt(
      user.id,
      session.id,
      first.attemptId,
      [{ role: "user", content: "虽然要花时间，但是可以提高效率。" }],
      [0.88],
      evaluation(82),
      { provider: "openai", model: "test-model" },
    );
    const second = passed.nextAttempt;
    if (!second) throw new Error("Expected the server to issue level 5");

    await claimPlacementSpeakingAttempt(user.id, session.id, second.attemptId);
    const failed = await completePlacementSpeakingAttempt(
      user.id,
      session.id,
      second.attemptId,
      [{ role: "user", content: "我不知道。" }],
      [0.72],
      evaluation(45),
      { provider: "openai", model: "test-model" },
    );

    expect(failed.nextAttempt).toBeNull();
    expect(failed.outcome).toEqual({
      creditedLevel: 4,
      diagnosticLevel: null,
    });

    const persistedSession = await db.placementSession.findUniqueOrThrow({
      where: { id: session.id },
      include: { speakingAttempts: { orderBy: { hskLevel: "asc" } } },
    });
    expect(persistedSession.status).toBe("COMPLETED");
    expect(persistedSession.completedAt).not.toBeNull();
    expect(persistedSession.speakingHskLevel).toBe(4);
    expect(persistedSession.speakingDiagnosticHskLevel).toBeNull();
    expect(persistedSession.speakingAttempts).toHaveLength(2);
    expect(persistedSession.speakingAttempts.map((attempt) => attempt.score)).toEqual([
      82,
      45,
    ]);

    await expect(
      getOrCreatePlacementSpeakingAttempt(user.id, session.id),
    ).rejects.toBeInstanceOf(PlacementSpeakingNotFoundError);
  });
});
