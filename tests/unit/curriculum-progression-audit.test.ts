import { describe, expect, it } from "vitest";
import {
  buildCurriculumProgressionAudit,
  renderCurriculumProgressionAudit,
  type AuditLesson,
} from "@/lib/content/curriculum-progression-audit";
import { hskNumberForPoints, tierNameForLevel } from "@/lib/points-system";

function lesson(
  slug: string,
  overrides: Partial<AuditLesson> = {},
): AuditLesson {
  return {
    id: slug,
    slug,
    title: slug,
    titleEs: slug,
    objective: "Introduce yourself",
    objectiveEs: "Presentarte",
    order: 0,
    levelOrder: 0,
    difficulty: "BEGINNER",
    hskReference: 1,
    scenario: {
      id: slug,
      slug,
      name: slug,
      nameEs: slug,
      status: "PUBLISHED",
      order: 0,
      difficulties: ["BEGINNER"],
      domainOrder: 0,
    },
    vocabulary: [
      {
        id: `${slug}-word`,
        chineseForm: "你好",
        pinyin: "nǐ hǎo",
        meaning: "hello",
        meaningEs: "hola",
        hskLevel: 1,
        status: "PUBLISHED",
        exampleCount: 1,
      },
    ],
    grammar: [
      {
        id: `${slug}-grammar`,
        name: "Statement",
        nameEs: "Enunciado",
        structure: "S + V",
        hskLevel: 1,
        status: "PUBLISHED",
        exampleCount: 1,
        exerciseCount: 2,
      },
    ],
    missions: [
      { id: `${slug}-mission`, aiRole: "classmate", learnerRole: "yourself" },
    ],
    hasSpeakingStep: true,
    dialogueLineCount: 2,
    ...overrides,
  };
}

describe("offline curriculum progression audit", () => {
  it("uses the existing ten tiers, including exact thresholds", () => {
    const audit = buildCurriculumProgressionAudit([lesson("a")]);
    expect(audit.tiers.map((t) => t.minPoints)).toEqual([
      0, 100, 350, 700, 900, 1150, 1500, 1650, 1800, 2000,
    ]);
    for (const tier of audit.tiers) {
      expect(tier.label).toBe(tierNameForLevel(tier.level));
      expect(hskNumberForPoints(tier.minPoints)).toBe(tier.level);
    }
    expect(audit.methodology.masteryStatus).toBe("NOT_INFERRED");
  });
  it("separates links, records, forms and structures instead of inflating mastery", () => {
    const audit = buildCurriculumProgressionAudit([lesson("a"), lesson("b")]);
    expect(audit.totals).toMatchObject({
      lessons: 2,
      vocabularyLinks: 2,
      vocabularyRecords: 2,
      lexicalForms: 1,
      grammarRecords: 2,
      exactStructures: 1,
    });
    expect(audit.repeatedForms[0]?.recordIds).toHaveLength(2);
    expect(audit.lessons[1]?.recurringWords[0]?.earlierLessonSlugs).toEqual([
      "a",
    ]);
    expect(audit.lessons[1]?.firstSeenWordIds).toEqual([]);
  });
  it("does not merge different meanings or silently remove record IDs", () => {
    const second = lesson("b");
    second.vocabulary[0]!.meaning = "a greeting";
    const audit = buildCurriculumProgressionAudit([lesson("a"), second]);
    expect(audit.repeatedForms[0]?.meanings).toEqual(["hello", "a greeting"]);
    expect(audit.lessons[1]?.vocabulary[0]?.meaning).toBe("a greeting");
  });
  it("uses deterministic route order and does not mutate input", () => {
    const input = [lesson("b"), lesson("a")];
    const before = JSON.stringify(input);
    const audit = buildCurriculumProgressionAudit(input);
    expect(audit.lessons.map((l) => l.slug)).toEqual(["a", "b"]);
    expect(JSON.stringify(input)).toBe(before);
    expect(buildCurriculumProgressionAudit([...input].reverse())).toEqual(
      audit,
    );
  });
  it("conserves nominal chapter budgets in homogeneous scenarios", () => {
    const intermediate = lesson("b", {
      difficulty: "INTERMEDIATE",
      hskReference: 3,
    });
    intermediate.scenario.difficulties = ["INTERMEDIATE"];
    const advanced = lesson("c", { difficulty: "ADVANCED", hskReference: 5 });
    advanced.scenario.difficulties = ["ADVANCED"];
    const audit = buildCurriculumProgressionAudit([
      lesson("a"),
      intermediate,
      advanced,
    ]);
    expect(audit.chapters.map((c) => c.projectedBudget)).toEqual([
      350, 550, 600,
    ]);
    expect(audit.lessons.map((l) => l.nominalEnd)).toEqual([350, 900, 1500]);
    expect(
      audit.tiers
        .slice(6)
        .every((t) => t.refinementOnly && !t.proposedLessonSlugs.length),
    ).toBe(true);
    expect(audit.tiers[9]?.priorInventory.lexicalForms).toBe(1);
  });
  it("reports rather than fixes the existing mixed-level weighting asymmetry", () => {
    const mixed = lesson("b", { difficulty: "INTERMEDIATE", hskReference: 3 });
    mixed.scenario.difficulties = ["BEGINNER", "INTERMEDIATE"];
    const audit = buildCurriculumProgressionAudit([lesson("a"), mixed]);
    expect(audit.chapters[0]?.mixedLevelLessonSlugs).toEqual(["b"]);
    expect(audit.chapters[0]?.projectedBudget).toBe(1400);
    expect(audit.lessons[1]?.chapter).toBe("BEGINNER");
  });
  it("keeps the nominal path continuous instead of resetting a chapter at its declared threshold", () => {
    const mixed = lesson("b", { difficulty: "INTERMEDIATE", hskReference: 3 });
    mixed.scenario.difficulties = ["BEGINNER", "INTERMEDIATE"];
    const next = lesson("c", { difficulty: "INTERMEDIATE", hskReference: 3 });
    next.scenario.difficulties = ["INTERMEDIATE"];
    const audit = buildCurriculumProgressionAudit([lesson("a"), mixed, next]);
    expect(audit.lessons[2]?.nominalStart).toBe(audit.lessons[1]?.nominalEnd);
    expect(audit.lessons[2]?.nominalStart).not.toBe(350);
    expect(audit.lessons.at(-1)?.nominalEnd).toBeCloseTo(
      audit.chapters.reduce((sum, c) => sum + c.projectedBudget, 0),
    );
  });
  it("counts a shared record once without losing lesson links", () => {
    const first = lesson("a");
    const second = lesson("b", {
      vocabulary: first.vocabulary,
      grammar: first.grammar,
    });
    const audit = buildCurriculumProgressionAudit([first, second]);
    expect(audit.totals).toMatchObject({
      vocabularyLinks: 2,
      vocabularyRecords: 1,
      grammarLinks: 2,
      grammarRecords: 1,
    });
    expect(audit.repeatedForms[0]?.lessonSlugs).toEqual(["a", "b"]);
  });
  it("excludes unpublished scenarios but preserves denominator evidence", () => {
    const hidden = lesson("hidden");
    hidden.scenario.status = "DRAFT";
    const audit = buildCurriculumProgressionAudit([lesson("a"), hidden]);
    expect(audit.totals.lessons).toBe(1);
    expect(audit.excludedPublishedLessonSlugs).toEqual(["hidden"]);
    expect(audit.chapters[0]?.projectedBudget).toBe(175);
    expect(audit.lessons[0]?.recurringWords).toEqual([]);
  });
  it("does not count draft targets as usable vocabulary or grammar", () => {
    const draft = lesson("a");
    draft.vocabulary[0]!.status = "DRAFT";
    draft.grammar[0]!.status = "DRAFT";
    const audit = buildCurriculumProgressionAudit([draft]);
    expect(audit.totals.vocabularyRecords).toBe(0);
    expect(audit.totals.grammarRecords).toBe(0);
    expect(audit.lessons[0]?.issues).toEqual(
      expect.arrayContaining([
        "NO_PUBLISHED_VOCABULARY",
        "NO_PUBLISHED_GRAMMAR",
        "UNPUBLISHED_LINKED_TARGET",
      ]),
    );
  });
  it("detects missing goals, translations, examples, tags and role-play", () => {
    const incomplete = lesson("a", {
      objective: "",
      titleEs: null,
      objectiveEs: null,
      missions: [],
      hasSpeakingStep: false,
      dialogueLineCount: 0,
      hskReference: null,
    });
    incomplete.vocabulary[0]!.pinyin = "";
    incomplete.vocabulary[0]!.meaningEs = null;
    incomplete.vocabulary[0]!.exampleCount = 0;
    incomplete.grammar[0]!.exerciseCount = 0;
    const audit = buildCurriculumProgressionAudit([incomplete]);
    expect(audit.lessons[0]?.issues).toEqual(
      expect.arrayContaining([
        "MISSING_OBJECTIVE",
        "MISSING_LESSON_ES",
        "MISSING_TARGET_ES",
        "NO_PUBLISHED_ROLEPLAY",
        "NO_SPEAKING_STEP",
        "NO_PUBLISHED_DIALOGUE_LINES",
        "INCOMPLETE_WORD",
        "TARGET_WITHOUT_EXAMPLE",
        "GRAMMAR_WITHOUT_EXERCISE",
        "MISSING_INTERNAL_DIFFICULTY_TAG",
      ]),
    );
  });
  it("flags internal difficulty mismatches as review, not official HSK failures", () => {
    const hard = lesson("a");
    hard.vocabulary[0]!.hskLevel = 5;
    const audit = buildCurriculumProgressionAudit([hard]);
    expect(audit.issueCounts.TARGET_ABOVE_LESSON_INTERNAL_TAG_REVIEW).toBe(1);
    expect(audit.methodology.equivalence).toContain("NOT audited official HSK");
  });
  it("rejects duplicate lesson IDs and handles an empty inventory", () => {
    expect(() =>
      buildCurriculumProgressionAudit([lesson("a"), lesson("a")]),
    ).toThrow("Duplicate");
    const empty = buildCurriculumProgressionAudit([]);
    expect(empty.totals.lessons).toBe(0);
    expect(empty.tiers).toHaveLength(10);
    expect(empty.chapters.every((c) => c.projectedBudget === 0)).toBe(true);
  });
  it("renders all lessons, pinyin, localization, cautions and escaped tables", () => {
    const row = lesson("a");
    row.grammar[0]!.structure = "S | V";
    row.dialoguePhrases = ["你好。", "我叫王明。"];
    const report = renderCurriculumProgressionAudit(
      buildCurriculumProgressionAudit([row]),
    );
    expect(report).toContain("nǐ hǎo");
    expect(report).toContain("hola");
    expect(report).toContain("S \\| V");
    expect(report).toContain("`a` (a)");
    expect(report).toContain("NO aplicada");
    expect(report).toContain("no repertorio demostrado");
    expect(report).toContain("我叫王明。");
  });
});
