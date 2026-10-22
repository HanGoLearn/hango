import { describe, expect, it } from "vitest";
import {
  journeyActEvidenceRule,
  probeJourneyActEvidence,
  type JourneyActEvidenceRule,
} from "@/lib/journey-speaking-quality-act-evidence";
import type { JourneyQualityContext } from "@/lib/journey-speaking-quality-candidate";

function context(
  text: string,
  previous = "你好。",
  sequence = 1,
): JourneyQualityContext {
  return {
    attemptId: "example",
    locale: "es",
    lessonSlug: "foundations-greetings-and-introductions",
    technicallyComplete: true,
    targets: [],
    turns: [
      { id: "partner", sequence: 0, role: "assistant", content: previous },
      { id: "learner", sequence, role: "user", content: text },
    ],
  };
}
function probe(rule: JourneyActEvidenceRule, text: string, previous?: string) {
  return probeJourneyActEvidence(
    rule,
    text,
    "learner",
    context(text, previous),
  );
}
describe("editorial probes for all four frozen greetings objectives", () => {
  it.each([
    ["Greet the other person", "greetings-greet-v1"],
    ["Say your own name", "greetings-identify-v1"],
    ["Ask their name", "greetings-ask-name-v2"],
    ["Ask where they're from", "greetings-ask-origin-v1"],
  ])(
    "binds %s exactly, without choosing a user's database ID",
    (text, rule) => {
      expect(
        journeyActEvidenceRule("foundations-greetings-and-introductions", {
          id: "new-id",
          text,
          kind: "act",
          required: false,
        }),
      ).toBe(rule);
      expect(
        journeyActEvidenceRule("different-lesson", {
          id: "new-id",
          text,
          kind: "act",
          required: false,
        }),
      ).toBeNull();
    },
  );
  it.each([
    ["greetings-greet-v1", "你好。"],
    ["greetings-greet-v1", "您好！"],
    ["greetings-greet-v1", "你好，你叫什么名字？"],
    ["greetings-identify-v1", "我叫小雨。"],
    ["greetings-identify-v1", "我的名字是小明。"],
    ["greetings-identify-v1", "我叫Lina，很高兴认识你。"],
    ["greetings-ask-name-v2", "我叫小雨，你呢？"],
    ["greetings-ask-name-v2", "你叫什么名字？"],
    ["greetings-ask-origin-v1", "你是哪国人？"],
    ["greetings-ask-origin-v1", "请问您来自哪里？"],
    ["greetings-ask-origin-v1", "你是哪个国家的？"],
    ["greetings-ask-origin-v1", "你是哪里人？"],
    ["greetings-ask-origin-v1", "我是中国人，你呢？"],
    ["greetings-ask-origin-v1", "我来自秘鲁，你呢？"],
  ] as Array<[JourneyActEvidenceRule, string]>)(
    "recognizes %s pattern in %s without certifying full semantics",
    (rule, text) => {
      expect(probe(rule, text)).toBe("PATTERN_SUPPORTED");
    },
  );
  it.each([
    ["greetings-greet-v1", "很高兴认识你。"],
    ["greetings-identify-v1", "你叫什么名字？"],
    ["greetings-identify-v1", "他叫小明。"],
    ["greetings-identify-v1", "我不是小明。"],
    ["greetings-ask-origin-v1", "我是中国人。"],
    ["greetings-ask-origin-v1", "我叫小明，你呢？"],
    ["greetings-ask-name-v2", "我是中国人，你呢？"],
    ["greetings-ask-origin-v1", "我想去中国，你呢？"],
    ["greetings-ask-origin-v1", "我是好人，你呢？"],
    ["greetings-ask-origin-v1", "我是学生，你呢？"],
    ["greetings-ask-origin-v1", "你喜欢哪里？"],
    ["greetings-ask-origin-v1", "他来自哪里？"],
  ] as Array<[JourneyActEvidenceRule, string]>)(
    "does not infer %s from %s",
    (rule, text) => {
      expect(probe(rule, text)).toBe("NEEDS_REVIEW");
    },
  );
  it.each([
    ["greetings-ask-name-v2", "我叫小林。你呢？"],
    ["greetings-ask-origin-v1", "我是秘鲁人。你呢？"],
    ["greetings-ask-origin-v1", "你是哪个国家的？"],
  ] as Array<[JourneyActEvidenceRule, string]>)(
    "resolves a complete reciprocal turn using the immediately preceding context: %s",
    (rule, previous) => {
      expect(probe(rule, "你呢？", previous)).toBe("PATTERN_SUPPORTED");
    },
  );
  it("uses the most recent local topic rather than a stale partner name", () => {
    const text = "我叫小雨，我是秘鲁人，你呢？";
    expect(probe("greetings-ask-origin-v1", text, "我叫小林。你呢？")).toBe(
      "PATTERN_SUPPORTED",
    );
    expect(probe("greetings-ask-name-v2", text, "我叫小林。你呢？")).toBe(
      "NEEDS_REVIEW",
    );
  });
  it("does not repair clipped reciprocal citations by borrowing a stale referent", () => {
    const source = context("我叫小雨，我是秘鲁人，你呢？", "我叫小林。你呢？");
    expect(
      probeJourneyActEvidence(
        "greetings-ask-name-v2",
        "你呢？",
        "learner",
        source,
      ),
    ).toBe("NEEDS_REVIEW");
  });
  it.each([
    "他说你好。",
    "我没有说你好。",
    "如果别人问我，你叫什么名字？",
    "她问：你来自哪里？",
    "我不想问你来自哪里。",
  ])("leaves reported/negated/conditional speech unresolved: %s", (text) => {
    for (const rule of [
      "greetings-greet-v1",
      "greetings-identify-v1",
      "greetings-ask-name-v2",
      "greetings-ask-origin-v1",
    ] as const)
      expect(probe(rule, text)).toBe("NEEDS_REVIEW");
  });
  it("does not let a narrow quote hide a negation in its complete learner turn", () => {
    const source = context("我不是问你叫什么名字。");
    expect(
      probeJourneyActEvidence(
        "greetings-ask-name-v2",
        "你叫什么名字",
        "learner",
        source,
      ),
    ).toBe("NEEDS_REVIEW");
  });
  it("does not bridge missing turns or read a future context", () => {
    const source = context("你呢？", "我是中国人。你呢？", 2);
    expect(
      probeJourneyActEvidence(
        "greetings-ask-origin-v1",
        "你呢？",
        "learner",
        source,
      ),
    ).toBe("NEEDS_REVIEW");
    source.turns = [{ ...source.turns[0]!, sequence: 3 }, source.turns[1]!];
    expect(
      probeJourneyActEvidence(
        "greetings-ask-origin-v1",
        "你呢？",
        "learner",
        source,
      ),
    ).toBe("NEEDS_REVIEW");
  });
  it("does not certify a partner-owned quote or an unknown turn", () => {
    const source = context("你好。", "你好。");
    expect(
      probeJourneyActEvidence(
        "greetings-greet-v1",
        "你好。",
        "partner",
        source,
      ),
    ).toBe("NEEDS_REVIEW");
    expect(
      probeJourneyActEvidence("greetings-greet-v1", "你好。", "absent", source),
    ).toBe("NEEDS_REVIEW");
  });
  it("cannot certify unclear recognition even when a literal pattern is present", () => {
    const source = context("你好。");
    source.turns = [
      source.turns[0]!,
      {
        ...source.turns[1]!,
        recognition: {
          confidence: 0.1,
          rawTranscript: "你好。",
          interpretedTranscript: "你好。",
        },
      },
    ];
    expect(
      probeJourneyActEvidence(
        "greetings-greet-v1",
        "你好。",
        "learner",
        source,
      ),
    ).toBe("NEEDS_REVIEW");
  });
  it.each([
    "我是哥伦比亚人，你呢？",
    "请问方便告诉我您的家乡吗？",
    "我来自北京吗？你呢？",
  ])("does not grade unhandled origins/paraphrases as errors: %s", (text) => {
    expect(probe("greetings-ask-origin-v1", text)).toBe("NEEDS_REVIEW");
  });
});
