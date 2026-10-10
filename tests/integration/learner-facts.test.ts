import { afterEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";

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

const { sendAiTeacherMessage, resetConversation } =
  await import("@/lib/ai-teacher-data");

const testEmails: string[] = [];

afterEach(async () => {
  vi.clearAllMocks();
  completeMock.mockReset();
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

function mockCompletion(content: string) {
  return {
    content,
    provider: "test-mock",
    model: "test-model",
    inputTokens: 10,
    outputTokens: 10,
  };
}

const FACTS_RESPONSE = JSON.stringify({
  facts: [
    { category: "JOB", fact: "Works as a nurse in Lima" },
    { category: "TRIP", fact: "Traveling to Shanghai next month" },
  ],
});

describe("Han Companion personal memory (2026-08-31, LearnerFact, integration, real database)", () => {
  it("extracts and saves facts when a real conversation (8+ messages) resets", async () => {
    const user = await createTestUser(
      `learner-facts-extract-${Date.now()}@hango.dev`,
    );
    // 8 real text-chat turns (4 exchanges), same shape sendAiTeacherMessage
    // itself persists - seeded directly to avoid 8 real chat-completion
    // mock calls just to build history.
    await db.aiConversation.create({
      data: {
        userId: user.id,
        messages: {
          create: Array.from({ length: 8 }, (_, index) => ({
            role: index % 2 === 0 ? "USER" : "ASSISTANT",
            content: `message ${index}`,
            contextSnapshot: { hanConversationSurface: "COMPANION" },
          })),
        },
      },
    });

    completeMock.mockResolvedValueOnce(mockCompletion(FACTS_RESPONSE));
    await resetConversation(user.id, true);
    // extractAndSaveLearnerFacts is fire-and-forget (never awaited by
    // resetConversation) - give its microtasks a turn to complete before
    // asserting on its side effect.
    // extractAndSaveLearnerFacts's own real DB write (not the mocked AI
    // call) needs real time under this Prisma Postgres connection's actual
    // latency - 50ms was too tight and flaked, and so did 800ms once the
    // full suite ran heavier (2026-09-05, more DB round trips added by
    // AI-usage tracking elsewhere in the suite).
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const facts = await db.learnerFact.findMany({ where: { userId: user.id } });
    expect(facts).toHaveLength(2);
    expect(facts.map((f) => f.category).sort()).toEqual(["JOB", "TRIP"]);
    expect(facts.every((f) => f.sourceConversationId)).toBe(true);
  });

  it("does not extract for a short conversation below the message floor, even with extraction requested", async () => {
    const user = await createTestUser(
      `learner-facts-short-${Date.now()}@hango.dev`,
    );
    await db.aiConversation.create({
      data: {
        userId: user.id,
        messages: {
          create: [
            {
              role: "USER",
              content: "hi",
              contextSnapshot: { hanConversationSurface: "COMPANION" },
            },
            {
              role: "ASSISTANT",
              content: "hello",
              contextSnapshot: { hanConversationSurface: "COMPANION" },
            },
          ],
        },
      },
    });

    await resetConversation(user.id, true);
    // extractAndSaveLearnerFacts's own real DB write (not the mocked AI
    // call) needs real time under this Prisma Postgres connection's actual
    // latency - 50ms was too tight and flaked.
    await new Promise((resolve) => setTimeout(resolve, 2000));

    expect(completeMock).not.toHaveBeenCalled();
    const facts = await db.learnerFact.findMany({ where: { userId: user.id } });
    expect(facts).toHaveLength(0);
  });

  it("real bug fix (2026-08-31): Han Tutor's own reset never extracts, even from a long conversation, because it never passes extractFacts=true", async () => {
    const user = await createTestUser(
      `learner-facts-tutor-noextract-${Date.now()}@hango.dev`,
    );
    await db.aiConversation.create({
      data: {
        userId: user.id,
        messages: {
          create: Array.from({ length: 8 }, (_, index) => ({
            role: index % 2 === 0 ? "USER" : "ASSISTANT",
            content: `message ${index}`,
          })),
        },
      },
    });

    completeMock.mockResolvedValueOnce(mockCompletion(FACTS_RESPONSE));
    // Han Tutor's real call shape (ai-teacher-provider.tsx's openTeacher ->
    // resetConversation() with no argument) - must default to false.
    await resetConversation(user.id);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    expect(completeMock).not.toHaveBeenCalled();
    const facts = await db.learnerFact.findMany({ where: { userId: user.id } });
    expect(facts).toHaveLength(0);
  });

  it("extracts nothing when conversation storage is disabled (no messages ever get persisted to extract from)", async () => {
    const user = await createTestUser(
      `learner-facts-no-storage-${Date.now()}@hango.dev`,
    );
    await db.learnerProfile.update({
      where: { userId: user.id },
      data: { aiConversationStorageEnabled: false },
    });
    completeMock.mockResolvedValue(mockCompletion("irrelevant tutor reply"));
    for (let i = 0; i < 8; i++) {
      await sendAiTeacherMessage(user.id, `message ${i}`, {}, "TUTOR");
    }
    completeMock.mockReset();

    await resetConversation(user.id, true);
    // extractAndSaveLearnerFacts's own real DB write (not the mocked AI
    // call) needs real time under this Prisma Postgres connection's actual
    // latency - 50ms was too tight and flaked.
    await new Promise((resolve) => setTimeout(resolve, 2000));

    expect(completeMock).not.toHaveBeenCalled();
    const facts = await db.learnerFact.findMany({ where: { userId: user.id } });
    expect(facts).toHaveLength(0);
  });

  it("never extracts from a role-play (Speaking) conversation", async () => {
    const user = await createTestUser(
      `learner-facts-roleplay-${Date.now()}@hango.dev`,
    );
    await db.aiConversation.create({
      data: {
        userId: user.id,
        messages: {
          create: Array.from({ length: 8 }, (_, index) => ({
            role: index % 2 === 0 ? "USER" : "ASSISTANT",
            content: `line ${index}`,
            contextSnapshot: {
              lessonTitle: "Ordering Food",
              rolePlay: { aiRole: "Waiter", learnerRole: "Customer" },
            },
          })),
        },
      },
    });

    await resetConversation(user.id, true);
    // extractAndSaveLearnerFacts's own real DB write (not the mocked AI
    // call) needs real time under this Prisma Postgres connection's actual
    // latency - 50ms was too tight and flaked.
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Role-play messages are never deleted/extracted by resetConversation
    // at all (ai-teacher-data.ts's isSpeakingMessage guard) - they aren't
    // "text chat" turns to begin with.
    expect(completeMock).not.toHaveBeenCalled();
    const facts = await db.learnerFact.findMany({ where: { userId: user.id } });
    expect(facts).toHaveLength(0);
  });

  it("feeds known facts back into Han Companion's prompt (mode PRACTICE), but never into role-play or Han Tutor", async () => {
    const user = await createTestUser(
      `learner-facts-readback-${Date.now()}@hango.dev`,
    );
    await db.learnerFact.create({
      data: {
        userId: user.id,
        category: "HOBBY",
        fact: "Enjoys rock climbing on weekends",
      },
    });
    completeMock.mockResolvedValue(mockCompletion("好的！"));

    await sendAiTeacherMessage(user.id, "Hi Han", {}, "PRACTICE");
    const companionPrompt = completeMock.mock.calls.at(-1)?.[0]
      ?.systemPrompt as string | undefined;
    expect(companionPrompt).toContain("Enjoys rock climbing on weekends");

    completeMock.mockClear();
    await sendAiTeacherMessage(
      user.id,
      "你好",
      {
        rolePlay: {
          aiRole: "Waiter",
          learnerRole: "Customer",
          scenarioContext: "At a restaurant",
          objective: "Order food",
        },
      },
      "PRACTICE",
    );
    const rolePlayPrompt = completeMock.mock.calls.at(-1)?.[0]?.systemPrompt as
      string | undefined;
    expect(rolePlayPrompt).not.toContain("Enjoys rock climbing on weekends");

    // Real bug fix (2026-08-31): Han Tutor is also `!rolePlay`, exactly
    // like Companion - the original gate (`!context.rolePlay` alone) let
    // Tutor read facts too. Must stay mode-gated.
    completeMock.mockClear();
    await sendAiTeacherMessage(user.id, "Hi Han", {}, "TUTOR");
    const tutorPrompt = completeMock.mock.calls.at(-1)?.[0]?.systemPrompt as
      string | undefined;
    expect(tutorPrompt).not.toContain("Enjoys rock climbing on weekends");
  });
});
