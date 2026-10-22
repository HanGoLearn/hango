import { describe, expect, it } from "vitest";
import { buildJourneyQualityContext } from "@/lib/journey-speaking-quality-context";
import { JOURNEY_BANK_VERSION } from "@/lib/content/journey-speaking-bank-contract";
import {
  inspectJourneyQualityCandidate,
  JOURNEY_QUALITY_CANDIDATE_VERSION,
} from "@/lib/journey-speaking-quality-candidate";

function input(): Parameters<typeof buildJourneyQualityContext>[0] {
  const word = {
    id: "word",
    lessonId: "lesson",
    lessonSlug: "greetings",
    text: "叫",
    meaning: "llamarse",
    evidence: "step-completed-exposure" as const,
  };
  return {
    attemptId: "attempt",
    locale: "es",
    snapshot: {
      lessonId: "lesson",
      lessonSlug: "greetings",
      lessonTitle: "Saludos",
      difficulty: "BEGINNER",
      hskReference: 1,
      aiRole: "Compañero",
      learnerRole: "Tú",
      objective: "Presentarse",
      successConditions: [{ id: "name", text: "Presentarse por nombre" }],
      banks: {
        version: JOURNEY_BANK_VERSION,
        lessonId: "lesson",
        lessonSlug: "greetings",
        openingLine: "你好",
        rationale: "Saludos",
        core: {
          vocabulary: [{ ...word }],
          grammar: [{ ...word, id: "structure", text: "我叫 + nombre" }],
        },
        support: { vocabulary: [word], grammar: [] },
        extension: {
          vocabulary: [{ ...word, id: "extension", text: "你好" }],
          grammar: [],
        },
        phraseBank: [],
        reviewIssues: [],
      },
    },
    capture: {
      attemptId: "attempt",
      lessonId: "lesson",
      closeReason: "USER_END",
      quality: { pendingLearnerTurn: false, interruptedAssistant: false },
      turns: [
        { id: "u1", sequence: 1, role: "user", content: "我叫小林。" },
        { id: "a1", sequence: 0, role: "assistant", content: "你叫什么名字？" },
      ],
    },
  };
}
describe("frozen-attempt quality context adapter", () => {
  it("feeds the candidate inspector without converting the result into a production grade", () => {
    const ctx = buildJourneyQualityContext({
      ...input(),
      requiredActIds: ["name"],
    });
    const user = { turnId: "u1", quote: "我叫小林" };
    const dimension = {
      observation: "OBSERVED",
      level: 3,
      support: "NONE",
      reason: "Evidencia de prueba, no juicio docente.",
      citations: [user],
    };
    const result = inspectJourneyQualityCandidate(
      {
        version: JOURNEY_QUALITY_CANDIDATE_VERSION,
        attemptId: ctx.attemptId,
        locale: ctx.locale,
        dimensions: {
          communication: dimension,
          vocabulary: dimension,
          grammar: dimension,
          interaction: {
            ...dimension,
            citations: [{ turnId: "a1", quote: "你叫什么名字" }, user],
          },
          pronunciation: { status: "NOT_EVALUATED" },
          fluency: { status: "NOT_EVALUATED" },
        },
        findings: ctx.targets
          .filter((x) => x.id !== "vocabulary:extension")
          .map((target, index) => ({
            id: `f${index}`,
            targetId: target.id,
            state: "INDEPENDENT",
            opportunity: "OFFERED",
            citations: [user],
            reason: "Aplicación ficticia.",
            resolutionId: null,
            correction: null,
          })),
      },
      ctx,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(JSON.stringify(result.issues));
    expect(result.profile.coverage.independentlyDemonstrated).toEqual([
      "act:name",
    ]);
    expect(result.profile.score).toBeNull();
    expect(result.profile.eligibleForRewards).toBe(false);
  });
  it("separates resource identities, deduplicates buckets, and imposes no automatic word quota", () => {
    const result = buildJourneyQualityContext(input());
    expect(result.targets.map((x) => x.id)).toEqual([
      "act:name",
      "vocabulary:word",
      "grammar:structure",
      "vocabulary:extension",
    ]);
    expect(result.targets.every((x) => !x.required)).toBe(true);
    expect(result.turns.map((x) => x.id)).toEqual(["a1", "u1"]);
    expect(result.technicallyComplete).toBe(true);
    expect(result).not.toHaveProperty("score");
  });
  it("requires explicit editorial selection limited to existing acts", () => {
    const value = input();
    value.requiredActIds = ["name"];
    expect(
      buildJourneyQualityContext(value)
        .targets.filter((x) => x.required)
        .map((x) => x.id),
    ).toEqual(["act:name"]);
    value.requiredActIds = ["invented"];
    expect(() => buildJourneyQualityContext(value)).toThrow(/outside/);
  });
  it.each(["attempt", "lesson", "bank"])("rejects a different %s", (key) => {
    const value = input();
    if (key === "attempt") value.capture.attemptId = "other";
    if (key === "lesson") value.capture.lessonId = "other";
    if (key === "bank") value.snapshot.banks.lessonSlug = "other";
    expect(() => buildJourneyQualityContext(value)).toThrow(/same frozen/);
  });
  it("rejects conflicting homograph identities but retains different record IDs", () => {
    const value = input();
    value.snapshot.banks.support.vocabulary[0]!.meaning = "otro significado";
    expect(() => buildJourneyQualityContext(value)).toThrow(/Conflicting/);
    value.snapshot.banks.support.vocabulary[0]!.id = "homograph";
    expect(
      buildJourneyQualityContext(value).targets.filter((x) => x.text === "叫"),
    ).toHaveLength(2);
  });
  it("excludes character-only targets without implying exposure means mastery", () => {
    const value = input();
    value.snapshot.banks.extension.vocabulary[0]!.characterOnly = true;
    expect(
      buildJourneyQualityContext(value).targets.some(
        (x) => x.id === "vocabulary:extension",
      ),
    ).toBe(false);
    expect(buildJourneyQualityContext(value).targets[1]).not.toHaveProperty(
      "mastered",
    );
  });
  it.each(["missing", "pending", "technical", "abandoned"])(
    "keeps %s capture incomplete",
    (key) => {
      const value = input();
      if (key === "missing") delete value.capture.quality;
      if (key === "pending") value.capture.quality!.pendingLearnerTurn = true;
      if (key === "technical") value.capture.closeReason = "TECHNICAL_FAILURE";
      if (key === "abandoned") value.capture.closeReason = "ABANDONED";
      expect(buildJourneyQualityContext(value).technicallyComplete).toBe(false);
    },
  );
  it("does not penalize interrupting the character without missing learner speech", () => {
    const value = input();
    value.capture.quality!.interruptedAssistant = true;
    expect(buildJourneyQualityContext(value).technicallyComplete).toBe(true);
  });
  it.each(["id", "sequence", "negative", "fraction"])(
    "rejects invalid turn %s",
    (key) => {
      const value = input();
      if (key === "id") value.capture.turns[1]!.id = "u1";
      if (key === "sequence") value.capture.turns[1]!.sequence = 1;
      if (key === "negative") value.capture.turns[1]!.sequence = -1;
      if (key === "fraction") value.capture.turns[1]!.sequence = 0.5;
      expect(() => buildJourneyQualityContext(value)).toThrow(
        /identity\/sequence/,
      );
    },
  );
  it("preserves uncertain original speech instead of replacing it with an interpretation", () => {
    const value = input();
    value.capture.turns[0]!.recognition = {
      rawTranscript: "我叫小林。",
      interpretedTranscript: "我叫小明。",
      confidence: 0.3,
    };
    const result = buildJourneyQualityContext(value);
    expect(result.turns[1]!.content).toBe("我叫小林。");
    expect(result.turns[1]!.recognition?.confidence).toBe(0.3);
    value.capture.turns[0]!.content = "我叫小明。";
    expect(() => buildJourneyQualityContext(value)).toThrow();
  });
  it("rejects silent normalization of original content", () => {
    const value = input();
    value.capture.turns[0]!.content = " 我叫小林。 ";
    expect(() => buildJourneyQualityContext(value)).toThrow(/original capture/);
  });
  it("does not mutate or alias the source snapshot and turns", () => {
    const value = input();
    const before = structuredClone(value);
    const result = buildJourneyQualityContext(value);
    result.turns[0]!.content = "changed";
    expect(value).toEqual(before);
  });
  it("rejects duplicate requirements and duplicate success identities", () => {
    const value = input();
    value.requiredActIds = ["name", "name"];
    expect(() => buildJourneyQualityContext(value)).toThrow(
      /Duplicate required/,
    );
    delete value.requiredActIds;
    value.snapshot.successConditions.push({
      ...value.snapshot.successConditions[0]!,
    });
    expect(() => buildJourneyQualityContext(value)).toThrow(
      /Duplicate success/,
    );
  });
});
