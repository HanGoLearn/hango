import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import {
  journeyActEvidenceRule,
  probeJourneyActEvidence,
} from "@/lib/journey-speaking-quality-act-evidence";
import {
  probeScenarioActEvidence,
  type ScenarioActEvidenceRule,
} from "@/lib/journey-speaking-quality-scenario-evidence";
import { auditJourneyQualityPedagogy } from "@/lib/journey-speaking-quality-pedagogy";
import {
  JOURNEY_QUALITY_CANDIDATE_VERSION,
  type JourneyQualityCandidate,
  type JourneyQualityContext,
} from "@/lib/journey-speaking-quality-candidate";

const restaurant = "restaurant-entering-and-ordering";
const contract = "negotiating-job-contract-reviewing-contract-terms";
const exportRows = (file: string) =>
  (
    JSON.parse(
      readFileSync(`project/curriculum-translations/es/${file}.json`, "utf8"),
    ) as { units: Array<{ key: string; source: string; translation: string }> }
  ).units;
// Public curriculum artifact IDs anchor the fixture to the actual pilot mission.
// Rules bind labels/slug, never hard-code a learner's or production DB's IDs.
const descriptors = [
  [
    restaurant,
    "restaurant",
    "cmstlainl001x3weoirspuqfw",
    "restaurant-order-dish-v1",
  ],
  [
    restaurant,
    "restaurant",
    "cmstlainl001y3weoyfa8eez5",
    "restaurant-order-drink-v1",
  ],
  [
    restaurant,
    "restaurant",
    "cmstlainl001z3weo4ak7ogfw",
    "restaurant-ask-spicy-v1",
  ],
  [
    contract,
    "negotiating-job-contract",
    "cmstmhpfm087f3weotjn7ghrv",
    "contract-ask-scope-v1",
  ],
  [
    contract,
    "negotiating-job-contract",
    "cmstmhpfm087g3weouz84r6y2",
    "contract-pushback-v1",
  ],
  [
    contract,
    "negotiating-job-contract",
    "cmstmhpfm087h3weop0r27ib8",
    "contract-request-written-v1",
  ],
] as const;
function context(
  rule: ScenarioActEvidenceRule,
  text: string,
  previous = "您好。",
): JourneyQualityContext {
  return {
    attemptId: "synthetic",
    locale: "es",
    lessonSlug: rule.startsWith("restaurant-") ? restaurant : contract,
    technicallyComplete: true,
    targets: [],
    turns: [
      { id: "partner", sequence: 0, role: "assistant", content: previous },
      { id: "learner", sequence: 1, role: "user", content: text },
    ],
  };
}
const probe = (
  rule: ScenarioActEvidenceRule,
  text: string,
  previous?: string,
) =>
  probeJourneyActEvidence(rule, text, "learner", context(rule, text, previous));

describe("mission-grounded scenario probes, not calibrated grades", () => {
  it("keeps the editorial matrix aligned with the actual three mission objectives, not their earlier summaries", () => {
    const matrix = JSON.parse(
      readFileSync(
        "project/speaking-quality/phase-1/pilot-matrix.json",
        "utf8",
      ),
    ) as {
      lessons: Array<{
        slug: string;
        objectives: Array<{ sourceText?: string }>;
      }>;
    };
    for (const slug of [restaurant, contract]) {
      const targets = descriptors
        .filter((row) => row[0] === slug)
        .map(
          (row) =>
            exportRows(row[1]).find(
              (entry) =>
                entry.key === `missionSuccessCondition:${row[2]}:description`,
            )!.source,
        );
      expect(
        matrix.lessons
          .find((lesson) => lesson.slug === slug)!
          .objectives.map((objective) => objective.sourceText),
      ).toEqual(targets);
    }
  });
  it.each(descriptors)(
    "binds only the exact ES/EN source objective %s / %s / %s",
    (slug, file, id, rule) => {
      const source = exportRows(file).find(
        (row) => row.key === `missionSuccessCondition:${id}:description`,
      )!;
      expect(source).toBeDefined();
      for (const text of [source.source, source.translation]) {
        const target = {
          id: "arbitrary",
          kind: "act" as const,
          text,
          required: false,
        };
        expect(journeyActEvidenceRule(slug, target)).toBe(rule);
        expect(journeyActEvidenceRule("other-lesson", target)).toBeNull();
        expect(
          journeyActEvidenceRule(slug, { ...target, kind: "grammar" }),
        ).toBeNull();
        expect(
          journeyActEvidenceRule(slug, {
            ...target,
            text: `${text} and something else`,
          }),
        ).toBeNull();
      }
    },
  );
  it.each([
    ["restaurant-order-dish-v1", "我要一份宫保鸡丁。"],
    ["restaurant-order-dish-v1", "你好，我想点一碗牛肉面。"],
    ["restaurant-order-dish-v1", "请给我一盘青菜。"],
    ["restaurant-order-drink-v1", "我要一杯茶。"],
    ["restaurant-order-drink-v1", "来一瓶矿泉水。"],
    ["restaurant-order-drink-v1", "麻烦给我一杯咖啡。"],
    ["restaurant-order-dish-v1", "我要一份炒饭和一杯水。"],
    ["restaurant-order-drink-v1", "我要一份炒饭和一杯水。"],
    ["restaurant-ask-spicy-v1", "这道菜辣吗？"],
    ["restaurant-ask-spicy-v1", "宫保鸡丁辣不辣？"],
    ["restaurant-ask-spicy-v1", "我要一份宫保鸡丁，辣吗？"],
    ["contract-ask-scope-v1", "这条条款具体涵盖哪些范围？"],
    ["contract-ask-scope-v1", "请问，保密条款包括哪些内容？"],
    ["contract-ask-scope-v1", "这个条款的适用范围是什么？"],
    ["contract-pushback-v1", "这个期限是不是有点长？"],
    ["contract-pushback-v1", "我觉得这个范围是不是有点宽？"],
    ["contract-pushback-v1", "这个期限可以缩短一点吗？"],
    ["contract-request-written-v1", "能不能把这些内容写进合同？"],
    ["contract-request-written-v1", "请提供一份书面说明。"],
    ["contract-request-written-v1", "可以给我一份书面确认吗？"],
    ["contract-request-written-v1", "可以用邮件确认吗？"],
  ] as Array<[ScenarioActEvidenceRule, string]>)(
    "finds a limited %s communication pattern: %s",
    (rule, text) => {
      expect(probe(rule, text)).toBe("PATTERN_SUPPORTED");
    },
  );
  it.each([
    ["restaurant-order-dish-v1", "我要一杯咖啡。"],
    ["restaurant-order-drink-v1", "我要一份炒饭。"],
    ["restaurant-order-drink-v1", "我喜欢茶。"],
    ["restaurant-order-dish-v1", "我要点菜。"],
    ["restaurant-ask-spicy-v1", "这道菜不辣。"],
    ["restaurant-ask-spicy-v1", "不要辣。"],
    ["restaurant-ask-spicy-v1", "我要一杯水，辣吗？"],
    ["contract-ask-scope-v1", "条款。"],
    ["contract-ask-scope-v1", "这条条款包括所有内容。"],
    ["contract-pushback-v1", "这个期限很好。"],
    ["contract-pushback-v1", "是不是有点。"],
    ["contract-request-written-v1", "书面文件。"],
    ["contract-request-written-v1", "我会给你一份书面文件。"],
    ["contract-request-written-v1", "我不要书面说明。"],
  ] as Array<[ScenarioActEvidenceRule, string]>)(
    "does not infer %s from unrelated/insufficient text: %s",
    (rule, text) => {
      expect(probe(rule, text)).toBe("NEEDS_REVIEW");
    },
  );
  it.each([
    ["restaurant-order-dish-v1", "一份饺子。", "您想吃什么？"],
    ["restaurant-order-drink-v1", "一杯水。", "您想喝什么？"],
    ["restaurant-ask-spicy-v1", "辣吗？", "您要这道菜吗？"],
    ["contract-ask-scope-v1", "具体涵盖哪些范围？", "我们讨论保密条款。"],
  ] as Array<[ScenarioActEvidenceRule, string, string]>)(
    "requires immediate, relevant context for %s ellipsis",
    (rule, text, previous) => {
      expect(probe(rule, text, previous)).toBe("PATTERN_SUPPORTED");
      expect(probe(rule, text, "您好。")).toBe("NEEDS_REVIEW");
      const gap = context(rule, text, previous);
      gap.turns = [gap.turns[0]!, { ...gap.turns[1]!, sequence: 2 }];
      expect(probeScenarioActEvidence(rule, text, "learner", gap)).toBe(
        "NEEDS_REVIEW",
      );
    },
  );
  it.each([
    ["restaurant-order-drink-v1", "我不要茶。", "茶"],
    ["restaurant-order-drink-v1", "他说我要一杯水。", "我要一杯水"],
    [
      "contract-request-written-v1",
      "我不是说请提供书面说明。",
      "请提供书面说明",
    ],
  ] as Array<[ScenarioActEvidenceRule, string, string]>)(
    "does not hide negation or reported speech with a narrow %s quote",
    (rule, text, quote) => {
      expect(
        probeScenarioActEvidence(rule, quote, "learner", context(rule, text)),
      ).toBe("NEEDS_REVIEW");
    },
  );
  it("does not use a drink prompt as a dish prompt or partial ellipsis after a local topic change", () => {
    expect(probe("restaurant-order-drink-v1", "水。", "您想吃什么？")).toBe(
      "NEEDS_REVIEW",
    );
    const source = context(
      "restaurant-ask-spicy-v1",
      "我要一杯水，辣吗？",
      "您要这道菜吗？",
    );
    expect(
      probeScenarioActEvidence(
        "restaurant-ask-spicy-v1",
        "辣吗？",
        "learner",
        source,
      ),
    ).toBe("NEEDS_REVIEW");
  });
  it.each(["我要寿司。", "Could I have some tea?", "Quiero una bebida."])(
    "leaves unhandled choices/mixed languages for review, not error: %s",
    (text) => {
      expect(probe("restaurant-order-dish-v1", text)).toBe("NEEDS_REVIEW");
      expect(probe("restaurant-order-drink-v1", text)).toBe("NEEDS_REVIEW");
    },
  );
  it("never credits the character, unclear recognition, a wrong lesson or future context", () => {
    const rule = "restaurant-order-drink-v1";
    const source = context(rule, "我要一杯茶。", "我要一杯茶。");
    expect(
      probeScenarioActEvidence(rule, "我要一杯茶。", "partner", source),
    ).toBe("NEEDS_REVIEW");
    source.lessonSlug = restaurant + "-copy";
    expect(
      probeScenarioActEvidence(rule, "我要一杯茶。", "learner", source),
    ).toBe("NEEDS_REVIEW");
    source.lessonSlug = restaurant;
    source.turns = [
      source.turns[0]!,
      {
        ...source.turns[1]!,
        recognition: {
          confidence: 0.1,
          rawTranscript: "我要一杯茶。",
          interpretedTranscript: "我要一杯茶。",
        },
      },
    ];
    expect(
      probeScenarioActEvidence(rule, "我要一杯茶。", "learner", source),
    ).toBe("NEEDS_REVIEW");
    const future = context(rule, "一杯茶。", "您想喝什么？");
    future.turns = [{ ...future.turns[0]!, sequence: 3 }, future.turns[1]!];
    expect(probeScenarioActEvidence(rule, "一杯茶。", "learner", future)).toBe(
      "NEEDS_REVIEW",
    );
  });
  it.each([restaurant, contract])(
    "audits the actual three objectives in %s without approving a score or grammar mastery",
    (slug) => {
      const rows = descriptors.filter((row) => row[0] === slug);
      const texts =
        slug === restaurant
          ? ["我要一份炒饭。", "我要一杯茶。", "这道菜辣不辣？"]
          : [
              "这个条款的范围是什么？",
              "这个期限可以缩短一点吗？",
              "请提供书面说明。",
            ];
      const source = context(rows[0]![3], texts[0]!);
      source.targets = rows.map((row, index) => ({
        id: `act:${index}`,
        kind: "act",
        text: exportRows(row[1]).find(
          (entry) =>
            entry.key === `missionSuccessCondition:${row[2]}:description`,
        )!.source,
        required: true,
      }));
      source.turns = texts.map((content, index) => ({
        id: `u${index}`,
        sequence: index * 2 + 1,
        role: "user",
        content,
      }));
      const dim = {
        observation: "NOT_OBSERVED" as const,
        level: null,
        support: "UNKNOWN" as const,
        reason: "Ejemplo sintético sin nota.",
        citations: [],
      };
      const raw: JourneyQualityCandidate = {
        version: JOURNEY_QUALITY_CANDIDATE_VERSION,
        attemptId: source.attemptId,
        locale: "es",
        dimensions: {
          communication: dim,
          vocabulary: dim,
          grammar: dim,
          interaction: dim,
          pronunciation: { status: "NOT_EVALUATED" },
          fluency: { status: "NOT_EVALUATED" },
        },
        findings: source.targets.map((target, index) => ({
          id: `f${index}`,
          targetId: target.id,
          state: "INDEPENDENT",
          opportunity: "LEARNER_INITIATED",
          reason: "Intención comunicativa de ejemplo.",
          citations: [{ turnId: `u${index}`, quote: texts[index]! }],
          correction: null,
          resolutionId: null,
        })),
      };
      const before = JSON.stringify(raw),
        spy = vi.spyOn(globalThis, "fetch");
      try {
        const audit = auditJourneyQualityPedagogy(raw, source);
        expect(audit.acts.map((act) => act.status)).toEqual([
          "PATTERN_SUPPORTED",
          "PATTERN_SUPPORTED",
          "PATTERN_SUPPORTED",
        ]);
        expect(audit).toMatchObject({
          decision: "HOLD",
          score: null,
          studentReady: false,
        });
        if (slug === contract)
          expect(
            audit.notices.filter(
              (notice) =>
                notice.code === "ACT_FORM_REQUIREMENT_REQUIRES_SEPARATE_REVIEW",
            ),
          ).toHaveLength(2);
        expect(JSON.stringify(raw)).toBe(before);
        expect(spy).not.toHaveBeenCalled();
      } finally {
        spy.mockRestore();
      }
    },
  );
});
