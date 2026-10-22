import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  buildJourneySpeakingBanks,
  JOURNEY_BANK_PLANS,
  type JourneyBankLesson,
} from "@/lib/content/journey-speaking-banks";
import { JOURNEY_RUBRIC_VERSION } from "@/lib/journey-speaking-attempt-contract";
import {
  validateJourneyJudgment,
  type JourneyEvaluationContext,
  type JourneyJudgment,
} from "@/lib/journey-speaking-evaluation";

// Characterization, NOT desired pedagogical acceptance. These tests deliberately
// expose semantic gaps in v2 without changing production grading or calling AI.
const inventory = JSON.parse(
  readFileSync("project/curriculum-audit-2026-10-10/final/matriz.json", "utf8"),
) as { lessons: Array<JourneyBankLesson & { difficulty: string }> };
const pilot = JSON.parse(
  readFileSync("project/speaking-quality/phase-1/pilot-matrix.json", "utf8"),
) as {
  runtimeEnabled: boolean;
  status: string;
  lessons: Array<{
    slug: string;
    difficulty: string;
    coreWords: string[];
    coreGrammar: string[];
    supportGrammar: string[];
    objectives: Array<{ id: string; description: string; evidence: string }>;
  }>;
};
const lesson = inventory.lessons.find(
  (row) => row.slug === "foundations-greetings-and-introductions",
)!;
const banks = buildJourneySpeakingBanks({ ...lesson, studiedSteps: [] }, [])!;

function input(firstResponse = "我叫小林。"): JourneyEvaluationContext {
  return {
    locale: "es",
    closeReason: "USER_END",
    snapshot: {
      lessonId: lesson.id,
      lessonSlug: lesson.slug,
      lessonTitle: "Saludos y presentaciones",
      difficulty: "BEGINNER",
      hskReference: 1,
      aiRole: "Compañero de clase",
      learnerRole: "Tú",
      objective: "Saludar, presentarse, preguntar el nombre y compartir origen",
      successConditions: [
        { id: "greet", text: "Saludar" },
        { id: "name", text: "Presentarse" },
        { id: "ask-name", text: "Preguntar el nombre" },
        { id: "origin", text: "Compartir origen" },
      ],
      banks,
    },
    turns: [
      { id: "a1", sequence: 0, role: "assistant", content: "你叫什么名字？" },
      { id: "u1", sequence: 1, role: "user", content: firstResponse },
      { id: "a2", sequence: 2, role: "assistant", content: "你是哪国人？" },
      { id: "u2", sequence: 3, role: "user", content: "我是秘鲁人。" },
    ],
  };
}

function candidate(context = input(), level = 4): JourneyJudgment {
  const user = { turnId: "u1", quote: context.turns[1]!.content };
  const dimension = {
    observation: "OBSERVED" as const,
    level,
    reason: "Desempeño adecuado.",
    citations: [user],
  };
  return {
    rubricVersion: JOURNEY_RUBRIC_VERSION,
    bankVersion: banks.version,
    locale: "es",
    dimensions: {
      communication: structuredClone(dimension),
      language: structuredClone(dimension),
      interaction: {
        ...structuredClone(dimension),
        citations: [user, { turnId: "a1", quote: "你叫什么名字" }],
      },
      autonomy: structuredClone(dimension),
    },
    evidence: [],
    limitations: [],
    feedback: {
      summary: "Pudiste participar en la conversación.",
      achievement: { text: "Diste una respuesta.", citations: [user] },
      priority: null,
      nextStep: "Sigue practicando.",
    },
  };
}

function checked(judgment = candidate(), context = input()) {
  const result = validateJourneyJudgment(judgment, context);
  if (!result.ok) throw new Error(result.errors.join("; "));
  return result.report;
}

describe("Phase 1: curriculum-grounded pilot, not a live rubric", () => {
  it("keeps the matrix offline and explicitly uncalibrated", () => {
    expect(pilot.runtimeEnabled).toBe(false);
    expect(pilot.status).toBe("editorial-draft-not-human-calibrated");
    expect(pilot.lessons).toHaveLength(3);
    expect(new Set(pilot.lessons.map((row) => row.slug)).size).toBe(3);
  });

  it.each(pilot.lessons)(
    "matches actual vocabulary, grammar and plan: $slug",
    (row) => {
      const source = inventory.lessons.find((item) => item.slug === row.slug)!;
      expect(source).toBeDefined();
      expect(source.difficulty).toBe(row.difficulty);
      const plan = JOURNEY_BANK_PLANS[row.slug]!;
      expect(row.coreWords).toEqual([...plan.coreWords]);
      expect(row.coreGrammar).toEqual([...plan.coreGrammar]);
      for (const word of row.coreWords)
        expect(
          source.vocabulary.some((item) => item.chineseForm === word),
        ).toBe(true);
      for (const structure of [...row.coreGrammar, ...row.supportGrammar])
        expect(
          source.grammar.some((item) => item.structure === structure),
        ).toBe(true);
      expect(new Set(row.objectives.map((item) => item.id)).size).toBe(
        row.objectives.length,
      );
      expect(
        row.objectives.every((item) => item.description && item.evidence),
      ).toBe(true);
    },
  );

  it("has reviewed bank selections for all 164 offline inventory lessons", () => {
    expect(inventory.lessons).toHaveLength(164);
    for (const row of inventory.lessons) {
      const bank = buildJourneySpeakingBanks({ ...row, studiedSteps: [] }, []);
      expect(bank, row.slug).not.toBeNull();
      expect(bank!.reviewIssues, row.slug).toEqual([]);
    }
  });
});

describe("Phase 1: measured v2 gaps, not model-performance results", () => {
  it("G01 accepts 100 without an objective or vocabulary/grammar evidence inventory", () => {
    const report = checked();
    expect(report.score).toBe(100);
    expect(report.evidence).toEqual([]);
    expect(report.pronunciation.status).toBe("NOT_EVALUATED");
  });

  it("G02 accepts maximum language alongside its own cited grammar error", () => {
    const context = input("我叫是小林。");
    const judgment = candidate(context);
    const citations = [{ turnId: "u1", quote: "我叫是小林" }];
    judgment.evidence = [
      {
        kind: "grammar",
        itemId: banks.core.grammar[0]!.id,
        state: "ERROR",
        reason: "La formulación de nombre inserta 是 después de 叫.",
        citations,
      },
    ];
    judgment.feedback.priority = {
      kind: "grammar",
      text: "Para esta presentación utiliza 我叫小林。",
      citations,
      example: {
        chinese: "我叫小林。",
        pinyin: "Wǒ jiào Xiǎolín.",
        translation: "Me llamo Xiaolin.",
      },
    };
    const report = checked(judgment, context);
    expect(report.score).toBe(100);
    expect(report.evidence[0]!.state).toBe("ERROR");
  });

  it("G03 does not semantically check an autonomy reason contradicting its maximum", () => {
    const judgment = candidate();
    judgment.dimensions.autonomy.reason =
      "Solo logró repetir tras ayuda constante; no hubo transferencia independiente.";
    expect(checked(judgment).score).toBe(100);
  });

  it("G04 accepts a phonetic perfection claim inside free feedback despite no audio evaluation", () => {
    const judgment = candidate();
    judgment.feedback.summary =
      "Tu pronunciación y todos tus tonos fueron perfectos.";
    const report = checked(judgment);
    expect(report.feedback.summary).toContain("tonos fueron perfectos");
    expect(report.pronunciation.status).toBe("NOT_EVALUATED");
  });

  it("G05 locale metadata alone does not enforce the language of prose", () => {
    const judgment = candidate();
    judgment.feedback.summary =
      "Excellent work. You completed the conversation successfully.";
    expect(checked(judgment).locale).toBe("es");
    expect(checked(judgment).feedback.summary).toContain("Excellent work");
  });

  it("G06 accepts both extremes for identical citations; validation is not calibration", () => {
    expect(checked(candidate(input(), 4)).score).toBe(100);
    expect(checked(candidate(input(), 0)).score).toBe(0);
  });
});

describe("Phase 1: keep existing integrity controls", () => {
  it("rejects invented learner quotations", () => {
    const judgment = candidate();
    judgment.dimensions.language.citations[0]!.quote = "从未说过的句子";
    expect(validateJourneyJudgment(judgment, input()).ok).toBe(false);
  });

  it("rejects correction priorities without corresponding error evidence", () => {
    const judgment = candidate();
    judgment.feedback.priority = {
      kind: "grammar",
      text: "Corrige esta estructura.",
      citations: [{ turnId: "u1", quote: "我叫小林" }],
      example: null,
    };
    expect(validateJourneyJudgment(judgment, input()).ok).toBe(false);
  });

  it("rejects assisted production without the assistant model", () => {
    const judgment = candidate();
    judgment.evidence = [
      {
        kind: "vocabulary",
        itemId: banks.core.vocabulary.find((word) => word.text === "叫")!.id,
        state: "ASSISTED",
        reason: "Se utilizó con ayuda.",
        citations: [{ turnId: "u1", quote: "我叫小林" }],
      },
    ];
    expect(validateJourneyJudgment(judgment, input()).ok).toBe(false);
  });

  it("keeps missing criterion evidence partial rather than fabricating zero or 100", () => {
    const judgment = candidate();
    judgment.dimensions.language = {
      observation: "NOT_OBSERVED",
      level: null,
      reason: "Falta evidencia.",
      citations: [],
    };
    const report = checked(judgment);
    expect(report.status).toBe("PARTIAL");
    expect(report.score).toBeNull();
  });

  it("keeps capture failure out of complete grades", () => {
    const context = { ...input(), closeReason: "TECHNICAL_FAILURE" as const };
    expect(checked(candidate(context), context).score).toBeNull();
  });

  it("does not invent replacement levels from uncertain recognition", () => {
    const context = input();
    context.turns[1]!.recognition = {
      rawTranscript: context.turns[1]!.content,
      interpretedTranscript: context.turns[1]!.content,
      confidence: 0.2,
    };
    const report = checked(candidate(context), context);
    expect(report.score).toBeNull();
    expect(report.dimensions.language.level).toBeNull();
  });
});
