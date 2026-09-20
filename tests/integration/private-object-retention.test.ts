import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { getStorageProvider, type StorageProvider } from "@/lib/storage";
import {
  processPrivateObjectDeletionJobs,
  queueExpiredSpeakingObjects,
  queueOrphanedSpeakingObjects,
  queuePrivateSpeakingObjectDeletion,
} from "@/lib/private-object-retention";

const storage = getStorageProvider();
const userIds: string[] = [];
const storageKeys: string[] = [];

afterEach(async () => {
  for (const key of storageKeys.splice(0)) await storage.delete(key);
  if (userIds.length > 0) {
    await db.user.deleteMany({ where: { id: { in: userIds } } });
    await db.privateObjectDeletion.deleteMany({
      where: { ownerUserId: { in: userIds } },
    });
    userIds.length = 0;
  }
});

async function createAttempt(input: {
  days: number | null;
  createdAt: Date;
  label: string;
}) {
  const user = await db.user.create({
    data: {
      email: `retention-${input.label}-${Date.now()}-${Math.random()}@hango.dev`,
    },
  });
  userIds.push(user.id);
  await db.learnerProfile.create({
    data: { userId: user.id, recordingRetentionDays: input.days },
  });
  const session = await db.speakingSession.create({
    data: {
      userId: user.id,
      activityType: "PRONUNCIATION",
      prompt: "你好",
      startedAt: input.createdAt,
    },
  });
  const key = `speaking/${user.id}/${session.id}-${input.createdAt.getTime()}.webm`;
  storageKeys.push(key);
  await storage.upload(key, Buffer.from(input.label), "audio/webm");
  const attempt = await db.speakingAttempt.create({
    data: {
      sessionId: session.id,
      audioFilePath: key,
      createdAt: input.createdAt,
    },
  });
  return { user, attempt, key };
}

describe("private recording retention (integration)", () => {
  it("enforces 7/30/90-day and do-not-retain policies without deleting recent or indefinite recordings", async () => {
    const now = new Date("2026-09-19T12:00:00.000Z");
    const cases = [7, 30, 90] as const;
    const expired = [];
    const recent = [];

    for (const days of cases) {
      expired.push(
        await createAttempt({
          days,
          createdAt: new Date(now.getTime() - (days + 1) * 86_400_000),
          label: `expired-${days}`,
        }),
      );
      recent.push(
        await createAttempt({
          days,
          createdAt: new Date(now.getTime() - (days - 1) * 86_400_000),
          label: `recent-${days}`,
        }),
      );
    }
    const neverRetain = await createAttempt({
      days: 0,
      createdAt: new Date(now.getTime() - 1_000),
      label: "do-not-retain",
    });
    const indefinite = await createAttempt({
      days: null,
      createdAt: new Date("2020-01-01T00:00:00.000Z"),
      label: "indefinite",
    });

    expect(await queueExpiredSpeakingObjects(now, 20)).toBe(4);
    const result = await processPrivateObjectDeletionJobs({ now, limit: 20 });
    expect(result).toMatchObject({ completed: 4, failed: 0 });

    for (const item of [...expired, neverRetain]) {
      expect(await storage.exists(item.key)).toBe(false);
      expect(
        (
          await db.speakingAttempt.findUniqueOrThrow({
            where: { id: item.attempt.id },
          })
        ).audioFilePath,
      ).toBeNull();
    }
    for (const item of [...recent, indefinite]) {
      expect(await storage.exists(item.key)).toBe(true);
      expect(
        (
          await db.speakingAttempt.findUniqueOrThrow({
            where: { id: item.attempt.id },
          })
        ).audioFilePath,
      ).toBe(item.key);
    }
  });

  it("records provider failures and retries them idempotently", async () => {
    const now = new Date("2026-09-19T12:00:00.000Z");
    const item = await createAttempt({
      days: 7,
      createdAt: new Date("2026-09-01T00:00:00.000Z"),
      label: "retry",
    });
    await queuePrivateSpeakingObjectDeletion({
      storageKey: item.key,
      ownerUserId: item.user.id,
      speakingAttemptId: item.attempt.id,
      reason: "RETENTION",
    });

    let shouldFail = true;
    const flakyStorage: StorageProvider = {
      ...storage,
      name: "flaky-test",
      upload: storage.upload.bind(storage),
      getUrl: storage.getUrl.bind(storage),
      download: storage.download.bind(storage),
      exists: storage.exists.bind(storage),
      list: storage.list.bind(storage),
      delete: async (key) => {
        if (shouldFail) {
          shouldFail = false;
          throw new Error("temporary provider outage");
        }
        await storage.delete(key);
      },
    };

    expect(
      await processPrivateObjectDeletionJobs({ now, storage: flakyStorage }),
    ).toMatchObject({ completed: 0, failed: 1 });
    const failed = await db.privateObjectDeletion.findUniqueOrThrow({
      where: { storageKey: item.key },
    });
    expect(failed.status).toBe("FAILED");
    expect(failed.lastError).toContain("temporary provider outage");
    expect(await storage.exists(item.key)).toBe(true);

    const retryAt = new Date(now.getTime() + 5 * 60 * 1000);
    expect(
      await processPrivateObjectDeletionJobs({
        now: retryAt,
        storage: flakyStorage,
      }),
    ).toMatchObject({ completed: 1, failed: 0 });
    expect(await storage.exists(item.key)).toBe(false);
  });

  it("deletes old unreferenced speaking objects but preserves fresh uploads", async () => {
    const owner = await db.user.create({
      data: { email: `orphan-${Date.now()}@hango.dev` },
    });
    userIds.push(owner.id);
    const now = new Date("2026-09-19T12:00:00.000Z");
    const oldKey = `speaking/${owner.id}/orphan-${now.getTime() - 2 * 86_400_000}.webm`;
    const freshKey = `speaking/${owner.id}/upload-${now.getTime() - 60_000}.webm`;
    storageKeys.push(oldKey, freshKey);
    await storage.upload(oldKey, Buffer.from("old"), "audio/webm");
    await storage.upload(freshKey, Buffer.from("fresh"), "audio/webm");

    expect(await queueOrphanedSpeakingObjects(now, 10, storage)).toBe(1);
    await processPrivateObjectDeletionJobs({ now, storage });

    expect(await storage.exists(oldKey)).toBe(false);
    expect(await storage.exists(freshKey)).toBe(true);
  });
});
