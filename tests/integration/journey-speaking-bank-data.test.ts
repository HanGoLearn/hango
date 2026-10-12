import { beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { getJourneySpeakingBanks } from "@/lib/content/journey-speaking-bank-data";
import { JOURNEY_BANK_PLANS } from "@/lib/content/journey-speaking-banks";

// This file deliberately cannot write to development or production databases.
const destination = new URL(process.env.DATABASE_URL ?? "http://missing");
if (
  destination.hostname !== "127.0.0.1" ||
  destination.port !== "54329" ||
  destination.pathname !== "/hango_local_test"
) {
  throw new Error(
    "Run this test only with scripts/test-integration-local.ts (disposable Postgres).",
  );
}
let firstUserId: string;
let secondUserId: string;
let pilot: Array<{
  id: string;
  slug: string;
  steps: Array<{ id: string; type: string }>;
  vocabulary: Array<{ vocabularyItem: { id: string } }>;
  grammarPoints: Array<{ grammarPoint: { id: string } }>;
}>;

beforeAll(async () => {
  pilot = await db.lesson.findMany({
    where: {
      slug: { in: Object.keys(JOURNEY_BANK_PLANS) },
      status: "PUBLISHED",
    },
    select: {
      id: true,
      slug: true,
      steps: { select: { id: true, type: true } },
      vocabulary: {
        where: { vocabularyItem: { status: "PUBLISHED" } },
        select: { vocabularyItem: { select: { id: true } } },
      },
      grammarPoints: {
        where: { grammarPoint: { status: "PUBLISHED" } },
        select: { grammarPoint: { select: { id: true } } },
      },
    },
  });
  firstUserId = (
    await db.user.create({
      data: { email: `banks-a-${crypto.randomUUID()}@example.test` },
    })
  ).id;
  secondUserId = (
    await db.user.create({
      data: { email: `banks-b-${crypto.randomUUID()}@example.test` },
    })
  ).id;
  const greetings = pilot.find(
    (row) => row.slug === "foundations-greetings-and-introductions",
  )!;
  const numbers = pilot.find(
    (row) => row.slug === "foundations-numbers-time-and-dates",
  )!;
  await db.learnerLessonProgress.create({
    data: {
      userId: firstUserId,
      lessonId: greetings.id,
      currentStepId: greetings.steps[0]!.id,
      completedStepIds: greetings.steps
        .filter((step) =>
          ["VOCABULARY", "GRAMMAR", "DIALOGUE"].includes(step.type),
        )
        .map((step) => step.id),
    },
  });
  await db.learnerLessonProgress.create({
    data: {
      userId: firstUserId,
      lessonId: numbers.id,
      currentStepId: numbers.steps[0]!.id,
      // A valid unrelated step cannot imply vocabulary or grammar exposure.
      completedStepIds: numbers.steps
        .filter((step) => step.type === "SITUATION")
        .map((step) => step.id),
    },
  });
  const ingredients = pilot.find(
    (row) => row.slug === "restaurant-ingredients-and-preferences",
  )!;
  await db.learnerLessonProgress.create({
    data: {
      userId: firstUserId,
      lessonId: ingredients.id,
      currentStepId: ingredients.steps[0]!.id,
      completedStepIds: ingredients.steps
        .filter((step) => step.type === "VOCABULARY")
        .map((step) => step.id),
    },
  });
  const contract = pilot.find(
    (row) => row.slug === "negotiating-job-contract-reviewing-contract-terms",
  )!;
  await db.learnerLessonProgress.create({
    data: {
      userId: firstUserId,
      lessonId: contract.id,
      currentStepId: contract.steps[0]!.id,
      completedStepIds: contract.steps
        .filter((step) => step.type === "GRAMMAR")
        .map((step) => step.id),
    },
  });
}, 30_000);

describe("Journey banks against disposable real Postgres", () => {
  it("resolves all 164 reviewed published lessons without missing core records", async () => {
    expect(pilot).toHaveLength(164);
    for (const row of pilot) {
      const banks = await getJourneySpeakingBanks(secondUserId, row.id);
      expect(banks?.reviewIssues, row.slug).toEqual([]);
      expect(banks?.lessonId).toBe(row.id);
      expect(banks?.core.vocabulary.length).toBeGreaterThan(0);
      const buckets = [banks!.core, banks!.support, banks!.extension];
      expect(
        buckets
          .flatMap((bucket) => bucket.vocabulary)
          .filter((item) => item.lessonId === row.id)
          .map((item) => item.id)
          .sort(),
      ).toEqual(row.vocabulary.map((link) => link.vocabularyItem.id).sort());
      expect(
        buckets
          .flatMap((bucket) => bucket.grammar)
          .filter((item) => item.lessonId === row.id)
          .map((item) => item.id)
          .sort(),
      ).toEqual(row.grammarPoints.map((link) => link.grammarPoint.id).sort());
    }
  }, 30_000);
  it("reads only each user's actual matching steps, without creating progress for the other", async () => {
    const numbers = pilot.find(
      (row) => row.slug === "foundations-numbers-time-and-dates",
    )!;
    const first = await getJourneySpeakingBanks(firstUserId, numbers.id);
    const second = await getJourneySpeakingBanks(secondUserId, numbers.id);
    expect(
      first?.support.vocabulary.some(
        (item) => item.lessonSlug === "foundations-greetings-and-introductions",
      ),
    ).toBe(true);
    expect(
      first?.core.vocabulary.every((item) => item.evidence === "not-observed"),
    ).toBe(true);
    expect(
      second?.support.vocabulary.every((item) => item.lessonId === numbers.id),
    ).toBe(true);
    expect(
      second?.support.grammar.every((item) => item.lessonId === numbers.id),
    ).toBe(true);
    expect(second?.phraseBank).toEqual([]);
    expect(
      await db.learnerLessonProgress.count({ where: { userId: secondUserId } }),
    ).toBe(0);
  });
  it("isolates real Everyday Life exposure by account and vocabulary/grammar step", async () => {
    const current = pilot.find(
      (row) => row.slug === "restaurant-requests-and-problems",
    )!;
    const first = await getJourneySpeakingBanks(firstUserId, current.id);
    const second = await getJourneySpeakingBanks(secondUserId, current.id);
    expect(
      first?.support.vocabulary.some(
        (item) =>
          item.lessonSlug === "restaurant-ingredients-and-preferences" &&
          item.evidence === "step-completed-exposure",
      ),
    ).toBe(true);
    expect(
      first?.support.grammar.some(
        (item) => item.lessonSlug === "restaurant-ingredients-and-preferences",
      ),
    ).toBe(false);
    expect(
      second?.support.vocabulary.every((item) => item.lessonId === current.id),
    ).toBe(true);
    expect(
      second?.support.grammar.every((item) => item.lessonId === current.id),
    ).toBe(true);
    expect(
      await db.learnerLessonProgress.count({ where: { userId: secondUserId } }),
    ).toBe(0);
  });
  it("does not alter any progress while resolving banks repeatedly", async () => {
    const before = await db.learnerLessonProgress.findMany({
      where: { userId: firstUserId },
      orderBy: { lessonId: "asc" },
    });
    for (const row of pilot) await getJourneySpeakingBanks(firstUserId, row.id);
    const after = await db.learnerLessonProgress.findMany({
      where: { userId: firstUserId },
      orderBy: { lessonId: "asc" },
    });
    expect(after).toEqual(before);
  }, 30_000);
  it("isolates Advanced grammar exposure without inferring vocabulary or sharing another account's history", async () => {
    const current = pilot.find(
      (row) =>
        row.slug ===
        "negotiating-job-contract-pushing-back-on-an-unfavorable-clause",
    )!;
    const related = "negotiating-job-contract-reviewing-contract-terms";
    const first = await getJourneySpeakingBanks(firstUserId, current.id);
    const second = await getJourneySpeakingBanks(secondUserId, current.id);
    expect(
      first?.support.grammar.some(
        (item) =>
          item.lessonSlug === related &&
          item.evidence === "step-completed-exposure",
      ),
    ).toBe(true);
    expect(
      first?.support.vocabulary.some((item) => item.lessonSlug === related),
    ).toBe(false);
    expect(
      second?.support.grammar.every((item) => item.lessonId === current.id),
    ).toBe(true);
    expect(
      second?.support.vocabulary.every((item) => item.lessonId === current.id),
    ).toBe(true);
    expect(first?.phraseBank).toEqual([]);
    expect(second?.phraseBank).toEqual([]);
    expect(
      await db.learnerLessonProgress.count({ where: { userId: secondUserId } }),
    ).toBe(0);
  });
});
