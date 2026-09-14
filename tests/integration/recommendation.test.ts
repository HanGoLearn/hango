import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { computeRecommendation } from "@/lib/recommendation";

/**
 * computeRecommendation (rewritten 2026-08-24 to replace the old "always
 * Restaurant" placeholder) reads the real published scenario tree and, when
 * one exists, a real completed PlacementSession - so this runs against the
 * real database rather than mocking Prisma, same convention as
 * onboarding.test.ts.
 */

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

describe("computeRecommendation (integration, real database)", () => {
  it("recommends a real published scenario for a self-reported level, with no placement level", async () => {
    const user = await createTestUser(
      `recommendation-self-${Date.now()}@hango.dev`,
    );
    const result = await computeRecommendation({
      userId: user.id,
      currentLevel: "UNSURE",
      learningGoals: [],
      skillPriorities: [],
    });

    expect(result.primary).not.toBeNull();
    expect(result.primary!.scenarioSlug.length).toBeGreaterThan(0);
    expect(result.reason.length).toBeGreaterThan(0);
    expect(result.placementLevel).toBeNull();
  });

  it("returns localized scenario and domain names in a Spanish recommendation", async () => {
    const user = await createTestUser(
      `recommendation-spanish-${Date.now()}@hango.dev`,
    );
    const result = await computeRecommendation({
      userId: user.id,
      currentLevel: "HSK_1_2",
      learningGoals: [],
      skillPriorities: ["SPEAKING"],
      locale: "es",
    });

    expect(result.primary).toMatchObject({
      scenarioSlug: "getting-started",
      scenarioName: "Primeros pasos",
      domainName: "Fundamentos",
    });
    expect(result.reason).toContain("Primeros pasos");
    expect(result.reason).not.toContain("Getting Started");
  });

  it("uses the completed placement exam's lowest written skill, not the self-reported level, once one exists", async () => {
    const user = await createTestUser(
      `recommendation-placed-${Date.now()}@hango.dev`,
    );
    await db.placementSession.create({
      data: {
        userId: user.id,
        status: "COMPLETED",
        completedAt: new Date(),
        vocabularyHskLevel: 5,
        grammarHskLevel: 3,
        readingHskLevel: 6,
        listeningHskLevel: 4,
      },
    });

    const result = await computeRecommendation({
      userId: user.id,
      // Deliberately contradicts the placement result - the real signal
      // should win once it exists.
      currentLevel: "HSK_1_2",
      learningGoals: [],
      skillPriorities: [],
    });

    expect(result.placementLevel).toBe(3);
    expect(result.reason).toMatch(/placement exam/i);
  });

  it("connects a TRAVEL goal to a real scenario in the Travel domain", async () => {
    const travelDomain = await db.domain.findUnique({
      where: { slug: "travel" },
    });
    expect(travelDomain).not.toBeNull();

    const user = await createTestUser(
      `recommendation-goal-${Date.now()}@hango.dev`,
    );
    const result = await computeRecommendation({
      userId: user.id,
      currentLevel: "UNSURE",
      learningGoals: ["TRAVEL"],
      skillPriorities: [],
    });

    const travelMatch = result.goalMatches.find((m) => m.goal === "TRAVEL");
    expect(travelMatch).toBeDefined();
    expect(travelMatch!.scenarios.length).toBeGreaterThan(0);
  });

  it("omits a goal from goalMatches when nothing in the catalog matches its keywords", async () => {
    const user = await createTestUser(
      `recommendation-no-match-${Date.now()}@hango.dev`,
    );
    const result = await computeRecommendation({
      userId: user.id,
      currentLevel: "UNSURE",
      // HSK_PREPARATION has no keyword table (structured progression, not a
      // themed domain) - should never appear in goalMatches.
      learningGoals: ["HSK_PREPARATION"],
      skillPriorities: [],
    });

    expect(
      result.goalMatches.find((m) => m.goal === "HSK_PREPARATION"),
    ).toBeUndefined();
  });
});
