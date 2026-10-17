import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  buildJourneySpeakingBanks,
  JOURNEY_BANK_PLANS,
  JOURNEY_PILOT_BANK_PLANS,
  journeyBankCandidateSlugs,
  renderJourneySpeakingBanks,
  type JourneyBankLesson,
} from "@/lib/content/journey-speaking-banks";
import { JOURNEY_FOUNDATIONS_ADDITIONAL_PLANS } from "@/lib/content/journey-speaking-foundations";
import { JOURNEY_EVERYDAY_BANK_PLANS } from "@/lib/content/journey-speaking-everyday";
import { JOURNEY_ADVANCED_BANK_PLANS } from "@/lib/content/journey-speaking-advanced";

const snapshot = JSON.parse(
  readFileSync("project/curriculum-audit-2026-10-10/final/matriz.json", "utf8"),
) as {
  lessons: Array<
    JourneyBankLesson & {
      chapter: string;
      difficulty: string;
      hskReference: number;
      scenario: { slug: string };
      missions: Array<{ aiRole: string; learnerRole: string }>;
    }
  >;
};
const all = snapshot.lessons.map((row) => ({
  ...row,
  studiedSteps: [] as string[],
}));
const advanced = all.filter((row) => row.chapter === "ADVANCED");
function lesson(slug: string, steps: string[] = []) {
  const row = all.find((candidate) => candidate.slug === slug);
  if (!row) throw new Error(`Missing audited lesson ${slug}`);
  return { ...row, studiedSteps: steps };
}
describe("Advanced Journey banks against the audited curriculum", () => {
  it("completes 44 advanced lessons in 11 scenarios and the exact full 164-lesson inventory", () => {
    expect(Object.keys(JOURNEY_ADVANCED_BANK_PLANS).sort()).toEqual(
      advanced.map((row) => row.slug).sort(),
    );
    expect(advanced).toHaveLength(44);
    expect(new Set(advanced.map((row) => row.scenario.slug)).size).toBe(11);
    expect(Object.keys(JOURNEY_BANK_PLANS).sort()).toEqual(
      all.map((row) => row.slug).sort(),
    );
    expect(advanced.reduce((n, row) => n + row.vocabulary.length, 0)).toBe(440);
    expect(advanced.reduce((n, row) => n + row.grammar.length, 0)).toBe(132);
    expect(all.reduce((n, row) => n + row.vocabulary.length, 0)).toBe(1592);
    expect(all.reduce((n, row) => n + row.grammar.length, 0)).toBe(480);
    expect(advanced.every((row) => row.difficulty === "ADVANCED")).toBe(true);
    expect(new Set(advanced.map((row) => row.hskReference))).toEqual(
      new Set([4, 5, 6, 7, 8, 9]),
    );
  });
  it("preserves all 120 previous plan objects without overwriting a slug", () => {
    const previous = {
      ...JOURNEY_PILOT_BANK_PLANS,
      ...JOURNEY_FOUNDATIONS_ADDITIONAL_PLANS,
      ...JOURNEY_EVERYDAY_BANK_PLANS,
    };
    expect(Object.keys(previous)).toHaveLength(120);
    for (const [slug, plan] of Object.entries(previous)) {
      expect(JOURNEY_BANK_PLANS[slug]).toBe(plan);
      expect(Object.hasOwn(JOURNEY_ADVANCED_BANK_PLANS, slug)).toBe(false);
    }
  });
  it.each(advanced)(
    "preserves exact content and validates editorial choices in $slug",
    (row) => {
      const plan = JOURNEY_ADVANCED_BANK_PLANS[row.slug]!;
      const bank = buildJourneySpeakingBanks(row, all)!;
      expect(bank.reviewIssues).toEqual([]);
      for (const [entries, sources] of [
        [
          [bank.core, bank.support, bank.extension].flatMap(
            (b) => b.vocabulary,
          ),
          row.vocabulary,
        ],
        [
          [bank.core, bank.support, bank.extension].flatMap((b) => b.grammar),
          row.grammar,
        ],
      ] as const) {
        expect(entries.map((item) => item.id).sort()).toEqual(
          sources.map((item) => item.id).sort(),
        );
        expect(new Set(entries.map((item) => item.id)).size).toBe(
          entries.length,
        );
        expect(entries.every((item) => item.evidence === "not-observed")).toBe(
          true,
        );
      }
      for (const item of [bank.core, bank.support, bank.extension].flatMap(
        (b) => b.vocabulary,
      )) {
        const source = row.vocabulary.find((word) => word.id === item.id)!;
        expect([item.text, item.pinyin, item.meaning]).toEqual([
          source.chineseForm,
          source.pinyin,
          source.meaning,
        ]);
      }
      for (const item of [bank.core, bank.support, bank.extension].flatMap(
        (b) => b.grammar,
      )) {
        const source = row.grammar.find((pattern) => pattern.id === item.id)!;
        expect([item.text, item.meaning]).toEqual([
          source.structure,
          source.name,
        ]);
      }
      expect(plan.coreWords).toHaveLength(6);
      expect(plan.coreGrammar).toHaveLength(2);
      for (const [core, optional, source] of [
        [
          plan.coreWords,
          plan.optionalWords ?? [],
          row.vocabulary.map((w) => w.chineseForm),
        ],
        [
          plan.coreGrammar,
          plan.optionalGrammar ?? [],
          row.grammar.map((g) => g.structure),
        ],
      ] as const) {
        expect(new Set(core).size).toBe(core.length);
        expect(new Set(optional).size).toBe(optional.length);
        expect(core.every((text) => !optional.includes(text))).toBe(true);
        expect(optional.every((text) => source.includes(text))).toBe(true);
      }
      expect(plan.openingLine).toMatch(/[\u4e00-\u9fff]/);
      expect(plan.openingLine).not.toMatch(/我们开始|开始练习/);
      expect(plan.openingLine.length).toBeLessThanOrEqual(32);
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
  it.each(advanced)(
    "bounds support by actual related-step exposure in $slug",
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
      const words = [bank.core, bank.support, bank.extension].flatMap(
        (b) => b.vocabulary,
      );
      const grammar = [bank.core, bank.support, bank.extension].flatMap(
        (b) => b.grammar,
      );
      expect(new Set(words.map((item) => item.id)).size).toBe(words.length);
      expect(new Set(grammar.map((item) => item.id)).size).toBe(grammar.length);
      for (const item of [
        ...bank.support.vocabulary,
        ...bank.support.grammar,
      ].filter((entry) => entry.lessonId !== row.id)) {
        expect(JOURNEY_ADVANCED_BANK_PLANS[row.slug]!.relatedLessons).toContain(
          item.lessonSlug,
        );
        expect(item.evidence).toBe("step-completed-exposure");
      }
      expect(bank.phraseBank).toEqual([]); // Another lesson's dialogue isn't current exposure.
    },
  );
  it("keeps vocabulary, grammar and dialogue exposure independent", () => {
    const current = lesson(
      "negotiating-job-contract-pushing-back-on-an-unfavorable-clause",
    );
    const related = lesson(
      "negotiating-job-contract-reviewing-contract-terms",
      ["GRAMMAR"],
    );
    const bank = buildJourneySpeakingBanks(current, [related])!;
    expect(
      bank.support.vocabulary.every((item) => item.lessonId === current.id),
    ).toBe(true);
    expect(
      bank.support.grammar.some((item) => item.lessonId === related.id),
    ).toBe(true);
    expect(bank.phraseBank).toEqual([]);
    const noExposure = buildJourneySpeakingBanks(current, [
      {
        ...related,
        studiedSteps: ["SITUATION", "SPEAKING", "REFLECTION"],
      },
    ])!;
    expect(
      noExposure.support.grammar.every((item) => item.lessonId === current.id),
    ).toBe(true);
    const ownDialogue = buildJourneySpeakingBanks(
      { ...current, studiedSteps: ["DIALOGUE"] },
      [],
    )!;
    expect(ownDialogue.phraseBank).toEqual(
      current.dialoguePhrases.slice(0, 12),
    );
    expect(
      ownDialogue.core.vocabulary.every(
        (item) => item.evidence === "not-observed",
      ),
    ).toBe(true);
  });
  it("carries clinical, legal and financial boundaries into rendered session context", () => {
    for (const row of advanced.filter(
      (r) => r.scenario.slug === "specialist-medical-consultation",
    )) {
      const rendered = renderJourneySpeakingBanks(
        buildJourneySpeakingBanks(row, all)!,
      );
      expect(rendered).toContain("not clinical advice");
      expect(rendered).toContain("Do not diagnose the learner");
      expect(rendered).toContain(
        "if a real emergency is stated, stop role-play",
      );
      expect(JOURNEY_ADVANCED_BANK_PLANS[row.slug]!.openingLine).toContain(
        "虚构",
      );
    }
    for (const row of advanced.filter((r) =>
      ["legal-notarial-procedures", "negotiating-job-contract"].includes(
        r.scenario.slug,
      ),
    )) {
      const rendered = renderJourneySpeakingBanks(
        buildJourneySpeakingBanks(row, all)!,
      );
      expect(rendered).toContain("not legal advice");
      expect(rendered).toContain("qualified");
    }
    for (const row of advanced.filter(
      (r) => r.scenario.slug === "tech-finance-expert-panel",
    )) {
      const rendered = renderJourneySpeakingBanks(
        buildJourneySpeakingBanks(row, all)!,
      );
      expect(rendered).toContain("not financial advice");
      expect(rendered).toContain("No investment recommendations");
    }
  });
  it("keeps role identity, consent, source uncertainty and scene endings explicit", () => {
    for (const row of advanced.filter(
      (r) => r.scenario.slug === "resolving-workplace-conflict",
    ))
      expect(row.missions[0]!.aiRole).toBe("Team Member");
    expect(
      JOURNEY_ADVANCED_BANK_PLANS[
        "resolving-workplace-conflict-opening-the-mediation"
      ]!.rationale,
    ).toContain("team member, not the mediator");
    expect(
      JOURNEY_ADVANCED_BANK_PLANS[
        "formal-speech-toast-event-honoring-a-guest-or-achievement"
      ]!.rationale,
    ).toContain("honored employee");
    expect(
      JOURNEY_ADVANCED_BANK_PLANS[
        "formal-speech-toast-event-proposing-an-eloquent-toast"
      ]!.rationale,
    ).toContain("never pressure drinking alcohol");
    expect(
      JOURNEY_ADVANCED_BANK_PLANS[
        "academic-seminar-discussion-citing-sources-to-support-claims"
      ]!.rationale,
    ).toContain("never invent a verified");
    for (const slug of [
      "media-interview-expert-closing-on-your-key-message",
      "formal-speech-toast-event-closing-a-speech-memorably",
      "diplomatic-sensitive-negotiation-closing-while-preserving-the-relationship",
    ])
      expect(JOURNEY_ADVANCED_BANK_PLANS[slug]!.rationale).toContain(
        "technical End",
      );
    expect(
      JOURNEY_ADVANCED_BANK_PLANS[
        "diplomatic-sensitive-negotiation-closing-while-preserving-the-relationship"
      ]!.rationale,
    ).toContain("only after explicit agreement");
    expect(
      JOURNEY_ADVANCED_BANK_PLANS[
        "tech-finance-expert-panel-synthesizing-the-panel-discussion"
      ]!.rationale,
    ).toContain("don't invent a full panel");
  });
});
