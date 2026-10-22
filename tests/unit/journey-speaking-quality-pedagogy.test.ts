import { describe, expect, it, vi } from "vitest";
import {
  auditJourneyQualityPedagogy,
  JOURNEY_PEDAGOGY_AUDIT_VERSION,
} from "@/lib/journey-speaking-quality-pedagogy";
import {
  JOURNEY_QUALITY_CANDIDATE_VERSION,
  type JourneyQualityCandidate,
  type JourneyQualityContext,
} from "@/lib/journey-speaking-quality-candidate";

function fixture() {
  const context: JourneyQualityContext = {
    attemptId: "synthetic-attempt",
    locale: "es",
    lessonSlug: "foundations-greetings-and-introductions",
    technicallyComplete: true,
    targets: [
      { id: "act:ask", kind: "act", text: "Ask their name", required: true },
    ],
    turns: [
      {
        id: "partner",
        sequence: 0,
        role: "assistant",
        content: "我叫小林。你呢？",
      },
      {
        id: "learner",
        sequence: 1,
        role: "user",
        content: "我叫小明，很高兴认识你。",
      },
    ],
  };
  const dimension = {
    observation: "NOT_OBSERVED" as const,
    level: null,
    support: "UNKNOWN" as const,
    reason: "Sin evidencia suficiente en esta dimensión.",
    citations: [],
  };
  const candidate: JourneyQualityCandidate = {
    version: JOURNEY_QUALITY_CANDIDATE_VERSION,
    attemptId: context.attemptId,
    locale: "es",
    dimensions: {
      communication: dimension,
      vocabulary: dimension,
      grammar: dimension,
      interaction: dimension,
      pronunciation: { status: "NOT_EVALUATED" },
      fluency: { status: "NOT_EVALUATED" },
    },
    findings: [
      {
        id: "finding",
        targetId: "act:ask",
        state: "INDEPENDENT",
        opportunity: "OFFERED",
        citations: [{ turnId: "learner", quote: context.turns[1]!.content }],
        reason: "Motivo del modelo no aprobado.",
        correction: null,
        resolutionId: null,
      },
    ],
  };
  return { context, candidate };
}
const review = (f: ReturnType<typeof fixture>) =>
  auditJourneyQualityPedagogy(f.candidate, f.context);
function learnerText(f: ReturnType<typeof fixture>, text: string) {
  f.context.turns = [
    f.context.turns[0]!,
    { ...f.context.turns[1]!, content: text },
  ];
  f.candidate.findings[0]!.citations = [{ turnId: "learner", quote: text }];
}

describe("offline pedagogical hold, not another evaluation", () => {
  it("flags own-name evidence mistakenly attributed to asking a name", () => {
    const audit = review(fixture());
    expect(audit).toMatchObject({
      version: JOURNEY_PEDAGOGY_AUDIT_VERSION,
      decision: "HOLD",
      studentReady: false,
      score: null,
    });
    expect(audit.acts[0]).toMatchObject({
      status: "EVIDENCE_MISMATCH",
      supportingQuotes: [],
    });
    expect(audit.notices).toContainEqual({
      code: "ACT_EVIDENCE_MISMATCH",
      itemId: "finding",
    });
  });
  it.each([
    "你叫什么名字？",
    "你好，你叫什么名字?",
    "请问您叫什么名字？",
    "您的名字是什么？",
    "你叫什么",
  ])(
    "recognizes the narrow direct-name pattern %s, without approving a grade",
    (text) => {
      const f = fixture();
      learnerText(f, text);
      const audit = review(f);
      expect(audit.acts[0]?.status).toBe("PATTERN_SUPPORTED");
      expect(audit.acts[0]?.supportingQuotes).toEqual([
        { turnId: "learner", quote: text },
      ]);
      expect(audit.studentReady).toBe(false);
    },
  );
  it.each(["你呢？", "我叫小明，你呢？"])(
    "accepts contextual reciprocity %s",
    (text) => {
      const f = fixture();
      learnerText(f, text);
      expect(review(f).acts[0]?.status).toBe("PATTERN_SUPPORTED");
    },
  );
  it.each([
    "我是中国人。你呢？",
    "我叫小林，我是中国人。你呢？",
    "我喜欢北京。你呢？",
  ])(
    "does not confuse reciprocal origin/another topic with asking a name: %s",
    (partner) => {
      const f = fixture();
      learnerText(f, "你呢？");
      f.context.turns = [
        { ...f.context.turns[0]!, content: partner },
        f.context.turns[1]!,
      ];
      expect(review(f).acts[0]?.status).toBe("NEEDS_REVIEW");
    },
  );
  it("does not infer a learner question from the partner's question", () => {
    const f = fixture();
    f.context.turns = [
      { ...f.context.turns[0]!, content: "你叫什么名字？" },
      f.context.turns[1]!,
    ];
    expect(review(f).acts[0]?.status).toBe("EVIDENCE_MISMATCH");
  });
  it("does not bridge a missing turn or borrow future context", () => {
    const f = fixture();
    learnerText(f, "你呢？");
    f.context.turns = [
      { ...f.context.turns[0]!, sequence: 3 },
      f.context.turns[1]!,
    ];
    expect(review(f).acts[0]?.status).toBe("NEEDS_REVIEW");
    f.context.turns = [
      { ...f.context.turns[0]!, sequence: 0 },
      { ...f.context.turns[1]!, sequence: 2 },
    ];
    expect(review(f).acts[0]?.status).toBe("NEEDS_REVIEW");
  });
  it.each([
    "请问可以告诉我您的姓名吗？",
    "我不是问你叫什么名字。",
    "他说，你叫什么名字？",
    "他说：“你叫什么名字？”",
    "如果别人问我，你叫什么名字？",
    "他说，你呢？",
  ])(
    "sends unhandled/reported/negated forms to review, not a learner error: %s",
    (text) => {
      const f = fixture();
      learnerText(f, text);
      expect(review(f).acts[0]?.status).toBe("NEEDS_REVIEW");
      expect(
        review(f).notices.some((x) => x.code === "ACT_EVIDENCE_MISMATCH"),
      ).toBe(false);
    },
  );
  it.each(["different-lesson", "foundations-greetings-and-introductions-copy"])(
    "does not apply this editorial rule to %s",
    (slug) => {
      const f = fixture();
      f.context.lessonSlug = slug;
      expect(review(f).acts[0]).toMatchObject({
        rule: null,
        status: "NEEDS_REVIEW",
      });
    },
  );
  it("requires an exact editorial objective binding, not arbitrary act IDs or label similarity", () => {
    const f = fixture();
    f.context.targets = [
      { ...f.context.targets[0]!, text: "Ask their name and nationality" },
    ];
    expect(review(f).acts[0]?.rule).toBeNull();
  });
  it("counts turns once across repeated citations and overlapping fragments", () => {
    const f = fixture();
    f.candidate.findings[0]!.citations.push({
      turnId: "learner",
      quote: "我叫小明",
    });
    f.candidate.dimensions.communication.citations = [
      { turnId: "learner", quote: "我叫小明" },
    ];
    expect(review(f).coverage).toMatchObject({
      clearLearnerTurns: 1,
      citedLearnerTurns: 1,
    });
  });
  it("distinguishes cited, uncited and excluded speech without grading coverage", () => {
    const f = fixture();
    f.context.turns = [
      ...f.context.turns,
      { id: "extra", sequence: 4, role: "user", content: "你是北京人吗？" },
      {
        id: "doubtful",
        sequence: 6,
        role: "user",
        content: "名字",
        recognition: {
          confidence: 0.1,
          rawTranscript: "名字",
          interpretedTranscript: "名字",
        },
      },
    ];
    const audit = review(f);
    expect(audit.coverage).toMatchObject({
      clearLearnerTurns: 2,
      citedLearnerTurns: 1,
      turns: [
        { turnId: "learner", sequence: 1, status: "CITED" },
        { turnId: "extra", sequence: 4, status: "UNCITED" },
        { turnId: "doubtful", sequence: 6, status: "EXCLUDED_UNCERTAIN" },
      ],
    });
    expect(audit.notices).toContainEqual({ code: "UNCITED_LEARNER_TURNS" });
    expect(audit.coverage).not.toHaveProperty("score");
  });
  it("does not count invented, partner-owned or doubtful citations as learner coverage", () => {
    const f = fixture();
    f.candidate.findings[0]!.citations = [
      { turnId: "learner", quote: "你叫什么名字" },
      { turnId: "partner", quote: "我叫小林" },
    ];
    expect(review(f).coverage.citedLearnerTurns).toBe(0);
  });
  it("does not call required=0 perfect mastery, or force all optional words into a quota", () => {
    const f = fixture();
    f.context.targets = [{ ...f.context.targets[0]!, required: false }];
    expect(review(f).coverage.requiredTargetsConfigured).toBe(false);
    expect(review(f).notices).toContainEqual({
      code: "REQUIRED_TARGETS_NOT_CONFIGURED",
    });
    expect(review(fixture()).coverage.requiredTargetsConfigured).toBe(true);
  });
  it("never certifies uncertain speech or an empty clear sample", () => {
    const f = fixture();
    f.context.turns = [
      {
        ...f.context.turns[1]!,
        recognition: {
          confidence: 0.1,
          rawTranscript: f.context.turns[1]!.content,
          interpretedTranscript: f.context.turns[1]!.content,
        },
      },
    ];
    expect(review(f).coverage).toMatchObject({
      clearLearnerTurns: 0,
      citedLearnerTurns: 0,
    });
    expect(review(f).acts[0]?.status).toBe("NEEDS_REVIEW");
    expect(review(f).studentReady).toBe(false);
  });
  it("holds absence-of-opportunity claims for context review rather than relabeling them", () => {
    const f = fixture();
    Object.assign(f.candidate.findings[0]!, {
      state: "NO_OPPORTUNITY",
      opportunity: "NONE",
      citations: [],
    });
    expect(review(f).notices).toContainEqual({
      code: "OPPORTUNITY_REQUIRES_CONTEXT_REVIEW",
      itemId: "finding",
    });
    expect(f.candidate.findings[0]!.state).toBe("NO_OPPORTUNITY");
  });
  it("does not mutate original levels/prose/citations or emit a student narrative, and never calls fetch", () => {
    const f = fixture();
    const before = JSON.stringify(f);
    const spy = vi.spyOn(globalThis, "fetch");
    try {
      const audit = review(f);
      expect(JSON.stringify(f)).toBe(before);
      expect(audit).not.toHaveProperty("feedback");
      expect(audit).not.toHaveProperty("reason");
      expect(spy).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });
  it("rejects a different attempt/locale rather than auditing unrelated evidence", () => {
    const f = fixture();
    f.candidate.attemptId = "another";
    expect(() => review(f)).toThrow(/identity/);
    f.candidate.attemptId = f.context.attemptId;
    f.candidate.locale = "en";
    expect(() => review(f)).toThrow(/identity/);
  });
  it("offers another original turn separately without repairing a mistaken finding or adding coverage", () => {
    const f = fixture();
    f.context.turns = [
      ...f.context.turns,
      {
        id: "actual-question",
        sequence: 3,
        role: "user",
        content: "你叫什么名字？",
      },
    ];
    const original = JSON.stringify(f.candidate);
    const audit = review(f);
    expect(audit.acts[0]).toMatchObject({
      status: "EVIDENCE_MISMATCH",
      supportingQuotes: [],
      otherSupportedQuotes: [
        { turnId: "actual-question", quote: "你叫什么名字？" },
      ],
    });
    expect(audit.coverage.citedLearnerTurns).toBe(1);
    expect(
      audit.coverage.turns.find((turn) => turn.turnId === "actual-question")
        ?.status,
    ).toBe("UNCITED");
    expect(JSON.stringify(f.candidate)).toBe(original);
    expect(audit.decision).toBe("HOLD");
  });
  it("never offers uncertain speech as replacement evidence", () => {
    const f = fixture();
    f.context.turns = [
      ...f.context.turns,
      {
        id: "question",
        sequence: 3,
        role: "user",
        content: "你叫什么名字？",
        recognition: {
          confidence: 0.1,
          rawTranscript: "你叫什么名字？",
          interpretedTranscript: "你叫什么名字？",
        },
      },
    ];
    expect(review(f).acts[0]?.otherSupportedQuotes).toEqual([]);
  });
});
