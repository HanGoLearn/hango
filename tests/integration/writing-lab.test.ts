import { afterEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import {
  getWritingTasks,
  getWritingLessonOptions,
  getTranslationChallenges,
  getOrCreateDraftAttempt,
  saveDraft,
  submitWritingAttempt,
  createRewriteAttempt,
  submitCustomWriting,
  getRecentAttempts,
  WritingInputError,
} from "@/lib/writing-data";
import { computeLabPoints } from "@/lib/lab-points";

// Only auth() is mocked — everything else runs against the real database.
// No OPENAI_API_KEY is set in this environment, so the AI provider
// resolves to MockAiProvider (no network calls).
const { authMock } = vi.hoisted(() => ({ authMock: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: authMock }));

const { getOrCreateDraftAttemptAction } = await import("@/lib/actions/writing");

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

describe("Writing Lab (integration, real database, mock AI provider)", () => {
  it("lists the seeded PARAGRAPH task for one lesson", async () => {
    const tasks = await getWritingTasks();
    expect(tasks.length).toBeGreaterThanOrEqual(1);
    expect(tasks.every((t) => t.type === "PARAGRAPH")).toBe(true);
  });

  it("lists a standalone pool of Translation Challenge texts, not scoped to any lesson", async () => {
    const challenges = await getTranslationChallenges();
    expect(challenges.length).toBeGreaterThanOrEqual(10);
    expect(challenges.every((t) => t.type === "TRANSLATION_CHALLENGE")).toBe(true);
    expect(challenges.every((t) => t.lessonId === null)).toBe(true);
    expect(challenges.every((t) => t.referenceAnswer)).toBe(true);
  });

  it("scopes tasks to the requested lesson, and lists every lesson with writing tasks", async () => {
    const lessonOptions = await getWritingLessonOptions();
    expect(lessonOptions.length).toBeGreaterThanOrEqual(2);

    const first = lessonOptions[0]!;
    const second = lessonOptions[1]!;
    const firstTasks = await getWritingTasks(first.id);
    const secondTasks = await getWritingTasks(second.id);

    expect(firstTasks.every((t) => t.lessonId === first.id)).toBe(true);
    expect(secondTasks.every((t) => t.lessonId === second.id)).toBe(true);
  });

  it("creates a draft attempt and reuses it instead of creating a duplicate", async () => {
    const user = await createTestUser(`writing-draft-${Date.now()}@hango.dev`);
    const [task] = await getWritingTasks();

    const first = await getOrCreateDraftAttempt(user.id, task!.id);
    await saveDraft(user.id, first.id, "我要");
    const second = await getOrCreateDraftAttempt(user.id, task!.id);

    expect(second.id).toBe(first.id);
    expect(second.draft).toBe("我要");
  });

  it("submits an attempt, grading the learner's own text and generating a corrected version", async () => {
    const user = await createTestUser(`writing-submit-${Date.now()}@hango.dev`);
    const [task] = await getWritingTasks();

    const attempt = await getOrCreateDraftAttempt(user.id, task!.id);
    await saveDraft(user.id, attempt.id, "我要宫保鸡丁");

    const submitted = await submitWritingAttempt(user.id, attempt.id);

    expect(submitted.submittedResponse).toBe("我要宫保鸡丁");
    expect(submitted.submittedAt).not.toBeNull();
    expect(submitted.feedback).not.toBeNull();
  });

  it("a rewrite creates a new attempt linked back to the original", async () => {
    const user = await createTestUser(
      `writing-rewrite-${Date.now()}@hango.dev`,
    );
    const [task] = await getWritingTasks();

    const attempt = await getOrCreateDraftAttempt(user.id, task!.id);
    await saveDraft(user.id, attempt.id, "我要宫保鸡丁");
    await submitWritingAttempt(user.id, attempt.id);

    const rewrite = await createRewriteAttempt(user.id, attempt.id);

    expect(rewrite.id).not.toBe(attempt.id);
    expect(rewrite.rewriteOfAttemptId).toBe(attempt.id);
    expect(rewrite.draft).toBe("");
  });

  it("lists recent submitted attempts, most recent first", async () => {
    const user = await createTestUser(`writing-recent-${Date.now()}@hango.dev`);
    const [task] = await getWritingTasks();

    const attempt = await getOrCreateDraftAttempt(user.id, task!.id);
    await saveDraft(user.id, attempt.id, "我要茶");
    await submitWritingAttempt(user.id, attempt.id);

    const recent = await getRecentAttempts(user.id);
    expect(recent).toHaveLength(1);
    expect(recent[0]!.task!.id).toBe(task!.id);
  });

  it("rejects acting on another user's attempt", async () => {
    const owner = await createTestUser(`writing-owner-${Date.now()}@hango.dev`);
    const [task] = await getWritingTasks();
    const attempt = await getOrCreateDraftAttempt(owner.id, task!.id);

    const intruder = await createTestUser(
      `writing-intruder-${Date.now()}@hango.dev`,
    );

    await expect(saveDraft(intruder.id, attempt.id, "x")).rejects.toThrow(
      "Not authorized",
    );
  });

  it("grades a custom writing submission and persists it with no WritingTask, so it counts toward Lab points", async () => {
    const user = await createTestUser(`writing-custom-${Date.now()}@hango.dev`);

    const feedback = await submitCustomWriting(
      user.id,
      { topic: "Introduce yourself", level: "HSK 2", format: "a short message", tone: "casual" },
      "我叫王明，我是学生。",
    );

    expect(feedback).not.toBeNull();
    expect(typeof feedback.grammar).toBe("number");

    const attempt = await db.writingAttempt.findFirst({ where: { userId: user.id } });
    expect(attempt).not.toBeNull();
    expect(attempt!.taskId).toBeNull();
    expect(attempt!.submittedAt).not.toBeNull();
    expect(attempt!.submittedResponse).toBe("我叫王明，我是学生。");
    expect((attempt!.customPrompt as { topic: string }).topic).toBe(
      "Introduce yourself",
    );

    // Doesn't crash computing Lab points now that there's real evidence to
    // query for this user (single attempt won't clear the volume/time
    // thresholds, so this just proves the plumbing works end to end).
    const points = await computeLabPoints(user.id);
    expect(points.writing).toBeGreaterThanOrEqual(0);
  });

  it("rejects an empty custom writing submission", async () => {
    const user = await createTestUser(`writing-custom-empty-${Date.now()}@hango.dev`);

    await expect(
      submitCustomWriting(user.id, { topic: "x" }, "   "),
    ).rejects.toThrow(WritingInputError);
  });

  it("rejects a custom writing submission with an empty topic", async () => {
    const user = await createTestUser(`writing-custom-notopic-${Date.now()}@hango.dev`);

    await expect(
      submitCustomWriting(user.id, { topic: "   " }, "我要茶"),
    ).rejects.toThrow(WritingInputError);
  });

  it("Server Actions require an authenticated session", async () => {
    authMock.mockResolvedValue(null);
    await expect(getOrCreateDraftAttemptAction("task-id")).rejects.toThrow(
      "Not authenticated",
    );
  });
});
