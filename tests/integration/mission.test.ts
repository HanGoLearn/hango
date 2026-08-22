import { afterEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import {
  startMissionAttempt,
  sendMissionMessage,
  endMissionAttempt,
} from "@/lib/mission-data";

// Only auth() is mocked — everything else runs against the real database.
// No OPENAI_API_KEY is set in this environment, so the AI provider
// resolves to MockAiProvider (no network calls).
const { authMock } = vi.hoisted(() => ({ authMock: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: authMock }));

const { startMissionAttemptAction } = await import("@/lib/actions/mission");

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
  authMock.mockResolvedValue({ user: { id: user.id } });
  return user;
}

async function getScenarioFinalMission() {
  return db.mission.findFirstOrThrow({
    where: { scenario: { slug: "restaurant" }, lessonId: null },
  });
}

describe("Mission System (integration, real database, mock AI provider)", () => {
  it("the seeded Restaurant scenario has its own final mission, separate from the lesson mission", async () => {
    const scenarioMission = await getScenarioFinalMission();
    expect(scenarioMission.scenarioId).not.toBeNull();
    expect(scenarioMission.lessonId).toBeNull();

    const lessonMission = await db.mission.findFirstOrThrow({
      where: { lesson: { slug: "restaurant-entering-and-ordering" } },
    });
    expect(lessonMission.id).not.toBe(scenarioMission.id);
  });

  it("starts an attempt with an empty transcript", async () => {
    const user = await createTestUser(`mission-start-${Date.now()}@hango.dev`);
    const mission = await getScenarioFinalMission();

    const attempt = await startMissionAttempt(user.id, mission.id);

    expect(attempt.completionState).toBe("IN_PROGRESS");
    expect(attempt.transcript).toEqual([]);
  });

  it("sending a message appends both the learner's message and the reply to the transcript", async () => {
    const user = await createTestUser(`mission-send-${Date.now()}@hango.dev`);
    const mission = await getScenarioFinalMission();
    const attempt = await startMissionAttempt(user.id, mission.id);

    const { reply } = await sendMissionMessage(user.id, attempt.id, "你好");
    expect(reply.length).toBeGreaterThan(0);

    const updated = await db.missionAttempt.findUniqueOrThrow({
      where: { id: attempt.id },
    });
    const transcript = updated.transcript as {
      role: string;
      content: string;
    }[];
    expect(transcript).toHaveLength(2);
    expect(transcript[0]).toEqual({ role: "user", content: "你好" });
    expect(transcript[1]!.role).toBe("assistant");
  });

  it("ending a mission generates a report and marks it completed", async () => {
    const user = await createTestUser(`mission-end-${Date.now()}@hango.dev`);
    const mission = await getScenarioFinalMission();
    const attempt = await startMissionAttempt(user.id, mission.id);
    await sendMissionMessage(user.id, attempt.id, "你好，我们两位。");

    const completed = await endMissionAttempt(user.id, attempt.id);

    expect(completed.completionState).toBe("COMPLETED");
    expect(completed.completedAt).not.toBeNull();
    expect(completed.report).not.toBeNull();
    const report = completed.report as { successConditions: unknown[] };
    expect(report.successConditions.length).toBeGreaterThan(0);
  });

  it("rejects acting on another user's mission attempt", async () => {
    const owner = await createTestUser(`mission-owner-${Date.now()}@hango.dev`);
    const mission = await getScenarioFinalMission();
    const attempt = await startMissionAttempt(owner.id, mission.id);

    const intruder = await createTestUser(
      `mission-intruder-${Date.now()}@hango.dev`,
    );

    await expect(
      sendMissionMessage(intruder.id, attempt.id, "x"),
    ).rejects.toThrow("Not authorized");
  });

  it("Server Actions require an authenticated session", async () => {
    authMock.mockResolvedValue(null);
    await expect(startMissionAttemptAction("mission-id")).rejects.toThrow(
      "Not authenticated",
    );
  });
});
