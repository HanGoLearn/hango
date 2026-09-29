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
import { buildSpeakingUploadKey } from "@/lib/speaking-upload";

// Only auth() is mocked — everything else runs against the real database
// and the real local filesystem storage adapter. No OPENAI_API_KEY is set
// in this environment, so both the AI and STT providers resolve to their
// mock implementations (no network calls).
const { authMock } = vi.hoisted(() => ({ authMock: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: authMock }));

const { createSpeakingSessionAction, submitUploadedRecordingAction } =
  await import("@/lib/actions/speaking");

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

function pcmWav(durationSeconds = 0.1, sampleRate = 8_000): Buffer {
  const sampleCount = Math.max(1, Math.floor(durationSeconds * sampleRate));
  const dataSize = sampleCount * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0, "ascii");
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8, "ascii");
  buffer.write("fmt ", 12, "ascii");
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36, "ascii");
  buffer.writeUInt32LE(dataSize, 40);
  return buffer;
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

  it("validates and finalizes an already uploaded private recording", async () => {
    const user = await createTestUser(
      `speaking-direct-${Date.now()}@hango.dev`,
    );
    const session = await createSpeakingSession(
      user.id,
      "SHADOWING",
      "你好",
      {},
    );
    const key = buildSpeakingUploadKey(user.id, session.id, "audio/wav");
    const storage = getStorageProvider();
    await storage.upload(key, pcmWav(), "audio/wav");

    const result = await submitUploadedRecordingAction(session.id, {
      storageKey: key,
      claimedMimeType: "audio/wav",
      toneScore: 72,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.result.audioUrl).toBe(`/api/audio/${key}`);
      expect(result.result.feedback.toneScore).toBe(72);
    }
    const attempt = await db.speakingAttempt.findFirstOrThrow({
      where: { audioFilePath: key },
    });
    expect(attempt.sessionId).toBe(session.id);
    await storage.delete(key);
  });

  it("deletes an invalid direct upload before it reaches STT", async () => {
    const user = await createTestUser(
      `speaking-direct-invalid-${Date.now()}@hango.dev`,
    );
    const session = await createSpeakingSession(
      user.id,
      "PRONUNCIATION",
      "你好",
      {},
    );
    const key = buildSpeakingUploadKey(user.id, session.id, "audio/webm");
    const storage = getStorageProvider();
    await storage.upload(key, Buffer.from("not audio"), "audio/webm");

    const result = await submitUploadedRecordingAction(session.id, {
      storageKey: key,
      claimedMimeType: "audio/webm",
      toneScore: null,
    });

    expect(result).toEqual({
      ok: false,
      error: "Unsupported recording format.",
    });
    expect(await storage.exists(key)).toBe(false);
  });

  it("cannot finalize or delete another learner's direct upload", async () => {
    const owner = await createTestUser(
      `speaking-direct-owner-${Date.now()}@hango.dev`,
    );
    const session = await createSpeakingSession(
      owner.id,
      "PRONUNCIATION",
      "你好",
      {},
    );
    const key = buildSpeakingUploadKey(owner.id, session.id, "audio/wav");
    const storage = getStorageProvider();
    await storage.upload(key, pcmWav(), "audio/wav");

    await createTestUser(`speaking-direct-intruder-${Date.now()}@hango.dev`);
    const result = await submitUploadedRecordingAction(session.id, {
      storageKey: key,
      claimedMimeType: "audio/wav",
      toneScore: null,
    });

    expect(result.ok).toBe(false);
    expect(await storage.exists(key)).toBe(true);
    await storage.delete(key);
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
