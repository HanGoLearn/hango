import { describe, expect, it } from "vitest";
import {
  inspectJourneyQualityCandidate,
  JOURNEY_QUALITY_CANDIDATE_VERSION,
  type JourneyQualityCandidate,
  type JourneyQualityContext,
} from "@/lib/journey-speaking-quality-candidate";

// Fictional text only: no model judgments, real learners, API or database.
const user = { turnId: "u1", quote: "我叫小林" };
const partner = { turnId: "a1", quote: "你叫什么名字" };
function context(): JourneyQualityContext {
  return {
    attemptId: "pilot",
    locale: "es",
    lessonSlug: "foundations-greetings-and-introductions",
    technicallyComplete: true,
    targets: [
      { id: "name", kind: "act", text: "Presentarse", required: true },
      {
        id: "called",
        kind: "grammar",
        text: "Subject + 叫 + Name",
        required: true,
      },
      { id: "word", kind: "vocabulary", text: "叫", required: false },
    ],
    turns: [
      { id: "a1", sequence: 0, role: "assistant", content: "你叫什么名字？" },
      { id: "u1", sequence: 1, role: "user", content: "我叫小林。" },
      { id: "a2", sequence: 2, role: "assistant", content: "你是哪国人？" },
      { id: "u2", sequence: 3, role: "user", content: "我是秘鲁人。" },
    ],
  };
}
function candidate(): JourneyQualityCandidate {
  const dimension = {
    observation: "OBSERVED" as const,
    level: 4,
    support: "NONE" as const,
    reason: "Recursos apropiados en este ejemplo ficticio.",
    citations: [user],
  };
  return structuredClone<JourneyQualityCandidate>({
    version: JOURNEY_QUALITY_CANDIDATE_VERSION,
    attemptId: "pilot",
    locale: "es",
    dimensions: {
      communication: structuredClone(dimension),
      vocabulary: structuredClone(dimension),
      grammar: structuredClone(dimension),
      interaction: {
        ...structuredClone(dimension),
        citations: [user, partner],
      },
      pronunciation: { status: "NOT_EVALUATED" },
      fluency: { status: "NOT_EVALUATED" },
    },
    findings: ["name", "called", "word"].map((targetId, index) => ({
      id: `f${index}`,
      targetId,
      state: "INDEPENDENT",
      opportunity: "OFFERED",
      citations: [user],
      reason: "Evidencia ficticia pendiente de revisión pedagógica.",
      resolutionId: null,
      correction: null,
    })),
  });
}
function checked(raw = candidate(), ctx = context()) {
  const result = inspectJourneyQualityCandidate(raw, ctx);
  if (!result.ok) throw new Error(JSON.stringify(result.issues));
  return result.profile;
}
function codes(raw: unknown, ctx = context()) {
  const result = inspectJourneyQualityCandidate(raw, ctx);
  if (result.ok) throw new Error("Expected an invalid candidate");
  return result.issues.map((issue) => issue.code);
}
function grammarError(raw = candidate()) {
  raw.findings[1]!.state = "ERROR";
  raw.findings[1]!.correction = {
    chinese: "我叫小林。",
    pinyin: "Wǒ jiào Xiǎolín.",
    translation: "Me llamo Xiaolin.",
  };
  return raw;
}

describe("Quality candidate: separate dimensions, no production grades", () => {
  it("returns six dimensions but no overall grade or rewards", () => {
    const profile = checked();
    expect(profile.status).toBe("CANDIDATE");
    expect(Object.keys(profile.dimensions)).toHaveLength(6);
    expect(profile.score).toBeNull();
    expect(profile.eligibleForRewards).toBe(false);
    expect(profile.dimensions.pronunciation.status).toBe("NOT_EVALUATED");
    expect(profile.dimensions.fluency.status).toBe("NOT_EVALUATED");
  });
  it("rejects empty content evidence under observed maximum dimensions (G01)", () => {
    expect(codes({ ...candidate(), findings: [] })).toContain(
      "DIMENSION_WITHOUT_FINDINGS",
    );
  });
  it("rejects a maximum alongside an unresolved grammar error (G02)", () => {
    expect(codes(grammarError())).toContain("MAXIMUM_WITH_UNRESOLVED_ERROR");
  });
  it("does not penalize all dimensions when only grammar has a declared error", () => {
    const raw = grammarError();
    raw.dimensions.grammar.level = 3;
    const profile = checked(raw);
    expect(profile.dimensions.grammar.level).toBe(3);
    expect(profile.dimensions.communication.level).toBe(4);
    expect(profile.coverage.unconfirmed).toContain("called");
  });
  it("rejects a maximum autonomy claim with continuous support (G03)", () => {
    const raw = candidate();
    raw.dimensions.interaction.support = "CONTINUOUS";
    expect(codes(raw)).toContain("MAXIMUM_WITH_UNCONFIRMED_AUTONOMY");
  });
  it("rejects unknown autonomy at maximum but does not punish occasional help automatically", () => {
    const raw = candidate();
    raw.dimensions.interaction.support = "UNKNOWN";
    expect(codes(raw)).toContain("MAXIMUM_WITH_UNCONFIRMED_AUTONOMY");
    raw.dimensions.interaction.support = "OCCASIONAL";
    expect(checked(raw).dimensions.interaction.level).toBe(4);
  });
  it("has no free-form narrative slot for phonetic perfection claims (G04)", () => {
    expect(
      codes({ ...candidate(), feedback: { summary: "Tonos perfectos" } }),
    ).toContain("INVALID_SCHEMA");
    const raw = candidate();
    expect(
      codes({
        ...raw,
        dimensions: {
          ...raw.dimensions,
          pronunciation: { status: "COMPLETE", level: 4 },
        },
      }),
    ).toContain("INVALID_SCHEMA");
  });
  it("localizes learner-facing labels on the server (G05 mitigation, not prose detection)", () => {
    const raw = candidate();
    raw.findings[0]!.reason = "English internal candidate rationale.";
    expect(checked(raw).feedback[0]!.label).toBe("Aplicación independiente");
    const ctx = context();
    ctx.locale = "en";
    raw.locale = "en";
    expect(checked(raw, ctx).feedback[0]!.label).toBe("Independent use");
    expect(checked(raw, ctx).feedback[0]).not.toHaveProperty("reason");
  });
  it("does not certify calibration just because internally consistent judgments pass (G06)", () => {
    const raw = candidate();
    for (const key of [
      "communication",
      "vocabulary",
      "grammar",
      "interaction",
    ] as const)
      raw.dimensions[key].level = 0;
    expect(checked(raw).limitations).toContain("HUMAN_CALIBRATION_PENDING");
    expect(checked().score).toBeNull();
  });
});

describe("Quality candidate: coverage, opportunities and transfer", () => {
  it("keeps a missing required objective unconfirmed, not mastered or erroneous", () => {
    const ctx = context();
    ctx.targets = [
      ...ctx.targets,
      {
        id: "origin",
        kind: "act",
        text: "Compartir origen",
        required: true,
      },
    ];
    const profile = checked(candidate(), ctx);
    expect(profile.status).toBe("PARTIAL_CANDIDATE");
    expect(profile.coverage.unconfirmed).toEqual(["origin"]);
    expect(profile.feedback.some((item) => item.state === "ERROR")).toBe(false);
  });
  it("does not penalize unused optional vocabulary", () => {
    const ctx = context();
    ctx.targets = [
      ...ctx.targets,
      {
        id: "extra",
        kind: "vocabulary",
        text: "学生",
        required: false,
      },
    ];
    expect(checked(candidate(), ctx).status).toBe("CANDIDATE");
  });
  it("records no opportunity without attributing production", () => {
    const ctx = context();
    ctx.targets = [
      ...ctx.targets,
      {
        id: "origin",
        kind: "act",
        text: "Origen",
        required: true,
      },
    ];
    const raw = candidate();
    raw.findings.push({
      id: "missing",
      targetId: "origin",
      state: "NO_OPPORTUNITY",
      opportunity: "NONE",
      citations: [],
      reason: "La escena no lo permitió.",
      resolutionId: null,
      correction: null,
    });
    expect(checked(raw, ctx).coverage.unconfirmed).toContain("origin");
    raw.findings.at(-1)!.citations = [user];
    expect(codes(raw, ctx)).toContain("UNOBSERVED_WITH_PRODUCTION");
  });
  it("requires preceding assistant evidence for an assisted claim", () => {
    const raw = candidate();
    raw.findings[1]!.state = "ASSISTED";
    raw.dimensions.grammar.level = 2;
    expect(codes(raw)).toContain("MISSING_PRECEDING_MODEL");
    raw.findings[1]!.citations.push(partner);
    expect(checked(raw).coverage.assisted).toContain("called");
    raw.dimensions.grammar.level = 4;
    expect(codes(raw)).toContain("MAXIMUM_WITH_ASSISTANCE_ONLY");
  });
  it("never accepts a future hint as assistance for an earlier answer", () => {
    const raw = candidate();
    raw.findings[1]!.state = "ASSISTED";
    raw.dimensions.grammar.level = 2;
    raw.findings[1]!.citations.push({ turnId: "a2", quote: "你是哪国人" });
    expect(codes(raw)).toContain("MISSING_PRECEDING_MODEL");
  });
  it("requires a real repair, including within one learner turn", () => {
    const raw = candidate();
    raw.findings[1]!.state = "SELF_CORRECTED";
    expect(codes(raw)).toContain("MISSING_SELF_REPAIR");
    const ctx = context();
    ctx.turns = ctx.turns.map((turn) =>
      turn.id === "u1"
        ? { ...turn, content: "我叫是小林。不对，我叫小林。" }
        : turn,
    );
    raw.findings[1]!.citations = [{ turnId: "u1", quote: "我叫是小林" }, user];
    const profile = checked(raw, ctx);
    expect(profile.coverage.selfCorrected).toEqual(["called"]);
    expect(profile.coverage.assisted).toEqual([]);
  });
  it("does not call reversed or duplicated quotes a self-repair", () => {
    const raw = candidate();
    raw.findings[1]!.state = "SELF_CORRECTED";
    raw.findings[1]!.citations = [user, { ...user }];
    expect(codes(raw)).toContain("MISSING_SELF_REPAIR");
  });
  it("resolves an earlier error only through a real later use of the same target", () => {
    const ctx = context();
    ctx.turns = [
      ...ctx.turns,
      { id: "u3", sequence: 4, role: "user", content: "我叫小周。" },
    ];
    const raw = grammarError();
    raw.findings[1]!.resolutionId = "repair";
    raw.findings.push({
      ...structuredClone(raw.findings[1]!),
      id: "repair",
      state: "INDEPENDENT",
      citations: [{ turnId: "u3", quote: "我叫小周" }],
      resolutionId: null,
      correction: null,
    });
    const profile = checked(raw, ctx);
    expect(profile.coverage.independentlyDemonstrated).toContain("called");
    expect(
      profile.feedback.find((item) => item.findingId === "f1"),
    ).toMatchObject({
      resolved: true,
      isPriority: false,
      label: "Error corregido después",
    });
    raw.findings.at(-1)!.targetId = "word";
    expect(codes(raw, ctx)).toContain("INVALID_ERROR_RESOLUTION");
  });
  it("does not erase a later error because earlier use was correct", () => {
    const ctx = context();
    ctx.turns = [
      ...ctx.turns,
      { id: "u3", sequence: 4, role: "user", content: "我叫是小周。" },
    ];
    const raw = candidate();
    raw.dimensions.grammar.level = 3;
    const error = grammarError().findings[1]!;
    raw.findings.push({
      ...error,
      id: "later-error",
      citations: [{ turnId: "u3", quote: "我叫是小周" }],
    });
    expect(checked(raw, ctx).coverage.unconfirmed).toContain("called");
  });
  it("recognizes independent transfer after a real assisted application", () => {
    const ctx = context();
    ctx.turns = [
      ...ctx.turns,
      { id: "u3", sequence: 4, role: "user", content: "我叫小周。" },
    ];
    const raw = candidate();
    raw.findings[1]!.state = "ASSISTED";
    raw.findings[1]!.citations = [partner, user];
    raw.findings.push({
      ...structuredClone(raw.findings[1]!),
      id: "transfer",
      state: "INDEPENDENT",
      citations: [{ turnId: "u3", quote: "我叫小周" }],
    });
    expect(checked(raw, ctx).coverage.independentlyDemonstrated).toContain(
      "called",
    );
  });
});

describe("Quality candidate: integrity and honest missing data", () => {
  it("does not accept a word found elsewhere in the turn but absent from the quoted fragment", () => {
    const ctx = context();
    ctx.turns[1]!.content = "你好，我叫小林。";
    ctx.targets[2]!.text = "你好";
    expect(codes(candidate(), ctx)).toContain("WORD_NOT_PRODUCED");
  });
  it("rejects a lexical error attached to an unrelated target, without changing the candidate", () => {
    const ctx = context();
    ctx.targets[2]!.text = "高兴";
    const raw = candidate();
    raw.dimensions.vocabulary.level = 3;
    raw.findings[2]!.state = "ERROR";
    raw.findings[2]!.correction = {
      chinese: "我想再去别的地方。",
      pinyin: "Wǒ xiǎng zài qù bié de dìfāng.",
      translation: "Quiero volver a visitar otros lugares.",
    };
    const before = JSON.stringify(raw);
    expect(codes(raw, ctx)).toContain("ERROR_TARGET_NOT_GROUNDED");
    expect(JSON.stringify(raw)).toBe(before);
  });
  it("allows a lexical substitution whose intended word occurs only in the correction", () => {
    const ctx = context();
    ctx.targets[2]!.text = "叫";
    ctx.turns = [
      ...ctx.turns,
      { id: "u3", sequence: 4, role: "user", content: "我吃小林。" },
    ];
    const raw = candidate();
    raw.dimensions.vocabulary.level = 3;
    raw.dimensions.vocabulary.citations = [{ turnId: "u3", quote: "我吃小林" }];
    raw.findings[2]!.state = "ERROR";
    raw.findings[2]!.citations = raw.dimensions.vocabulary.citations;
    raw.findings[2]!.correction = {
      chinese: "我叫小林。",
      pinyin: "Wǒ jiào Xiǎolín.",
      translation: "Me llamo Xiaolin.",
    };
    expect(checked(raw, ctx).feedback[2]!.isPriority).toBe(true);
  });
  it.each(["communication", "vocabulary", "grammar"] as const)(
    "requires preceding evidence when %s declares support",
    (key) => {
      const raw = candidate();
      raw.dimensions[key].support = "OCCASIONAL";
      raw.dimensions[key].level = 3;
      expect(codes(raw)).toContain("SUPPORT_WITHOUT_PRECEDING_EVIDENCE");
      raw.dimensions[key].citations.push(partner);
      expect(checked(raw).dimensions[key].support).toBe("OCCASIONAL");
    },
  );
  it("does not invent assistance just because a normal role-play question preceded an answer", () => {
    expect(checked().dimensions.interaction.support).toBe("NONE");
  });
  it("does not use a future character turn as evidence of earlier assistance", () => {
    const raw = candidate();
    raw.dimensions.grammar.level = 3;
    raw.dimensions.grammar.support = "OCCASIONAL";
    raw.dimensions.grammar.citations.push({
      turnId: "a2",
      quote: "你是哪国人",
    });
    expect(codes(raw)).toContain("SUPPORT_WITHOUT_PRECEDING_EVIDENCE");
  });
  it("rejects unrelated character context and never bridges an omitted original turn", () => {
    const ctx = context();
    ctx.turns = [
      ...ctx.turns,
      { id: "a3", sequence: 5, role: "assistant", content: "再见。" },
    ];
    const raw = candidate();
    raw.dimensions.interaction.citations = [
      user,
      { turnId: "a3", quote: "再见" },
    ];
    expect(codes(raw, ctx)).toContain("MISSING_LINKED_EXCHANGE");
    ctx.turns[0]!.sequence = 0;
    ctx.turns[1]!.sequence = 2;
    raw.dimensions.interaction.citations = [partner, user];
    expect(codes(raw, ctx)).toContain("MISSING_LINKED_EXCHANGE");
  });
  it("accepts learner initiative followed by the character's adjacent response", () => {
    const raw = candidate();
    raw.dimensions.interaction.citations = [
      user,
      { turnId: "a2", quote: "你是哪国人" },
    ];
    expect(checked(raw).dimensions.interaction.level).toBe(4);
  });
  it.each(["grammar", "vocabulary"] as const)(
    "requires %s citations to link to its concrete findings",
    (key) => {
      const raw = candidate();
      raw.dimensions[key].citations = [{ turnId: "u2", quote: "我是秘鲁人" }];
      expect(codes(raw)).toContain("DIMENSION_EVIDENCE_NOT_LINKED");
      raw.dimensions[key].citations = [{ turnId: "u1", quote: "我叫小林。" }];
      expect(checked(raw).dimensions[key].level).toBe(4);
    },
  );
  it.each(["vocabulary", "grammar", "communication", "interaction"] as const)(
    "never treats missing %s as zero",
    (key) => {
      const raw = candidate();
      raw.dimensions[key] = {
        observation: "NOT_OBSERVED",
        level: null,
        support: "UNKNOWN",
        reason: "Falta evidencia",
        citations: [],
      };
      const profile = checked(raw);
      expect(profile.status).toBe("PARTIAL_CANDIDATE");
      expect(profile.dimensions[key].level).toBeNull();
    },
  );
  it("rejects invented quotes, foreign targets and wrong attempt metadata", () => {
    const raw = candidate();
    raw.findings[0]!.citations[0]!.quote = "从未说过";
    expect(codes(raw)).toContain("UNBACKED_CITATION");
    expect(codes({ ...candidate(), attemptId: "other" })).toContain(
      "WRONG_ATTEMPT_OR_LOCALE",
    );
    const foreign = candidate();
    foreign.findings[0]!.targetId = "other";
    expect(codes(foreign)).toContain("UNKNOWN_TARGET");
  });
  it("rejects ambiguous target and turn identifiers", () => {
    const ctx = context();
    ctx.targets = [...ctx.targets, ctx.targets[0]!];
    expect(codes(candidate(), ctx)).toContain("DUPLICATE_ID");
    const other = context();
    other.turns = [...other.turns, { ...other.turns[0]!, id: "different" }];
    expect(codes(candidate(), other)).toContain("DUPLICATE_TURN_SEQUENCE");
  });
  it("does not certify doubtful recognition", () => {
    const ctx = context();
    ctx.turns[1]!.recognition = {
      rawTranscript: ctx.turns[1]!.content,
      interpretedTranscript: ctx.turns[1]!.content,
      confidence: 0.1,
    };
    expect(codes(candidate(), ctx)).toContain("UNCERTAIN_RECOGNITION");
  });
  it("requires actual learner production for a word, not a partner's mention", () => {
    const ctx = context();
    ctx.targets[2]!.text = "名字";
    expect(codes(candidate(), ctx)).toContain("WORD_NOT_PRODUCED");
  });
  it("rejects generic assent as a broad comprehension claim", () => {
    const ctx = context();
    ctx.turns[1]!.content = "好的。";
    const raw = candidate();
    raw.findings[0]!.state = "UNDERSTOOD";
    raw.findings[0]!.citations = [{ turnId: "u1", quote: "好的" }];
    expect(codes(raw, ctx)).toContain("GENERIC_ASSENT");
  });
  it("does not ban a short valid 是 answer as lexical production", () => {
    const ctx = context();
    ctx.turns[1]!.content += "是。";
    ctx.targets[2]!.text = "是";
    const raw = candidate();
    raw.findings[2]!.citations = [{ turnId: "u1", quote: "是" }];
    raw.dimensions.vocabulary.citations = [{ turnId: "u1", quote: "是" }];
    expect(checked(raw, ctx).feedback[2]!.state).toBe("INDEPENDENT");
  });
  it("requires a correction example and cannot invent a correction on a positive finding", () => {
    const raw = grammarError();
    raw.findings[1]!.correction = null;
    expect(codes(raw)).toContain("ERROR_WITHOUT_ACTIONABLE_EXAMPLE");
    const other = candidate();
    other.findings[1]!.correction = grammarError().findings[1]!.correction;
    expect(codes(other)).toContain("CORRECTION_WITHOUT_ERROR");
  });
  it("rejects duplicate and contradictory labels for the exact same event", () => {
    const raw = candidate();
    const duplicate = structuredClone(raw.findings[0]!);
    duplicate.id = "duplicate";
    duplicate.state = "UNDERSTOOD";
    raw.findings.push(duplicate);
    expect(codes(raw)).toContain("DUPLICATE_FINDING_EVENT");
  });
  it("preserves usable evidence when capture was technically incomplete without awarding a grade", () => {
    const ctx = context();
    ctx.technicallyComplete = false;
    const profile = checked(candidate(), ctx);
    expect(profile.status).toBe("PARTIAL_CANDIDATE");
    expect(profile.coverage.independentlyDemonstrated).toContain("name");
    expect(profile.score).toBeNull();
  });
  it("does not allow resolution without a later correction event", () => {
    const raw = grammarError();
    raw.findings[1]!.resolutionId = "missing";
    expect(codes(raw)).toContain("INVALID_ERROR_RESOLUTION");
  });
  it("does not mutate any input or provider candidate", () => {
    const ctx = context(),
      raw = candidate();
    const before = JSON.stringify({ ctx, raw });
    inspectJourneyQualityCandidate(raw, ctx);
    expect(JSON.stringify({ ctx, raw })).toBe(before);
  });
});
