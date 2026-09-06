import { afterEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { getOrGenerateScenarioCompletion } from "@/lib/scenario-completion";

// No prior test coverage existed for this file at all before this one -
// added alongside caching getChapterHskSums (project/db-operations-optimization.md,
// Tier 3) so that change has real regression coverage, not just the
// ttl-cache unit test.

const { authMock } = vi.hoisted(() => ({ authMock: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: authMock }));

// Partial mock (2026-09-05 cost/DB audit fix regression test) - defaults to
// calling straight through to the real recomputeGeneralLevelPoints (set
// below, inside the factory, where `actual` is in scope), so every existing
// test still exercises the real function exactly as before. Only the new
// "retries after a partial failure" test below overrides it, once, via
// mockRejectedValueOnce - achievements/grantCoins are never mocked, so they
// still run for real against the real database in every test here.
const { recomputeGeneralLevelPointsMock } = vi.hoisted(() => ({
  recomputeGeneralLevelPointsMock: vi.fn(),
}));
vi.mock("@/lib/general-level", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/general-level")>();
  recomputeGeneralLevelPointsMock.mockImplementation(
    actual.recomputeGeneralLevelPoints,
  );
  return {
    ...actual,
    recomputeGeneralLevelPoints: recomputeGeneralLevelPointsMock,
  };
});

const testEmails: string[] = [];
const testDomainIds: string[] = [];

afterEach(async () => {
  vi.clearAllMocks();
  if (testDomainIds.length > 0) {
    // Domain -> Scenario has no onDelete: Cascade (schema.prisma) - delete
    // scenarios first (which does cascade down through levels -> lessons ->
    // reflection reports/completions), then the now-childless domains.
    await db.scenario.deleteMany({
      where: { domainId: { in: testDomainIds } },
    });
    await db.domain.deleteMany({ where: { id: { in: testDomainIds } } });
    testDomainIds.length = 0;
  }
  if (testEmails.length > 0) {
    await db.user.deleteMany({ where: { email: { in: testEmails } } });
    testEmails.length = 0;
  }
});

async function createTestUser(email: string) {
  testEmails.push(email);
  const user = await db.user.create({ data: { email } });
  // recomputeGeneralLevelPoints (called by getOrGenerateScenarioCompletion)
  // updates an existing LearnerProfile row rather than upserting one.
  await db.learnerProfile.create({ data: { userId: user.id } });
  authMock.mockResolvedValue({ user: { id: user.id } });
  return user;
}

async function createTestScenario() {
  const domain = await db.domain.create({
    data: {
      name: `Test Domain ${Date.now()}`,
      slug: `test-domain-${Date.now()}`,
    },
  });
  testDomainIds.push(domain.id);

  const scenario = await db.scenario.create({
    data: {
      domainId: domain.id,
      name: `Test Scenario ${Date.now()}`,
      slug: `test-scenario-${Date.now()}`,
      status: "PUBLISHED",
    },
  });
  const level = await db.scenarioLevel.create({
    data: { scenarioId: scenario.id, difficulty: "BEGINNER" },
  });
  const lesson = await db.lesson.create({
    data: {
      scenarioLevelId: level.id,
      title: `Test Lesson ${Date.now()}`,
      slug: `test-scenario-completion-lesson-${Date.now()}`,
      communicationObjective: "Order food",
      status: "PUBLISHED",
      hskReference: 3,
    },
  });
  return { scenario, level, lesson };
}

describe("Scenario completion (integration, real database)", () => {
  it("is null until every published lesson has a reflection report", async () => {
    const user = await createTestUser(
      `scenario-completion-incomplete-${Date.now()}@hango.dev`,
    );
    const { scenario } = await createTestScenario();

    const result = await getOrGenerateScenarioCompletion(user.id, scenario.id);
    expect(result).toBeNull();
  });

  it("computes and persists General Level points once every lesson is reflected on", async () => {
    const user = await createTestUser(
      `scenario-completion-full-${Date.now()}@hango.dev`,
    );
    const { scenario, lesson } = await createTestScenario();

    await db.lessonReflectionReport.create({
      data: {
        userId: user.id,
        lessonId: lesson.id,
        vocabularyCovered: 0,
        vocabularyTotal: 0,
        vocabularyScore: 80,
        comprehensionScore: 80,
        grammarScore: 80,
        speakingScore: 80,
        totalScore: 80,
        hanNarrative: "Well done.",
        strengths: [],
        improvements: [],
      },
    });

    const result = await getOrGenerateScenarioCompletion(user.id, scenario.id);
    expect(result).not.toBeNull();
    expect(result!.weightedReflectionAverage).toBe(80);
    expect(result!.earnedPoints).toBeGreaterThan(0);
    expect(result!.chapter).toBe("BEGINNER");

    const persisted = await db.scenarioCompletion.findUnique({
      where: { userId_scenarioId: { userId: user.id, scenarioId: scenario.id } },
    });
    expect(persisted).not.toBeNull();
    expect(persisted!.earnedPoints).toBe(result!.earnedPoints);

    // Second call: cached getChapterHskSums must still produce the same
    // result, and an unchanged score must not re-upsert/re-recompute.
    const second = await getOrGenerateScenarioCompletion(user.id, scenario.id);
    expect(second).toEqual(result);
  });

  it("retries the whole reward chain after a partial failure, instead of skipping it forever (2026-09-05 fix)", async () => {
    const user = await createTestUser(
      `scenario-completion-partial-failure-${Date.now()}@hango.dev`,
    );
    const { scenario, lesson } = await createTestScenario();
    await db.lessonReflectionReport.create({
      data: {
        userId: user.id,
        lessonId: lesson.id,
        vocabularyCovered: 0,
        vocabularyTotal: 0,
        vocabularyScore: 80,
        comprehensionScore: 80,
        grammarScore: 80,
        speakingScore: 80,
        totalScore: 80,
        hanNarrative: "Well done.",
        strengths: [],
        improvements: [],
      },
    });

    recomputeGeneralLevelPointsMock.mockRejectedValueOnce(
      new Error("simulated transient failure"),
    );
    await expect(
      getOrGenerateScenarioCompletion(user.id, scenario.id),
    ).rejects.toThrow("simulated transient failure");

    // The completion row exists (the upsert already committed) but rewards
    // were never confirmed - before this fix, this state meant the reward
    // chain would never run again for this scenario.
    const afterFailure = await db.scenarioCompletion.findUnique({
      where: { userId_scenarioId: { userId: user.id, scenarioId: scenario.id } },
    });
    expect(afterFailure).not.toBeNull();
    expect(afterFailure!.rewardsGrantedAt).toBeNull();

    const result = await getOrGenerateScenarioCompletion(user.id, scenario.id);
    expect(result).not.toBeNull();
    expect(recomputeGeneralLevelPointsMock).toHaveBeenCalledTimes(2);

    const afterRetry = await db.scenarioCompletion.findUnique({
      where: { userId_scenarioId: { userId: user.id, scenarioId: scenario.id } },
    });
    expect(afterRetry!.rewardsGrantedAt).not.toBeNull();
  });
});
