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

const { generateCustomScenario, SpeakingScenarioRateLimitError } =
  await import("@/lib/speaking-data");
const { generateCustomScenarioAction } = await import(
  "@/lib/actions/speaking"
);

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

const SCENARIO_JSON = JSON.stringify({
  title: "Explaining a late arrival",
  scenarioContext: "The learner is calling their manager to say they'll be late.",
  learnerRole: "An employee running late",
  aiRole: "Their manager",
  objective: "Explain why they're late and give an ETA",
  openingLine: "喂，你好，怎么了？",
});

describe("Han Companion custom scenarios (2026-08-31, Fase 4, integration, real database)", () => {
  it("generates a real scenario from a free-text request", async () => {
    const user = await createTestUser(
      `custom-scenario-generate-${Date.now()}@hango.dev`,
    );
    completeMock.mockResolvedValueOnce(mockCompletion(SCENARIO_JSON));

    const scenario = await generateCustomScenario(
      user.id,
      "I want to practice explaining to my boss that I'll be late",
      0,
      [],
    );

    expect(scenario).toEqual({
      title: "Explaining a late arrival",
      scenarioContext:
        "The learner is calling their manager to say they'll be late.",
      learnerRole: "An employee running late",
      aiRole: "Their manager",
      objective: "Explain why they're late and give an ETA",
      openingLine: "喂，你好，怎么了？",
    });
  });

  it("rejects an empty request without calling the AI provider", async () => {
    const user = await createTestUser(
      `custom-scenario-empty-${Date.now()}@hango.dev`,
    );
    await expect(
      generateCustomScenario(user.id, "   ", 0, []),
    ).rejects.toThrow("Tell Han what you'd like to practice.");
    expect(completeMock).not.toHaveBeenCalled();
  });

  it("rate-limits scenario generation after 10 requests", async () => {
    const user = await createTestUser(
      `custom-scenario-ratelimit-${Date.now()}@hango.dev`,
    );
    completeMock.mockResolvedValue(mockCompletion(SCENARIO_JSON));

    for (let i = 0; i < 10; i++) {
      await generateCustomScenario(user.id, `practice request ${i}`, 0, []);
    }

    await expect(
      generateCustomScenario(user.id, "one too many", 0, []),
    ).rejects.toBeInstanceOf(SpeakingScenarioRateLimitError);
  });

  it("never touches points or achievements - Companion is pure practice, no scoring (user decision, 2026-08-31)", async () => {
    const user = await createTestUser(
      `custom-scenario-noscoring-${Date.now()}@hango.dev`,
    );
    completeMock.mockResolvedValueOnce(mockCompletion(SCENARIO_JSON));

    const scenario = await generateCustomScenario(
      user.id,
      "practice explaining I'll be late",
      0,
      [],
    );
    expect(scenario).not.toBeNull();

    // No SpeakingSession, no SpeakingAttempt, no Achievement - generating a
    // scenario is the entire side effect. If a future change wires this
    // into scoring again, this test should be updated deliberately, not
    // silently pass.
    expect(
      await db.speakingSession.count({ where: { userId: user.id } }),
    ).toBe(0);
    expect(await db.achievement.count({ where: { userId: user.id } })).toBe(
      0,
    );
  });

  it("the server action generates a scenario for an authenticated user", async () => {
    const user = await createTestUser(
      `custom-scenario-action-${Date.now()}@hango.dev`,
    );
    void user;
    completeMock.mockResolvedValueOnce(mockCompletion(SCENARIO_JSON));

    const result = await generateCustomScenarioAction(
      "practice explaining I'll be late",
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.scenario.title).toBe("Explaining a late arrival");
    }
  });

  it("the server action requires authentication", async () => {
    authMock.mockResolvedValue(null);
    await expect(
      generateCustomScenarioAction("practice something"),
    ).rejects.toThrow("Not authenticated");
  });
});
