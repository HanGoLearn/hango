import { afterEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import type { SpeakingConversationFeedback } from "@/lib/reflection-prompt";

// Same pattern as vocabulary-lookup.test.ts: mock the AI provider boundary
// directly, everything else (rate limiting, evidence gating, parsing) real.
const { completeMock } = vi.hoisted(() => ({ completeMock: vi.fn() }));
vi.mock("@/lib/ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai")>();
  return {
    ...actual,
    getAiProvider: () => ({ name: "test-mock", complete: completeMock }),
  };
});

const { authMock } = vi.hoisted(() => ({ authMock: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: authMock }));

const { getFreeTopicPracticeFeedbackAction } = await import(
  "@/lib/actions/free-topic-practice"
);
const { AiProviderError } = await import("@/lib/ai");

const testEmails: string[] = [];

afterEach(async () => {
  vi.clearAllMocks();
  completeMock.mockReset();
  if (testEmails.length > 0) {
    // Cascades to AiUsageLog (onDelete: Cascade) - recordAiUsage now writes
    // real rows here (2026-09-05), unlike when this test file was written.
    await db.user.deleteMany({ where: { email: { in: testEmails } } });
    testEmails.length = 0;
  }
});

/** A real User row, not just a mocked session - recordAiUsage's AiUsageLog write has a real FK on userId. */
async function authenticate(email: string): Promise<string> {
  testEmails.push(email);
  const user = await db.user.create({ data: { email } });
  authMock.mockResolvedValue({ user: { id: user.id } });
  return user.id;
}

function mockCompletion(content: string) {
  return {
    content,
    provider: "test-mock",
    model: "test-model",
    inputTokens: 10,
    outputTokens: 10,
  };
}

function feedbackJson(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    pronunciation: 80,
    fluency: 75,
    accuracy: 85,
    complexity: 60,
    communicationEffectiveness: 90,
    notes: "Good use of vocabulary about food.",
    recommendedNextStep: "Try adding more complex sentence structures.",
    mistakes: [],
    vocabularyUsageRatio: 0.7,
    objectiveCompletionRatio: 1,
    ...overrides,
  });
}

const SUBSTANTIVE_TRANSCRIPT = [
  { role: "user" as const, content: "我今天想吃中国菜，你有什么推荐吗？" },
  { role: "assistant" as const, content: "我推荐宫保鸡丁，很好吃。" },
  { role: "user" as const, content: "好的，谢谢你的推荐，我会试试看。" },
];

describe("Free-topic practice feedback (2026-09-05, integration, mocked AI provider)", () => {
  it("requires authentication", async () => {
    authMock.mockResolvedValue(null);

    const result = await getFreeTopicPracticeFeedbackAction(
      "food",
      SUBSTANTIVE_TRANSCRIPT,
    );

    expect(result).toEqual({ ok: false, error: "Not authenticated" });
    expect(completeMock).not.toHaveBeenCalled();
  });

  it("skips the AI call and returns null feedback when there isn't enough conversation to grade", async () => {
    await authenticate(`free-topic-thin-${Date.now()}@hango.dev`);

    const result = await getFreeTopicPracticeFeedbackAction("food", [
      { role: "user", content: "你好" },
    ]);

    expect(result).toEqual({ ok: true, feedback: null });
    expect(completeMock).not.toHaveBeenCalled();
  });

  it("grades a substantive conversation and includes the topic in the prompt", async () => {
    await authenticate(`free-topic-grade-${Date.now()}@hango.dev`);
    completeMock.mockResolvedValueOnce(mockCompletion(feedbackJson()));

    const result = await getFreeTopicPracticeFeedbackAction(
      "food",
      SUBSTANTIVE_TRANSCRIPT,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.feedback?.notes).toBe(
        "Good use of vocabulary about food.",
      );
      expect(
        (result.feedback as SpeakingConversationFeedback | null)
          ?.vocabularyUsageRatio,
      ).toBe(0.7);
    }
    const [{ systemPrompt }] = completeMock.mock.calls[0]!;
    expect(systemPrompt).toContain("food");
  });

  it("reports the real AI failure instead of silently substituting fabricated scores (2026-08-08 fix)", async () => {
    await authenticate(`free-topic-aifail-${Date.now()}@hango.dev`);
    completeMock.mockRejectedValueOnce(
      new AiProviderError("timeout", "The AI provider timed out."),
    );

    const result = await getFreeTopicPracticeFeedbackAction(
      "food",
      SUBSTANTIVE_TRANSCRIPT,
    );

    expect(result).toEqual({
      ok: false,
      error: "The AI provider timed out.",
    });
  });

  it("rate-limits feedback requests after 10 in the window", async () => {
    await authenticate(`free-topic-ratelimit-${Date.now()}@hango.dev`);
    completeMock.mockResolvedValue(mockCompletion(feedbackJson()));

    for (let i = 0; i < 10; i++) {
      const result = await getFreeTopicPracticeFeedbackAction(
        "food",
        SUBSTANTIVE_TRANSCRIPT,
      );
      expect(result.ok).toBe(true);
    }

    const oneTooMany = await getFreeTopicPracticeFeedbackAction(
      "food",
      SUBSTANTIVE_TRANSCRIPT,
    );
    expect(oneTooMany).toEqual({
      ok: false,
      error: "You've requested feedback a lot recently. Please wait a bit.",
    });
  });
});
