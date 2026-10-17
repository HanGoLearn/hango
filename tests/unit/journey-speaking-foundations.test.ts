import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  buildJourneySpeakingBanks,
  JOURNEY_BANK_PLANS,
  JOURNEY_PILOT_BANK_PLANS,
  journeyBankCandidateSlugs,
  type JourneyBankLesson,
} from "@/lib/content/journey-speaking-banks";

const snapshot = JSON.parse(
  readFileSync("project/curriculum-audit-2026-10-10/final/matriz.json", "utf8"),
) as {
  lessons: Array<
    JourneyBankLesson & {
      chapter: string;
      difficulty: string;
      missions: Array<{ aiRole: string }>;
    }
  >;
};
const foundations = snapshot.lessons
  .filter((lesson) => lesson.chapter === "BEGINNER")
  .map((lesson) => ({ ...lesson, studiedSteps: [] as string[] }));
describe("full Foundations editorial banks", () => {
  it("does not treat inherited object keys as reviewed lessons", () => {
    for (const slug of ["constructor", "toString", "__proto__"]) {
      expect(journeyBankCandidateSlugs(slug)).toEqual([]);
      expect(
        buildJourneySpeakingBanks({ ...foundations[0]!, slug }, foundations),
      ).toBeNull();
    }
  });
  it("keeps the voice/browser imports free of the full selection catalogue", () => {
    const contract = readFileSync(
      "src/lib/content/journey-speaking-bank-contract.ts",
      "utf8",
    );
    expect(contract).not.toMatch(
      /import .*journey-speaking-(foundations|everyday|advanced|banks)|JOURNEY_BANK_PLANS|@\/lib\/db/,
    );
    for (const file of [
      "src/lib/ai-context.ts",
      "src/lib/han-realtime.ts",
      "src/components/ai-teacher/han-voice-conversation.tsx",
    ]) {
      const code = readFileSync(file, "utf8");
      expect(code).toContain(
        'from "@/lib/content/journey-speaking-bank-contract"',
      );
      expect(code).not.toContain('from "@/lib/content/journey-speaking-banks"');
    }
  });
  it("keeps all 60 Foundations lessons alongside later batches without replacing the pilot", () => {
    const slugs = new Set(foundations.map((lesson) => lesson.slug));
    expect(
      Object.keys(JOURNEY_BANK_PLANS)
        .filter((slug) => slugs.has(slug))
        .sort(),
    ).toEqual(foundations.map((lesson) => lesson.slug).sort());
    expect(foundations).toHaveLength(60);
    for (const [slug, plan] of Object.entries(JOURNEY_PILOT_BANK_PLANS))
      expect(JOURNEY_BANK_PLANS[slug]).toBe(plan);
  });
  it.each(foundations)(
    "preserves exact records and reviewed selectors in $slug",
    (lesson) => {
      const plan = JOURNEY_BANK_PLANS[lesson.slug]!;
      const bank = buildJourneySpeakingBanks(lesson, foundations)!;
      expect(bank.reviewIssues).toEqual([]);
      const words = [bank.core, bank.support, bank.extension]
        .flatMap((bucket) => bucket.vocabulary)
        .filter((item) => item.lessonId === lesson.id);
      const grammar = [bank.core, bank.support, bank.extension]
        .flatMap((bucket) => bucket.grammar)
        .filter((item) => item.lessonId === lesson.id);
      expect(words.map((word) => word.id).sort()).toEqual(
        lesson.vocabulary.map((word) => word.id).sort(),
      );
      expect(grammar.map((pattern) => pattern.id).sort()).toEqual(
        lesson.grammar.map((pattern) => pattern.id).sort(),
      );
      for (const word of words) {
        const source = lesson.vocabulary.find((item) => item.id === word.id)!;
        expect([word.text, word.pinyin, word.meaning]).toEqual([
          source.chineseForm,
          source.pinyin,
          source.meaning,
        ]);
        expect(word.evidence).toBe("not-observed");
      }
      for (const pattern of grammar) {
        const source = lesson.grammar.find((item) => item.id === pattern.id)!;
        expect([pattern.text, pattern.meaning]).toEqual([
          source.structure,
          source.name,
        ]);
        expect(pattern.evidence).toBe("not-observed");
      }
      expect(plan.coreWords.length).toBeGreaterThanOrEqual(5);
      expect(plan.coreWords.length).toBeLessThanOrEqual(6);
      expect(plan.coreGrammar.length).toBeGreaterThan(0);
      expect(
        plan.coreWords.every((text) => !plan.optionalWords?.includes(text)),
      ).toBe(true);
      expect(
        plan.coreGrammar.every((text) => !plan.optionalGrammar?.includes(text)),
      ).toBe(true);
      expect(
        (plan.optionalWords ?? []).every((text) =>
          lesson.vocabulary.some((item) => item.chineseForm === text),
        ),
      ).toBe(true);
      expect(
        (plan.optionalGrammar ?? []).every((text) =>
          lesson.grammar.some((item) => item.structure === text),
        ),
      ).toBe(true);
      expect(plan.openingLine).toMatch(/[\u4e00-\u9fff]/);
      expect(plan.openingLine).not.toMatch(/我们开始|开始练习/);
      expect(plan.openingLine.length).toBeLessThanOrEqual(26);
      expect(journeyBankCandidateSlugs(lesson.slug).length).toBeLessThanOrEqual(
        8,
      );
      expect(
        plan.relatedLessons.every(
          (slug) => slug !== lesson.slug && Boolean(JOURNEY_BANK_PLANS[slug]),
        ),
      ).toBe(true);
      expect(
        bank.support.vocabulary.every((item) => item.lessonId === lesson.id),
      ).toBe(true);
      expect(
        bank.support.grammar.every((item) => item.lessonId === lesson.id),
      ).toBe(true);
      expect(bank.phraseBank).toEqual([]);
    },
  );
  it.each(foundations)(
    "bounds exposed support without losing current content in $slug",
    (lesson) => {
      const bank = buildJourneySpeakingBanks(
        lesson,
        foundations.map((row) => ({
          ...row,
          studiedSteps: ["VOCABULARY", "GRAMMAR", "DIALOGUE"],
        })),
      )!;
      expect(bank.support.vocabulary.length).toBeLessThanOrEqual(16);
      expect(bank.support.grammar.length).toBeLessThanOrEqual(6);
      expect(bank.extension.vocabulary.length).toBeLessThanOrEqual(4);
      for (const item of [
        ...bank.support.vocabulary,
        ...bank.support.grammar,
      ].filter((item) => item.lessonId !== lesson.id)) {
        expect(item.evidence).toBe("step-completed-exposure");
        expect(JOURNEY_BANK_PLANS[lesson.slug]!.relatedLessons).toContain(
          item.lessonSlug,
        );
      }
      for (const entries of [
        [bank.core, bank.support, bank.extension].flatMap(
          (bucket) => bucket.vocabulary,
        ),
        [bank.core, bank.support, bank.extension].flatMap(
          (bucket) => bucket.grammar,
        ),
      ])
        expect(new Set(entries.map((item) => item.id)).size).toBe(
          entries.length,
        );
    },
  );
  it("keeps the two intermediate-difficulty lessons in their existing chapter, without modifying metadata", () => {
    const mixed = foundations.filter(
      (lesson) => lesson.difficulty === "INTERMEDIATE",
    );
    expect(mixed.map((lesson) => lesson.slug).sort()).toEqual([
      "getting-around-asking-for-directions",
      "getting-around-booking-travel",
    ]);
    for (const lesson of mixed)
      expect(JOURNEY_BANK_PLANS[lesson.slug]?.rationale).toContain(
        "existing intermediate difficulty",
      );
  });
  it("opens from the correct speaker's role, with safer language-only pharmacy and bank scenes", () => {
    expect(
      JOURNEY_BANK_PLANS["body-basics-giving-simple-advice"]?.openingLine,
    ).toBe("我这几天没睡好，有点累。");
    expect(
      JOURNEY_BANK_PLANS["places-hours-giving-directions-with-landmarks"]
        ?.openingLine,
    ).toBe("请问，从这儿到火车站怎么走？");
    expect(
      JOURNEY_BANK_PLANS["getting-around-taking-a-taxi"]?.openingLine,
    ).toBe("您好，您要去哪儿？");
    expect(
      JOURNEY_BANK_PLANS["body-basics-basic-pharmacy-visit"]?.rationale,
    ).toContain("Do not invent medication, dosage");
    expect(
      JOURNEY_BANK_PLANS["money-banking-using-an-atm"]?.rationale,
    ).toContain("Never ask the learner to say a real PIN");
  });
});
