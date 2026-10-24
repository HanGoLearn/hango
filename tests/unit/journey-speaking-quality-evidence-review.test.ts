import { describe, expect, it, vi } from "vitest";
import {
  prepareJourneyQualityEvidenceReview,
  JOURNEY_EVIDENCE_TRANSPORT_VERSION,
} from "@/lib/journey-speaking-quality-evidence-review";
import { JOURNEY_QUALITY_CANDIDATE_VERSION } from "@/lib/journey-speaking-quality-candidate";
import { JOURNEY_BANK_VERSION } from "@/lib/content/journey-speaking-bank-contract";
type TestSchema = {
  $defs: { learnerId: { enum: string[] }; partnerId: { enum: string[] } };
  properties: {
    findings: {
      items: {
        anyOf: Array<{
          properties: {
            learnerEvidenceIds: {
              items: { enum: string[] };
              maxItems?: number;
            };
            state: { enum: string[] };
          };
        }>;
      };
    };
  };
};

function input(): Parameters<typeof prepareJourneyQualityEvidenceReview>[0] {
  const entry = {
    id: "word",
    lessonId: "lesson",
    lessonSlug: "greetings",
    text: "叫",
    meaning: "llamarse",
    evidence: "not-observed" as const,
  };
  return {
    attemptId: "attempt",
    locale: "es",
    requiredActIds: ["name"],
    snapshot: {
      lessonId: "lesson",
      lessonSlug: "greetings",
      lessonTitle: "Saludos",
      difficulty: "BEGINNER",
      hskReference: 1,
      aiRole: "Compañero",
      learnerRole: "Tú",
      objective: "Presentarse",
      successConditions: [{ id: "name", text: "Presentarse" }],
      banks: {
        version: JOURNEY_BANK_VERSION,
        lessonId: "lesson",
        lessonSlug: "greetings",
        openingLine: "你好",
        rationale: "Saludar",
        core: {
          vocabulary: [entry],
          grammar: [{ ...entry, id: "pattern", text: "Subject + 叫 + Name" }],
        },
        support: { vocabulary: [], grammar: [] },
        extension: { vocabulary: [], grammar: [] },
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
        {
          id: "original-partner-id",
          sequence: 0,
          role: "assistant",
          content: "你叫什么名字？",
        },
        {
          id: "original-learner-id",
          sequence: 1,
          role: "user",
          content: "我叫小林。",
        },
      ],
    },
  };
}
function wire() {
  const dim = {
    observation: "OBSERVED",
    level: 4,
    support: "NONE",
    reason: "Uso apropiado para esta tarea ficticia.",
    learnerEvidenceIds: ["L1_0"],
    partnerEvidenceIds: [] as string[],
  };
  return {
    version: JOURNEY_QUALITY_CANDIDATE_VERSION,
    transportVersion: JOURNEY_EVIDENCE_TRANSPORT_VERSION,
    attemptId: "attempt",
    locale: "es",
    dimensions: {
      communication: structuredClone(dim),
      vocabulary: structuredClone(dim),
      grammar: structuredClone(dim),
      interaction: { ...structuredClone(dim), partnerEvidenceIds: ["P0_0"] },
      pronunciation: { status: "NOT_EVALUATED" },
      fluency: { status: "NOT_EVALUATED" },
    },
    findings: ["act:name", "vocabulary:word", "grammar:pattern"].map(
      (targetId, index) => ({
        id: `f${index}`,
        targetId,
        state: "INDEPENDENT",
        opportunity: "OFFERED",
        learnerEvidenceIds: ["L1_0"],
        partnerEvidenceIds: [] as string[],
        reason: "Aplicación ficticia.",
        resolutionId: null,
        correction: null,
      }),
    ),
  };
}
function inspect(raw = wire(), source = input()) {
  return prepareJourneyQualityEvidenceReview(source).inspectResponse({
    status: "completed",
    text: JSON.stringify(raw),
  });
}
function codes(raw: ReturnType<typeof wire>, source = input()) {
  const result = inspect(raw, source);
  if (result.state !== "REJECTED_CANDIDATE")
    throw new Error("Expected rejection");
  return result.inspection.issues.map((issue) => issue.code);
}
describe("server-owned evidence selection", () => {
  it.each([7, 8, 9, 12])(
    "accepts %i exact resolved citations allowed by the two role catalogs (24 Oct regression)",
    (total) => {
      const source = input();
      source.capture.turns = Array.from({ length: 12 }, (_, sequence) => ({
        id: `turn-${sequence}`,
        sequence,
        role: sequence % 2 ? ("user" as const) : ("assistant" as const),
        content: sequence % 2 ? "我叫小林。" : "你叫什么名字？",
      }));
      const raw = wire();
      const learnerCount = Math.min(6, total - 3);
      raw.dimensions.communication.learnerEvidenceIds = Array.from(
        { length: learnerCount },
        (_, n) => `L${n * 2 + 1}_0`,
      );
      raw.dimensions.communication.partnerEvidenceIds = Array.from(
        { length: total - learnerCount },
        (_, n) => `P${n * 2}_0`,
      );
      for (const dimension of [
        raw.dimensions.vocabulary,
        raw.dimensions.grammar,
        raw.dimensions.interaction,
      ])
        dimension.learnerEvidenceIds = ["L1_0"];
      raw.dimensions.interaction.partnerEvidenceIds = ["P0_0"];
      expect(inspect(raw, source).state).toBe("VALIDATED_CANDIDATE");
      raw.dimensions.communication.learnerEvidenceIds.push("foreign");
      expect(inspect(raw, source).state).toBe("REJECTED_CANDIDATE");
    },
  );
  it("reconstructs exact authors/text from the frozen catalog, without rewriting the candidate's level", () => {
    const result = inspect();
    expect(result.state).toBe("VALIDATED_CANDIDATE");
    if (result.state !== "VALIDATED_CANDIDATE")
      throw new Error("Rejected fixture");
    expect(result.inspection.profile.feedback[1]!.quotes).toEqual([
      { turnId: "original-learner-id", quote: "我叫小林。" },
    ]);
    expect(result.inspection.profile.score).toBeNull();
    expect(result.inspection.profile.eligibleForRewards).toBe(false);
  });
  it("separates catalogs and constrains learner and partner choices in the actual wire schema", () => {
    const { request } = prepareJourneyQualityEvidenceReview(input());
    const data = JSON.parse(request.input);
    expect(data.turns).toEqual([
      { id: "L1_0", sequence: 1, role: "user", content: "我叫小林。" },
    ]);
    expect(data.partnerContext[0].id).toBe("P0_0");
    const schema = request.responseFormat.schema as unknown as TestSchema;
    expect(schema.$defs.learnerId.enum).toEqual(["L1_0"]);
    expect(schema.$defs.partnerId.enum).toEqual(["P0_0"]);
    expect(
      schema.properties.findings.items.anyOf[1]!.properties.learnerEvidenceIds
        .items.enum,
    ).toEqual(["L1_0"]);
    expect(JSON.stringify(schema)).not.toContain('"quote"');
    expect(JSON.stringify(schema)).not.toContain('"turnId"');
  });
  it("rejects assigning the character's evidence to the learner even if the Mandarin matches", () => {
    const raw = wire();
    raw.findings[1]!.learnerEvidenceIds = ["P0_0"];
    expect(codes(raw)).toContain("WRONG_LEARNER_EVIDENCE_OWNER");
  });
  it("separates technical acceptance from a pedagogical hold without changing request or level", () => {
    const source = input();
    const raw = wire();
    source.snapshot.lessonSlug = "foundations-greetings-and-introductions";
    source.snapshot.banks.lessonSlug = source.snapshot.lessonSlug;
    source.snapshot.successConditions[0]!.text = "Ask their name";
    const prepared = prepareJourneyQualityEvidenceReview(source);
    const before = JSON.stringify(prepared.request);
    const result = prepared.inspectResponse({
      status: "completed",
      text: JSON.stringify(raw),
    });
    expect(result.state).toBe("VALIDATED_CANDIDATE");
    if (result.state !== "VALIDATED_CANDIDATE")
      throw new Error("Invalid fixture");
    expect(result.pedagogy).toMatchObject({
      decision: "HOLD",
      studentReady: false,
      score: null,
    });
    expect(result.pedagogy.notices).toContainEqual({
      code: "ACT_EVIDENCE_MISMATCH",
      itemId: "f0",
    });
    expect(result.inspection.profile.dimensions.communication.level).toBe(4);
    expect(JSON.stringify(prepared.request)).toBe(before);
  });
  it("builds a closed object schema with resolvable local references and bounded enums", () => {
    const schema =
      prepareJourneyQualityEvidenceReview(input()).request.responseFormat
        .schema;
    let enums = 0;
    function visit(value: unknown) {
      if (Array.isArray(value)) {
        value.forEach(visit);
        return;
      }
      if (!value || typeof value !== "object") return;
      const object = value as Record<string, unknown>;
      if (object.type === "object") {
        expect(object.additionalProperties).toBe(false);
        expect(object.required).toEqual(
          Object.keys(object.properties as object),
        );
      }
      if (typeof object.$ref === "string") {
        let destination: unknown = schema;
        for (const key of object.$ref.slice(2).split("/"))
          destination = (destination as Record<string, unknown>)[key];
        expect(destination).toBeDefined();
      }
      if (Array.isArray(object.enum)) enums += object.enum.length;
      Object.values(object).forEach(visit);
    }
    visit(schema);
    expect(schema.type).toBe("object");
    expect(schema).not.toHaveProperty("anyOf");
    expect(enums).toBeLessThanOrEqual(1000);
  });
  it("rejects learner evidence used as partner context and arbitrary invented IDs", () => {
    const raw = wire();
    raw.dimensions.interaction.partnerEvidenceIds = ["L1_0"];
    expect(codes(raw)).toContain("WRONG_PARTNER_EVIDENCE_OWNER");
    raw.findings[0]!.learnerEvidenceIds = ["invented"];
    expect(codes(raw)).toContain("WRONG_LEARNER_EVIDENCE_OWNER");
  });
  it("cannot credit a word spoken only by the character", () => {
    const source = input();
    source.snapshot.banks.core.vocabulary[0]!.text = "名字";
    expect(codes(wire(), source)).toContain("INELIGIBLE_TARGET_EVIDENCE");
    expect(codes(wire(), source)).toContain("ABSENT_VOCABULARY_PRODUCTION");
    const schema = prepareJourneyQualityEvidenceReview(source).request
      .responseFormat.schema as unknown as TestSchema;
    const vocabulary = schema.properties.findings.items.anyOf[1]!.properties;
    expect(vocabulary.learnerEvidenceIds.maxItems).toBe(0);
    expect(vocabulary.state.enum).toEqual(["NOT_OBSERVED", "NO_OPPORTUNITY"]);
  });
  it("cannot attach an unrelated destination phrase to the word happy", () => {
    const source = input();
    source.snapshot.banks.core.vocabulary[0]!.text = "高兴";
    source.capture.turns[1]!.content = "很高兴认识你。";
    source.capture.turns = [
      ...source.capture.turns,
      {
        id: "u2",
        sequence: 2,
        role: "user",
        content: "我想再去别的。",
      },
    ];
    const raw = wire();
    raw.findings[1]!.learnerEvidenceIds = ["L2_0"];
    expect(codes(raw, source)).toContain("INELIGIBLE_TARGET_EVIDENCE");
    const payload = JSON.parse(
      prepareJourneyQualityEvidenceReview(source).request.input,
    );
    expect(payload.targets[1].eligibleLearnerEvidenceIds).toEqual(["L1_0"]);
  });
  it("does not silently convert an old free-quote judgment into the new contract", () => {
    const raw = { ...wire(), transportVersion: undefined, citations: [] };
    expect(
      prepareJourneyQualityEvidenceReview(input()).inspectResponse({
        status: "completed",
        text: JSON.stringify(raw),
      }).state,
    ).toBe("REJECTED_CANDIDATE");
  });
  it("rejects extra quote fields rather than trusting model-written text", () => {
    const raw = wire();
    Object.assign(raw.findings[0]!, {
      citations: [{ turnId: "original-learner-id", quote: "invented" }],
    });
    expect(codes(raw)).toContain("INVALID_EVIDENCE_CONTRACT");
  });
  it("rejects duplicate evidence and unknown targets", () => {
    const raw = wire();
    raw.findings[0]!.learnerEvidenceIds.push("L1_0");
    expect(codes(raw)).toContain("DUPLICATE_EVIDENCE_SELECTION");
    raw.findings[1]!.targetId = "foreign";
    expect(codes(raw)).toContain("UNKNOWN_TARGET");
  });
  it("omits doubtful speech and refuses to infer it from the character", () => {
    const source = input();
    source.capture.turns[1]!.recognition = {
      confidence: 0.1,
      rawTranscript: "我叫小林。",
      interpretedTranscript: "我叫小明。",
    };
    const payload = JSON.parse(
      prepareJourneyQualityEvidenceReview(source).request.input,
    );
    expect(payload.turns).toEqual([]);
    expect(payload).not.toHaveProperty("interpretedTranscript");
    expect(codes(wire(), source)).toContain("WRONG_LEARNER_EVIDENCE_OWNER");
  });
  it("keeps the frozen catalog when caller input changes later", () => {
    const source = input(),
      prepared = prepareJourneyQualityEvidenceReview(source);
    source.capture.turns[1]!.content = "changed";
    expect(
      prepared.inspectResponse({
        status: "completed",
        text: JSON.stringify(wire()),
      }).state,
    ).toBe("VALIDATED_CANDIDATE");
  });
  it("preserves vocabulary crossing a chunk boundary with an exact original window", () => {
    const source = input();
    source.snapshot.banks.core.vocabulary[0]!.text = "你好";
    source.capture.turns[1]!.content = "啊".repeat(239) + "你好" + "。";
    const payload = JSON.parse(
      prepareJourneyQualityEvidenceReview(source).request.input,
    );
    const ids = payload.targets[1].eligibleLearnerEvidenceIds;
    expect(ids).toHaveLength(1);
    expect(ids[0]).toBe("L1_x239");
    const window = payload.turns.find(
      (turn: { id: string }) => turn.id === ids[0],
    );
    expect(window.content).toContain("你好");
    expect(source.capture.turns[1]!.content).toContain(window.content);
  });
  it.each(["refused", "incomplete"] as const)(
    "preserves %s status without salvage or fetch",
    (status) => {
      const spy = vi.spyOn(globalThis, "fetch");
      try {
        expect(
          prepareJourneyQualityEvidenceReview(input()).inspectResponse({
            status,
            text: JSON.stringify(wire()),
          }).state,
        ).toBe(status === "refused" ? "REFUSED" : "INCOMPLETE");
        expect(spy).not.toHaveBeenCalled();
      } finally {
        spy.mockRestore();
      }
    },
  );
});
