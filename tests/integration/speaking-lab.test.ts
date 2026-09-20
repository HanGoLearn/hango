import { access } from "node:fs/promises";
import { afterEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import {
  createSpeakingSession,
  submitRecording,
  submitTextFallback,
  completeSpeakingSession,
  getSpeakingSessionWithAttempts,
  deleteSpeakingAttempt,
} from "@/lib/speaking-data";
import { getStorageProvider } from "@/lib/storage";
import { resolveSafePath } from "@/lib/storage/providers/local";

// Only auth() is mocked — everything else runs against the real database
// and the real local filesystem storage adapter. No OPENAI_API_KEY is set
// in this environment, so both the AI and STT providers resolve to their
// mock implementations (no network calls).
const { authMock } = vi.hoisted(() => ({ authMock: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: authMock }));

const { createSpeakingSessionAction } = await import("@/lib/actions/speaking");

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

describe("Speaking Lab (integration, real database, mock AI/STT providers)", () => {
  it("creates a session with the given activity type and prompt", async () => {
    const user = await createTestUser(
      `speaking-session-${Date.now()}@hango.dev`,
    );
    const session = await createSpeakingSession(
      user.id,
      "PRONUNCIATION",
      "要",
      {},
    );

    expect(session.activityType).toBe("PRONUNCIATION");
    expect(session.prompt).toBe("要");
    expect(session.completionState).toBe("IN_PROGRESS");
  });

  it("stores the audio file, transcribes it, and generates feedback for a recording", async () => {
    const user = await createTestUser(
      `speaking-recording-${Date.now()}@hango.dev`,
    );
    const session = await createSpeakingSession(
      user.id,
      "SHADOWING",
      "几位？",
      {},
    );

    const attempt = await submitRecording(
      user.id,
      session.id,
      Buffer.from("fake audio bytes"),
      "audio/webm",
      3.5,
    );

    expect(attempt.audioFilePath).toBeTruthy();
    expect(attempt.transcript).toContain("Mock transcription");
    expect(attempt.transcriptionConfidence).toBe(0.5);
    expect(attempt.feedback).not.toBeNull();

    const filePath = resolveSafePath(attempt.audioFilePath!);
    await expect(access(filePath)).resolves.toBeUndefined();
  });

  it("processes but does not retain audio when the learner selected that privacy option", async () => {
    const user = await createTestUser(
      `speaking-no-retention-${Date.now()}@hango.dev`,
    );
    await db.learnerProfile.update({
      where: { userId: user.id },
      data: { recordingRetentionDays: 0 },
    });
    const session = await createSpeakingSession(
      user.id,
      "PRONUNCIATION",
      "你好",
      {},
    );

    const attempt = await submitRecording(
      user.id,
      session.id,
      Buffer.from("temporary audio"),
      "audio/webm",
      1,
    );

    expect(attempt.audioFilePath).toBeNull();
    const deletion = await db.privateObjectDeletion.findFirstOrThrow({
      where: { ownerUserId: user.id },
    });
    expect(deletion.status).toBe("COMPLETED");
    expect(await getStorageProvider().exists(deletion.storageKey)).toBe(false);
    await db.privateObjectDeletion.delete({ where: { id: deletion.id } });
  });

  it("stores a text-fallback attempt with full confidence and no audio file", async () => {
    const user = await createTestUser(
      `speaking-textfallback-${Date.now()}@hango.dev`,
    );
    const session = await createSpeakingSession(
      user.id,
      "GUIDED_CONVERSATION",
      "How would you order food?",
      {},
    );

    const attempt = await submitTextFallback(
      user.id,
      session.id,
      "我要宫保鸡丁",
    );

    expect(attempt.audioFilePath).toBeNull();
    expect(attempt.transcript).toBe("我要宫保鸡丁");
    expect(attempt.transcriptionConfidence).toBe(1);
    expect(attempt.feedback).not.toBeNull();
  });

  it("marks a session completed", async () => {
    const user = await createTestUser(
      `speaking-complete-${Date.now()}@hango.dev`,
    );
    const session = await createSpeakingSession(
      user.id,
      "PRONUNCIATION",
      "要",
      {},
    );

    const completed = await completeSpeakingSession(user.id, session.id);

    expect(completed.completionState).toBe("COMPLETED");
    expect(completed.completedAt).not.toBeNull();
  });

  it("returns a session with all of its attempts", async () => {
    const user = await createTestUser(`speaking-list-${Date.now()}@hango.dev`);
    const session = await createSpeakingSession(
      user.id,
      "PRONUNCIATION",
      "要",
      {},
    );
    await submitTextFallback(user.id, session.id, "attempt one");
    await submitTextFallback(user.id, session.id, "attempt two");

    const { attempts } = await getSpeakingSessionWithAttempts(
      user.id,
      session.id,
    );
    expect(attempts).toHaveLength(2);
  });

  it("deletes both the database row and the stored audio file", async () => {
    const user = await createTestUser(
      `speaking-delete-${Date.now()}@hango.dev`,
    );
    const session = await createSpeakingSession(
      user.id,
      "PRONUNCIATION",
      "要",
      {},
    );
    const attempt = await submitRecording(
      user.id,
      session.id,
      Buffer.from("fake audio"),
      "audio/webm",
      1,
    );
    const filePath = resolveSafePath(attempt.audioFilePath!);

    await deleteSpeakingAttempt(user.id, attempt.id);

    expect(
      await db.speakingAttempt.findUnique({ where: { id: attempt.id } }),
    ).toBeNull();
    await expect(access(filePath)).rejects.toThrow();
  });

  it("rejects acting on another user's session", async () => {
    const owner = await createTestUser(
      `speaking-owner-${Date.now()}@hango.dev`,
    );
    const session = await createSpeakingSession(
      owner.id,
      "PRONUNCIATION",
      "要",
      {},
    );

    const intruder = await createTestUser(
      `speaking-intruder-${Date.now()}@hango.dev`,
    );

    await expect(
      submitTextFallback(intruder.id, session.id, "x"),
    ).rejects.toThrow("Not authorized");
  });

  it("Server Actions require an authenticated session", async () => {
    authMock.mockResolvedValue(null);
    await expect(
      createSpeakingSessionAction("PRONUNCIATION", "要", {}),
    ).rejects.toThrow("Not authenticated");
  });
});
