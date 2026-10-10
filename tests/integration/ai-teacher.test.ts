import { afterEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";

vi.mock("@/lib/ai", async () => {
  const { MockAiProvider } = await import("@/lib/ai/providers/mock");
  const provider = new MockAiProvider();
  return { getAiProvider: () => provider };
});
import {
  sendAiTeacherMessage,
  resetConversation,
  getConversationHistory,
  AiTeacherInputError,
  AiTeacherRateLimitError,
} from "@/lib/ai-teacher-data";

// Only auth() is mocked — everything else runs against the real database.
// No ANTHROPIC_API_KEY is set in this environment, so getAiProvider()
// resolves to MockAiProvider (no network calls, deterministic-ish output).
const { authMock } = vi.hoisted(() => ({ authMock: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: authMock }));

const { sendAiTeacherMessageAction, resetAiTeacherConversationAction } =
  await import("@/lib/actions/ai-teacher");

const testEmails: string[] = [];

afterEach(async () => {
  vi.clearAllMocks();
  if (testEmails.length > 0) {
    await db.user.deleteMany({ where: { email: { in: testEmails } } });
    testEmails.length = 0;
  }
});

async function createTestUser(email: string) {
  testEmails.push(email);
  const user = await db.user.create({ data: { email } });
  await db.learnerProfile.create({ data: { userId: user.id } });
  authMock.mockResolvedValue({ user: { id: user.id } });
  return user;
}

describe("AI Teacher conversation (integration, real database, mock provider)", () => {
  it("stores both the user and assistant message after a successful reply", async () => {
    const user = await createTestUser(
      `ai-teacher-basic-${Date.now()}@hango.dev`,
    );

    const { reply } = await sendAiTeacherMessage(
      user.id,
      "What does 要 mean?",
      {},
      "TUTOR",
    );

    expect(reply.length).toBeGreaterThan(0);

    const history = await getConversationHistory(user.id);
    expect(history).toHaveLength(2);
    expect(history[0]!.role).toBe("USER");
    expect(history[0]!.content).toBe("What does 要 mean?");
    expect(history[1]!.role).toBe("ASSISTANT");
  });

  it("records a usage log entry for every completion", async () => {
    const user = await createTestUser(
      `ai-teacher-usage-${Date.now()}@hango.dev`,
    );

    await sendAiTeacherMessage(user.id, "Give me an example", {}, "TUTOR");

    const usage = await db.aiUsageLog.findMany({ where: { userId: user.id } });
    expect(usage).toHaveLength(1);
    expect(usage[0]!.provider).toBe("mock");
  });

  it("does not persist messages when conversation storage is disabled", async () => {
    const user = await createTestUser(
      `ai-teacher-no-storage-${Date.now()}@hango.dev`,
    );
    await db.learnerProfile.update({
      where: { userId: user.id },
      data: { aiConversationStorageEnabled: false },
    });

    await sendAiTeacherMessage(user.id, "Explain this grammar", {}, "TUTOR");

    const history = await getConversationHistory(user.id);
    expect(history).toHaveLength(0);
    // Usage is still recorded even when conversation storage is off.
    const usage = await db.aiUsageLog.findMany({ where: { userId: user.id } });
    expect(usage).toHaveLength(1);
  });

  it("rejects an empty message", async () => {
    const user = await createTestUser(
      `ai-teacher-empty-${Date.now()}@hango.dev`,
    );
    await expect(
      sendAiTeacherMessage(user.id, "   ", {}, "TUTOR"),
    ).rejects.toBeInstanceOf(AiTeacherInputError);
  });

  it("rejects a message over the length limit", async () => {
    const user = await createTestUser(
      `ai-teacher-toolong-${Date.now()}@hango.dev`,
    );
    await expect(
      sendAiTeacherMessage(user.id, "a".repeat(1001), {}, "TUTOR"),
    ).rejects.toBeInstanceOf(AiTeacherInputError);
  });

  it("rate-limits a user sending too many messages too quickly", async () => {
    const user = await createTestUser(
      `ai-teacher-ratelimit-${Date.now()}@hango.dev`,
    );

    for (let i = 0; i < 15; i++) {
      await sendAiTeacherMessage(user.id, `message ${i}`, {}, "TUTOR");
    }

    await expect(
      sendAiTeacherMessage(user.id, "one too many", {}, "TUTOR"),
    ).rejects.toBeInstanceOf(AiTeacherRateLimitError);
    // 2026-08-19: raised 15s -> 30s -> 60s - 15 sequential message sends,
    // each several DB round trips, hit real Prisma Postgres latency spikes
    // under that day's very heavy, hours-long test load (same infra issue
    // as critical-path.test.ts's/placement-exam.test.ts's timeouts that
    // same day, not a logic bug).
  }, 60_000);

  it("resetConversation clears stored history", async () => {
    const user = await createTestUser(
      `ai-teacher-reset-${Date.now()}@hango.dev`,
    );
    await sendAiTeacherMessage(user.id, "Hello", {}, "TUTOR");
    expect(await getConversationHistory(user.id)).toHaveLength(2);

    await resetConversation(user.id);

    expect(await getConversationHistory(user.id)).toHaveLength(0);
  });

  it("resetConversation never deletes Speaking-practice messages (2026-08-19 bug fix - see ai-teacher-data.ts's resetConversation doc comment)", async () => {
    const user = await createTestUser(
      `ai-teacher-reset-speaking-${Date.now()}@hango.dev`,
    );
    // A real Speaking practice turn, saved the way HanVoiceConversation does
    // (saveRealtimeConversationTurn) - tagged with rolePlay context.
    await db.aiConversation.create({
      data: {
        userId: user.id,
        messages: {
          create: [
            {
              role: "USER",
              content: "你好，我想点菜",
              contextSnapshot: {
                lessonTitle: "Ordering Food",
                rolePlay: { aiRole: "Waiter", learnerRole: "Customer" },
              },
            },
            {
              role: "ASSISTANT",
              content: "欢迎光临",
              contextSnapshot: {
                lessonTitle: "Ordering Food",
                rolePlay: { aiRole: "Waiter", learnerRole: "Customer" },
              },
            },
          ],
        },
      },
    });
    // A plain text-chat question asked afterward (e.g. an "Ask AI" click
    // elsewhere in the app) - this is what should actually get cleared.
    await sendAiTeacherMessage(user.id, "What does 菜 mean?", {}, "TUTOR");

    const beforeReset = await db.aiMessage.findMany({
      where: { conversation: { userId: user.id } },
    });
    expect(beforeReset).toHaveLength(4);

    await resetConversation(user.id);

    const afterReset = await db.aiMessage.findMany({
      where: { conversation: { userId: user.id } },
    });
    expect(afterReset).toHaveLength(2);
    expect(
      afterReset.every((message) => {
        const snapshot = message.contextSnapshot as {
          rolePlay?: unknown;
        } | null;
        return Boolean(snapshot?.rolePlay);
      }),
    ).toBe(true);
    // The conversation row itself survives too - only messages are pruned.
    expect(
      await db.aiConversation.findUnique({ where: { userId: user.id } }),
    ).not.toBeNull();
  });

  it("getConversationHistory excludes Speaking-practice messages from the text chat's own history", async () => {
    const user = await createTestUser(
      `ai-teacher-history-excludes-speaking-${Date.now()}@hango.dev`,
    );
    await db.aiConversation.create({
      data: {
        userId: user.id,
        messages: {
          create: [
            {
              role: "USER",
              content: "你好，我想点菜",
              contextSnapshot: {
                lessonTitle: "Ordering Food",
                rolePlay: { aiRole: "Waiter", learnerRole: "Customer" },
              },
            },
          ],
        },
      },
    });
    await sendAiTeacherMessage(user.id, "What does 菜 mean?", {}, "TUTOR");

    const history = await getConversationHistory(user.id);
    expect(history).toHaveLength(2);
    expect(
      history.every((message) => message.content !== "你好，我想点菜"),
    ).toBe(true);
  });

  it("keeps Tutor, Companion, and Speaking histories independent", async () => {
    const user = await createTestUser(
      `ai-teacher-separated-surfaces-${Date.now()}@hango.dev`,
    );
    await db.aiConversation.create({
      data: {
        userId: user.id,
        messages: {
          create: [
            {
              role: "USER",
              content: "Tutor question",
              contextSnapshot: { hanConversationSurface: "TUTOR" },
            },
            {
              role: "ASSISTANT",
              content: "Tutor answer",
              contextSnapshot: { hanConversationSurface: "TUTOR" },
            },
            {
              role: "USER",
              content: "Companion conversation",
              contextSnapshot: { hanConversationSurface: "COMPANION" },
            },
            {
              role: "ASSISTANT",
              content: "Companion answer",
              contextSnapshot: { hanConversationSurface: "COMPANION" },
            },
            {
              role: "USER",
              content: "Speaking scene",
              contextSnapshot: {
                rolePlay: { aiRole: "Waiter", learnerRole: "Customer" },
              },
            },
          ],
        },
      },
    });

    expect(
      (await getConversationHistory(user.id)).map((message) => message.content),
    ).toEqual(["Tutor question", "Tutor answer"]);
    expect(
      (await getConversationHistory(user.id, "COMPANION")).map(
        (message) => message.content,
      ),
    ).toEqual(["Companion conversation", "Companion answer"]);

    await resetConversation(user.id, true);
    expect(
      (await getConversationHistory(user.id)).map((message) => message.content),
    ).toEqual(["Tutor question", "Tutor answer"]);
    expect(await getConversationHistory(user.id, "COMPANION")).toHaveLength(0);

    const afterCompanionReset = await db.aiMessage.findMany({
      where: { conversation: { userId: user.id } },
      select: { content: true },
    });
    expect(
      afterCompanionReset.map((message) => message.content).sort(),
    ).toEqual(["Speaking scene", "Tutor answer", "Tutor question"].sort());

    await resetConversation(user.id);
    const finalMessages = await db.aiMessage.findMany({
      where: { conversation: { userId: user.id } },
      select: { content: true },
    });
    expect(finalMessages).toEqual([{ content: "Speaking scene" }]);
  });

  it("the Server Action never throws for AI/validation failures - it returns ok: false", async () => {
    const user = await createTestUser(
      `ai-teacher-action-${Date.now()}@hango.dev`,
    );
    void user;

    const result = await sendAiTeacherMessageAction("", {}, "TUTOR");
    expect(result.ok).toBe(false);
  });

  it("Server Actions require an authenticated session", async () => {
    authMock.mockResolvedValue(null);
    await expect(sendAiTeacherMessageAction("hi", {}, "TUTOR")).rejects.toThrow(
      "Not authenticated",
    );
    await expect(resetAiTeacherConversationAction()).rejects.toThrow(
      "Not authenticated",
    );
  });
});
