import { beforeEach, describe, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { lesson: { findMany: mock.findMany } } }));
import { getJourneySpeakingBanks } from "@/lib/content/journey-speaking-bank-data";
import { journeyBankCandidateSlugs } from "@/lib/content/journey-speaking-banks";
const current = {
  id: "greetings",
  slug: "foundations-greetings-and-introductions",
  steps: [
    { id: "vocabulary-step", type: "VOCABULARY" },
    { id: "grammar-step", type: "GRAMMAR" },
    { id: "dialogue-step", type: "DIALOGUE" },
  ],
  learnerProgress: [
    { completedStepIds: ["vocabulary-step", "foreign-grammar-step"] },
  ],
  vocabulary: [
    {
      vocabularyItem: {
        id: "nihao",
        chineseForm: "你好",
        pinyin: "nǐ hǎo",
        meaning: "hello",
        status: "PUBLISHED",
      },
    },
  ],
  grammarPoints: [
    {
      grammarPoint: {
        id: "jiao",
        name: "names",
        structure: "Subject + 叫 + Name",
        status: "PUBLISHED",
      },
    },
  ],
  dialogues: [{ lines: [{ chineseText: "你好。" }] }],
};
beforeEach(() => {
  mock.findMany.mockReset();
  mock.findMany.mockImplementation(async (query) =>
    query.where.id === current.id ? [current] : [],
  );
});
describe("server-owned bank exposure query", () => {
  it.each(["user-a", "user-b"])(
    "scopes every progress relation to %s and does not fetch messages or personal facts",
    async (userId) => {
      const banks = await getJourneySpeakingBanks(userId, "greetings");
      const query = mock.findMany.mock.calls[0]?.[0];
      expect(query.take).toBe(1);
      expect(query.where.id).toBe("greetings");
      expect(query.where.status).toBe("PUBLISHED");
      expect(query.where.scenarioLevel.scenario.status).toBe("PUBLISHED");
      expect(query.select.learnerProgress.where).toEqual({ userId });
      expect(query.select.learnerProgress.select).toEqual({
        completedStepIds: true,
      });
      expect(JSON.stringify(query)).not.toMatch(
        /messages|learnerFacts|email|generalLevelPoints/,
      );
      expect(banks?.core.vocabulary[0]?.evidence).toBe(
        "step-completed-exposure",
      );
      expect(banks?.core.grammar[0]?.evidence).toBe("not-observed");
      expect(banks?.phraseBank).toEqual([]);
      const related = mock.findMany.mock.calls[1]?.[0];
      expect(related.take).toBe(8);
      expect(related.where.slug.in).toEqual(
        journeyBankCandidateSlugs(current.slug),
      );
      expect(related.select.learnerProgress.where).toEqual({ userId });
      expect(related.where.status).toBe("PUBLISHED");
      expect(related.where.scenarioLevel.scenario.status).toBe("PUBLISHED");
    },
  );
  it("does not reuse another user's completed steps through a global cache", async () => {
    const first = await getJourneySpeakingBanks("user-a", "greetings");
    mock.findMany.mockImplementation(async (query) =>
      query.where.id === current.id
        ? [{ ...current, learnerProgress: [] }]
        : [],
    );
    const second = await getJourneySpeakingBanks("user-b", "greetings");
    expect(first?.core.vocabulary[0]?.evidence).toBe("step-completed-exposure");
    expect(second?.core.vocabulary[0]?.evidence).toBe("not-observed");
    expect(mock.findMany).toHaveBeenCalledTimes(4);
  });
  it("returns no bank for an unknown, draft or nonpilot lesson", async () => {
    expect(await getJourneySpeakingBanks("user", "unknown")).toBeNull();
    expect(mock.findMany).toHaveBeenCalledTimes(1);
    mock.findMany.mockResolvedValue([]);
    expect(await getJourneySpeakingBanks("user", "greetings")).toBeNull();
  });
  it("queries only selected related lessons, even when the catalogue covers all Foundations", async () => {
    const later = {
      ...current,
      id: "later",
      slug: "plans-and-time-making-and-changing-plans",
    };
    mock.findMany.mockImplementation(async (query) =>
      query.where.id === "later" ? [later] : [],
    );
    await getJourneySpeakingBanks("user", "later");
    expect(mock.findMany.mock.calls[0]![0].where.slug.in).toHaveLength(164);
    const related = mock.findMany.mock.calls[1]![0];
    expect(related.where.slug.in).toHaveLength(5);
    expect(related.where.slug.in).not.toContain(later.slug);
    expect(related.where.slug.in).not.toContain(
      "body-basics-basic-pharmacy-visit",
    );
    expect(related.select).toEqual(mock.findMany.mock.calls[0]![0].select);
  });
  it.each([
    ["", "greetings"],
    ["user", ""],
    ["user", "x".repeat(101)],
  ])("does not query invalid identities", async (userId, lessonId) => {
    expect(await getJourneySpeakingBanks(userId!, lessonId!)).toBeNull();
    expect(mock.findMany).not.toHaveBeenCalled();
  });
});
