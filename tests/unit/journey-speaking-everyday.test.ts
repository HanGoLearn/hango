import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  buildJourneySpeakingBanks,
  JOURNEY_BANK_PLANS,
  journeyBankCandidateSlugs,
  renderJourneySpeakingBanks,
  type JourneyBankLesson,
} from "@/lib/content/journey-speaking-banks";
import { JOURNEY_EVERYDAY_BANK_PLANS } from "@/lib/content/journey-speaking-everyday";

const snapshot = JSON.parse(
  readFileSync("project/curriculum-audit-2026-10-10/final/matriz.json", "utf8"),
) as {
  lessons: Array<
    JourneyBankLesson & {
      chapter: string;
      difficulty: string;
      scenario: { slug: string };
    }
  >;
};
const all = snapshot.lessons.map((row) => ({
  ...row,
  studiedSteps: [] as string[],
}));
const everyday = all.filter((row) => row.chapter === "INTERMEDIATE");
function lesson(slug: string, steps: string[] = []) {
  const row = all.find((candidate) => candidate.slug === slug);
  if (!row) throw new Error(`Missing audited lesson ${slug}`);
  return { ...row, studiedSteps: steps };
}
describe("Everyday Life banks against the audited curriculum", () => {
  it("covers exactly 60 everyday lessons alongside the other reviewed batches", () => {
    expect(Object.keys(JOURNEY_EVERYDAY_BANK_PLANS).sort()).toEqual(
      everyday.map((row) => row.slug).sort(),
    );
    expect(everyday).toHaveLength(60);
    expect(new Set(everyday.map((row) => row.scenario.slug)).size).toBe(15);
    for (const slug of everyday.map((row) => row.slug))
      expect(JOURNEY_BANK_PLANS[slug]).toBe(JOURNEY_EVERYDAY_BANK_PLANS[slug]);
    expect(
      everyday.reduce((count, row) => count + row.vocabulary.length, 0),
    ).toBe(552);
    expect(everyday.reduce((count, row) => count + row.grammar.length, 0)).toBe(
      168,
    );
  });
  it.each(everyday)(
    "preserves every record and validates editorial selections in $slug",
    (row) => {
      const plan = JOURNEY_BANK_PLANS[row.slug]!;
      const bank = buildJourneySpeakingBanks(row, all)!;
      expect(bank.reviewIssues).toEqual([]);
      const words = [bank.core, bank.support, bank.extension]
        .flatMap((bucket) => bucket.vocabulary)
        .filter((item) => item.lessonId === row.id);
      const grammar = [bank.core, bank.support, bank.extension]
        .flatMap((bucket) => bucket.grammar)
        .filter((item) => item.lessonId === row.id);
      expect(words.map((item) => item.id).sort()).toEqual(
        row.vocabulary.map((item) => item.id).sort(),
      );
      expect(grammar.map((item) => item.id).sort()).toEqual(
        row.grammar.map((item) => item.id).sort(),
      );
      for (const item of words) {
        const source = row.vocabulary.find((word) => word.id === item.id)!;
        expect([item.text, item.pinyin, item.meaning]).toEqual([
          source.chineseForm,
          source.pinyin,
          source.meaning,
        ]);
        expect(item.evidence).toBe("not-observed");
      }
      for (const item of grammar) {
        const source = row.grammar.find((pattern) => pattern.id === item.id)!;
        expect([item.text, item.meaning]).toEqual([
          source.structure,
          source.name,
        ]);
        expect(item.evidence).toBe("not-observed");
      }
      expect(plan.coreWords.length).toBeGreaterThanOrEqual(4);
      expect(plan.coreWords.length).toBeLessThanOrEqual(6);
      expect(plan.coreGrammar).toHaveLength(2);
      expect(
        plan.coreWords.every((text) => !plan.optionalWords?.includes(text)),
      ).toBe(true);
      expect(
        plan.coreGrammar.every((text) => !plan.optionalGrammar?.includes(text)),
      ).toBe(true);
      expect(
        (plan.optionalWords ?? []).every((text) =>
          row.vocabulary.some((word) => word.chineseForm === text),
        ),
      ).toBe(true);
      expect(
        (plan.optionalGrammar ?? []).every((text) =>
          row.grammar.some((pattern) => pattern.structure === text),
        ),
      ).toBe(true);
      expect(plan.openingLine).not.toMatch(/我们开始|开始练习/);
      expect(plan.openingLine).toMatch(/[\u4e00-\u9fff]/);
      expect(plan.openingLine.length).toBeLessThanOrEqual(26);
      expect(plan.relatedLessons.length).toBeLessThanOrEqual(8);
      expect(new Set(plan.relatedLessons).size).toBe(
        plan.relatedLessons.length,
      );
      expect(
        plan.relatedLessons.every(
          (slug) =>
            slug !== row.slug && Object.hasOwn(JOURNEY_BANK_PLANS, slug),
        ),
      ).toBe(true);
      expect(journeyBankCandidateSlugs(row.slug)).toEqual(plan.relatedLessons);
      expect(
        bank.support.vocabulary.every((item) => item.lessonId === row.id),
      ).toBe(true);
      expect(
        bank.support.grammar.every((item) => item.lessonId === row.id),
      ).toBe(true);
      expect(bank.phraseBank).toEqual([]);
    },
  );
  it.each(everyday)(
    "recycles only related exposed records with bounded context in $slug",
    (row) => {
      const bank = buildJourneySpeakingBanks(
        row,
        all.map((candidate) => ({
          ...candidate,
          studiedSteps: ["VOCABULARY", "GRAMMAR", "DIALOGUE"],
        })),
      )!;
      expect(bank.support.vocabulary.length).toBeLessThanOrEqual(16);
      expect(bank.support.grammar.length).toBeLessThanOrEqual(6);
      expect(bank.extension.vocabulary.length).toBeLessThanOrEqual(4);
      const allWords = [bank.core, bank.support, bank.extension].flatMap(
        (bucket) => bucket.vocabulary,
      );
      const allGrammar = [bank.core, bank.support, bank.extension].flatMap(
        (bucket) => bucket.grammar,
      );
      expect(new Set(allWords.map((item) => item.id)).size).toBe(
        allWords.length,
      );
      expect(new Set(allGrammar.map((item) => item.id)).size).toBe(
        allGrammar.length,
      );
      for (const item of [
        ...bank.support.vocabulary,
        ...bank.support.grammar,
      ].filter((entry) => entry.lessonId !== row.id)) {
        expect(JOURNEY_BANK_PLANS[row.slug]!.relatedLessons).toContain(
          item.lessonSlug,
        );
        expect(item.evidence).toBe("step-completed-exposure");
      }
    },
  );
  it("keeps food and drug allergy records separate and requires the matching step", () => {
    const current = lesson("health-doctors-visit");
    const food = lesson("restaurant-ingredients-and-preferences", [
      "VOCABULARY",
      "GRAMMAR",
    ]);
    const own = buildJourneySpeakingBanks(current, [food])!;
    expect(
      own.support.vocabulary.every((item) => item.lessonId === current.id),
    ).toBe(true);
    const pharmacy = lesson("health-pharmacy-describing-symptoms", [
      "SITUATION",
      "DIALOGUE",
    ]);
    const banks = buildJourneySpeakingBanks(current, [pharmacy])!;
    expect(
      banks.support.vocabulary.every((item) => item.lessonId === current.id),
    ).toBe(true);
    expect(
      banks.support.grammar.every((item) => item.lessonId === current.id),
    ).toBe(true);
    const allergies = [current, food]
      .flatMap((row) => row.vocabulary)
      .filter((word) => word.chineseForm === "过敏");
    expect(allergies).toHaveLength(2);
    expect(allergies[0]!.id).not.toBe(allergies[1]!.id);
    expect(renderJourneySpeakingBanks(banks)).toContain(
      "NOT proof of comprehension",
    );
  });
  it("retains the two advanced-difficulty health lessons inside their existing chapter", () => {
    const mixed = everyday.filter((row) => row.difficulty === "ADVANCED");
    expect(mixed.map((row) => row.slug).sort()).toEqual([
      "health-emergency-situations",
      "health-follow-up-and-insurance",
    ]);
    for (const row of mixed)
      expect(JOURNEY_BANK_PLANS[row.slug]?.rationale).toContain(
        "existing advanced difficulty",
      );
  });
  it("keeps fiction and consent explicit in higher-stakes or farewell scenes", () => {
    expect(
      JOURNEY_BANK_PLANS["health-emergency-situations"]?.rationale,
    ).toContain("If a real emergency is stated, stop role-play");
    expect(
      JOURNEY_BANK_PLANS["gym-fitness-recovering-from-a-minor-injury"]
        ?.rationale,
    ).toContain("Do not invent severity");
    expect(
      JOURNEY_BANK_PLANS["renting-apartment-signing-the-contract"]?.rationale,
    ).toContain("explicitly fictional terms");
    expect(
      JOURNEY_BANK_PLANS["social-events-politely-ending-a-conversation"]
        ?.rationale,
    ).toContain("without another compulsory question");
    expect(
      JOURNEY_BANK_PLANS["grocery-shopping-at-the-grocery-store"]?.rationale,
    ).toContain("inconsistent total");
  });
});
