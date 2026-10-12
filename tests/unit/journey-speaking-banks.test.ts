import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  buildJourneySpeakingBanks,
  JOURNEY_PILOT_BANK_PLANS,
  renderJourneySpeakingBanks,
  type JourneyBankLesson,
} from "@/lib/content/journey-speaking-banks";
import { buildRealtimeSystemPrompt } from "@/lib/ai-context";
import {
  buildRealtimeClosingInstructions,
  buildRealtimeTurnInstructions,
} from "@/lib/han-realtime";

const snapshot = JSON.parse(
  readFileSync("project/curriculum-audit-2026-10-10/final/matriz.json", "utf8"),
) as {
  lessons: Array<JourneyBankLesson & { dialoguePhrases: string[] }>;
};
const GREETINGS = "foundations-greetings-and-introductions";
const NUMBERS = "foundations-numbers-time-and-dates";
const RETURNS = "basic-shopping-returning-an-item";
const pilot = Object.keys(JOURNEY_PILOT_BANK_PLANS).map((slug) => {
  const row = snapshot.lessons.find((lesson) => lesson.slug === slug);
  if (!row) throw new Error(`Missing audited pilot ${slug}`);
  return { ...row, studiedSteps: [] };
});
function lesson(slug: string, studiedSteps: string[] = []): JourneyBankLesson {
  const row = pilot.find((item) => item.slug === slug)!;
  return { ...row, studiedSteps };
}

describe("reviewed pilot banks against the real audited content", () => {
  it.each(Object.keys(JOURNEY_PILOT_BANK_PLANS))(
    "partitions all current published records without invention for %s",
    (slug) => {
      const current = lesson(slug);
      const banks = buildJourneySpeakingBanks(current, [])!;
      expect(banks.reviewIssues).toEqual([]);
      expect(banks.core.vocabulary.length).toBeGreaterThan(0);
      const words = [banks.core, banks.support, banks.extension].flatMap(
        (bucket) => bucket.vocabulary,
      );
      const grammar = [banks.core, banks.support, banks.extension].flatMap(
        (bucket) => bucket.grammar,
      );
      expect(words.map((item) => item.id).sort()).toEqual(
        current.vocabulary.map((item) => item.id).sort(),
      );
      expect(grammar.map((item) => item.id).sort()).toEqual(
        current.grammar.map((item) => item.id).sort(),
      );
      expect(new Set(words.map((item) => item.id)).size).toBe(words.length);
      for (const item of words) {
        const record = current.vocabulary.find((word) => word.id === item.id)!;
        expect(item.text).toBe(record.chineseForm);
        expect(item.pinyin).toBe(record.pinyin);
        expect(item.meaning).toBe(record.meaning);
        expect(item.evidence).toBe("not-observed");
      }
    },
  );
  it("does not infer knowledge from lesson order, accessibility, dialogue text or points", () => {
    const banks = buildJourneySpeakingBanks(lesson(NUMBERS), pilot)!;
    expect(banks.phraseBank).toEqual([]);
    expect(
      banks.support.vocabulary.some((item) => item.lessonSlug === GREETINGS),
    ).toBe(false);
    expect(
      banks.support.grammar.some((item) => item.lessonSlug === GREETINGS),
    ).toBe(false);
    expect(renderJourneySpeakingBanks(banks)).toContain(
      "NOT proof of comprehension",
    );
  });
  it("requires the matching content step, not any completed step", () => {
    const unrelated = lesson(GREETINGS, ["SITUATION", "SPEAKING", "QUIZ"]);
    const banks = buildJourneySpeakingBanks(lesson(NUMBERS), [unrelated])!;
    expect(
      banks.support.vocabulary.every((item) => item.lessonSlug === NUMBERS),
    ).toBe(true);
    expect(
      banks.support.grammar.every((item) => item.lessonSlug === NUMBERS),
    ).toBe(true);
  });
  it("exposes words and grammar independently and preserves current dialogue only after its own step", () => {
    const previous = lesson(GREETINGS, ["VOCABULARY"]);
    const current = lesson(NUMBERS, ["DIALOGUE", "GRAMMAR"]);
    const banks = buildJourneySpeakingBanks(current, [previous])!;
    expect(
      banks.support.vocabulary.some(
        (item) =>
          item.lessonSlug === GREETINGS &&
          item.evidence === "step-completed-exposure",
      ),
    ).toBe(true);
    expect(
      banks.support.grammar.some((item) => item.lessonSlug === GREETINGS),
    ).toBe(false);
    expect(
      banks.core.vocabulary.every((item) => item.evidence === "not-observed"),
    ).toBe(true);
    expect(
      banks.core.grammar.every(
        (item) => item.evidence === "step-completed-exposure",
      ),
    ).toBe(true);
    expect(banks.phraseBank).toEqual(current.dialoguePhrases);
  });
  it("preserves different meanings and IDs of 号 and exact recurring grammar structures", () => {
    const banks = buildJourneySpeakingBanks(
      lesson(RETURNS, ["VOCABULARY", "GRAMMAR"]),
      [lesson(NUMBERS, ["VOCABULARY", "GRAMMAR"])],
    )!;
    const entries = [banks.core, banks.support, banks.extension]
      .flatMap((bucket) => bucket.vocabulary)
      .filter((item) => item.text === "号");
    expect(entries).toHaveLength(2);
    expect(entries.map((item) => item.meaning).sort()).toEqual([
      "day of the month",
      "size number",
    ]);
    expect(new Set(entries.map((item) => item.id)).size).toBe(2);
    const wants = [banks.core, banks.support]
      .flatMap((bucket) => bucket.grammar)
      .filter((item) => item.text === "Subject + 想 + Verb Phrase");
    expect(new Set(wants.map((item) => item.id)).size).toBe(2);
  });
  it("marks future extensions as unobserved and never merges their IDs with support", () => {
    const banks = buildJourneySpeakingBanks(lesson(GREETINGS), [
      lesson(NUMBERS),
    ])!;
    expect(banks.extension.vocabulary.map((item) => item.text)).toEqual([
      "喝",
      "咖啡",
    ]);
    expect(
      banks.extension.vocabulary.every(
        (item) => item.evidence === "not-observed",
      ),
    ).toBe(true);
    const all = [banks.core, banks.support, banks.extension].flatMap(
      (bucket) => bucket.vocabulary,
    );
    expect(new Set(all.map((item) => item.id)).size).toBe(all.length);
  });
  it("limits support and extension and excludes unpublished records", () => {
    const current = lesson(RETURNS);
    const banks = buildJourneySpeakingBanks(
      current,
      pilot.map((row) => ({ ...row, studiedSteps: ["VOCABULARY", "GRAMMAR"] })),
    )!;
    expect(banks.support.vocabulary.length).toBeLessThanOrEqual(16);
    expect(banks.support.grammar.length).toBeLessThanOrEqual(6);
    expect(banks.extension.vocabulary.length).toBeLessThanOrEqual(4);
    const draft = {
      ...lesson(GREETINGS),
      vocabulary: lesson(GREETINGS).vocabulary.map((item) => ({
        ...item,
        status: "DRAFT",
      })),
    };
    const draftBanks = buildJourneySpeakingBanks(draft, pilot)!;
    expect(draftBanks.core.vocabulary).toEqual([]);
    expect(draftBanks.reviewIssues.length).toBeGreaterThan(0);
    expect(draftBanks.extension.vocabulary.map((item) => item.text)).toEqual([
      "喝",
      "咖啡",
    ]);
  });
  it("makes 惠顾 character-only and optional, not compulsory beginner production", () => {
    const banks = buildJourneySpeakingBanks(
      lesson("basic-shopping-asking-the-price"),
      pilot,
    )!;
    const formal = banks.extension.vocabulary.find(
      (item) => item.text === "惠顾",
    );
    expect(formal?.characterOnly).toBe(true);
    expect(banks.core.vocabulary.some((item) => item.text === "惠顾")).toBe(
      false,
    );
    expect(renderJourneySpeakingBanks(banks)).toContain(
      "never a required learner production target",
    );
  });
  it("does not mutate source data and leaves nonpilot lessons unreviewed", () => {
    const original = structuredClone(pilot);
    buildJourneySpeakingBanks(pilot[0]!, pilot);
    expect(pilot).toEqual(original);
    expect(
      buildJourneySpeakingBanks(
        { ...pilot[0]!, slug: "unreviewed-advanced" },
        pilot,
      ),
    ).toBeNull();
  });
  it("keeps banks consistent in system, turn and closing instructions without affecting Lab", () => {
    const banks = buildJourneySpeakingBanks(
      lesson(GREETINGS, ["VOCABULARY", "GRAMMAR"]),
      pilot,
    )!;
    const rolePlay = {
      aiRole: "classmate",
      learnerRole: "yourself",
      scenarioContext: "Meet at school",
      objective: "Introduce yourself",
      lessonHskLevel: 1,
    };
    const common = renderJourneySpeakingBanks(banks);
    const system = buildRealtimeSystemPrompt(
      { level: "BEGINNER", explanationLanguage: "ES" },
      { rolePlay, speakingSurface: "JOURNEY", journeySpeakingBanks: banks },
      "PRACTICE",
    );
    const turn = buildRealtimeTurnInstructions(
      "Spanish",
      rolePlay,
      null,
      "Me gustan los gatos",
      null,
      "PRACTICE",
      "direct",
      [],
      null,
      "practice",
      banks,
    );
    const closing = buildRealtimeClosingInstructions(rolePlay, [], banks);
    for (const prompt of [system, turn, closing])
      expect(prompt).toContain(common);
    const lab = buildRealtimeSystemPrompt(
      { level: "BEGINNER", explanationLanguage: "ES" },
      {
        rolePlay,
        speakingSurface: "SPEAKING_LAB",
        journeySpeakingBanks: banks,
      },
      "PRACTICE",
    );
    expect(lab).not.toContain("SERVER-RESOLVED JOURNEY BANKS");
  });
});
