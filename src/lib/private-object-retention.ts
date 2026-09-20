import "server-only";

import { db } from "@/lib/db";
import { getStorageProvider, type StorageProvider } from "@/lib/storage";

const DAY_MS = 24 * 60 * 60 * 1000;
const STALE_PROCESSING_MS = 15 * 60 * 1000;
const ORPHAN_GRACE_MS = DAY_MS;
const COMPLETED_AUDIT_RETENTION_MS = 30 * DAY_MS;
const DEFAULT_BATCH_SIZE = 100;

type DeletionReason =
  | "RETENTION"
  | "ACCOUNT_DELETION"
  | "USER_REQUEST"
  | "ORPHAN_CLEANUP"
  | "FAILED_UPLOAD";

interface PrivateSpeakingObject {
  ownerUserId: string;
  createdAt: Date | null;
}

/**
 * The hard safety boundary for private-object deletion. Shared curriculum,
 * placement, vocabulary, Han, and dialogue audio use other prefixes and can
 * never pass this check.
 */
export function parsePrivateSpeakingObjectKey(
  storageKey: string,
): PrivateSpeakingObject | null {
  const match = /^speaking\/([^/]+)\/([^/]+\.(?:webm|ogg|m4a|wav))$/.exec(
    storageKey,
  );
  if (!match) return null;

  const ownerUserId = match[1]!;
  const timestampMatch = /-(\d{13})\.(?:webm|ogg|m4a|wav)$/.exec(match[2]!);
  const timestamp = timestampMatch ? Number(timestampMatch[1]) : Number.NaN;

  return {
    ownerUserId,
    createdAt: Number.isFinite(timestamp) ? new Date(timestamp) : null,
  };
}

function assertOwnedPrivateSpeakingKey(
  storageKey: string,
  ownerUserId: string,
): void {
  const parsed = parsePrivateSpeakingObjectKey(storageKey);
  if (!parsed || parsed.ownerUserId !== ownerUserId) {
    throw new Error(
      "Refusing to delete an object outside the learner's private speaking namespace",
    );
  }
}

export async function queuePrivateSpeakingObjectDeletion(input: {
  storageKey: string;
  ownerUserId: string;
  speakingAttemptId?: string | null;
  reason: DeletionReason;
}) {
  assertOwnedPrivateSpeakingKey(input.storageKey, input.ownerUserId);
  return db.privateObjectDeletion.upsert({
    where: { storageKey: input.storageKey },
    create: {
      storageKey: input.storageKey,
      ownerUserId: input.ownerUserId,
      speakingAttemptId: input.speakingAttemptId,
      reason: input.reason,
    },
    update: {
      ownerUserId: input.ownerUserId,
      speakingAttemptId: input.speakingAttemptId,
      reason: input.reason,
      status: "PENDING",
      nextAttemptAt: new Date(),
      processingStartedAt: null,
      completedAt: null,
      lastError: null,
    },
  });
}

/** Atomically preserves a retry job before removing an individual attempt row. */
export async function deleteSpeakingAttemptWithPrivateObject(input: {
  attemptId: string;
  ownerUserId: string;
  storageKey: string | null;
}): Promise<void> {
  if (input.storageKey) {
    assertOwnedPrivateSpeakingKey(input.storageKey, input.ownerUserId);
  }
  await db.$transaction(async (tx) => {
    if (input.storageKey) {
      await tx.privateObjectDeletion.upsert({
        where: { storageKey: input.storageKey },
        create: {
          storageKey: input.storageKey,
          ownerUserId: input.ownerUserId,
          speakingAttemptId: input.attemptId,
          reason: "USER_REQUEST",
        },
        update: {
          ownerUserId: input.ownerUserId,
          speakingAttemptId: input.attemptId,
          reason: "USER_REQUEST",
          status: "PENDING",
          nextAttemptAt: new Date(),
          processingStartedAt: null,
          completedAt: null,
          lastError: null,
        },
      });
    }
    await tx.speakingAttempt.delete({ where: { id: input.attemptId } });
  });
}

/**
 * Inventories the user's private recordings and writes the deletion outbox
 * in the same transaction that deletes the account. The jobs intentionally
 * survive the User cascade and can therefore be retried afterward.
 */
export async function deleteAccountWithPrivateObjects(
  userId: string,
): Promise<number> {
  return db.$transaction(async (tx) => {
    const attempts = await tx.speakingAttempt.findMany({
      where: { session: { userId }, audioFilePath: { not: null } },
      select: { id: true, audioFilePath: true },
    });

    const jobs = attempts.flatMap((attempt) => {
      if (!attempt.audioFilePath) return [];
      assertOwnedPrivateSpeakingKey(attempt.audioFilePath, userId);
      return [
        {
          storageKey: attempt.audioFilePath,
          ownerUserId: userId,
          speakingAttemptId: attempt.id,
          reason: "ACCOUNT_DELETION" as const,
        },
      ];
    });

    if (jobs.length > 0) {
      await tx.privateObjectDeletion.createMany({
        data: jobs,
        skipDuplicates: true,
      });
      await tx.privateObjectDeletion.updateMany({
        where: {
          storageKey: { in: jobs.map((job) => job.storageKey) },
          status: { not: "COMPLETED" },
        },
        data: {
          status: "PENDING",
          nextAttemptAt: new Date(),
          processingStartedAt: null,
          lastError: null,
        },
      });
    }

    await tx.user.delete({ where: { id: userId } });
    return jobs.length;
  });
}

/** Queue every current recording owned by one learner (used when choosing "do not retain"). */
export async function queueAllSpeakingObjectsForUser(
  userId: string,
  reason: DeletionReason = "RETENTION",
): Promise<number> {
  const attempts = await db.speakingAttempt.findMany({
    where: { session: { userId }, audioFilePath: { not: null } },
    select: { id: true, audioFilePath: true },
  });
  const jobs = attempts.flatMap((attempt) => {
    if (!attempt.audioFilePath) return [];
    assertOwnedPrivateSpeakingKey(attempt.audioFilePath, userId);
    return [
      {
        storageKey: attempt.audioFilePath,
        ownerUserId: userId,
        speakingAttemptId: attempt.id,
        reason,
      },
    ];
  });
  if (jobs.length === 0) return 0;
  await db.privateObjectDeletion.createMany({
    data: jobs,
    skipDuplicates: true,
  });
  await db.privateObjectDeletion.updateMany({
    where: {
      storageKey: { in: jobs.map((job) => job.storageKey) },
      status: { not: "COMPLETED" },
    },
    data: {
      status: "PENDING",
      nextAttemptAt: new Date(),
      processingStartedAt: null,
      lastError: null,
    },
  });
  return jobs.length;
}

export async function queueExpiredSpeakingObjects(
  now: Date = new Date(),
  limit = DEFAULT_BATCH_SIZE,
): Promise<number> {
  const profiles = await db.learnerProfile.findMany({
    where: { recordingRetentionDays: { not: null } },
    select: { userId: true, recordingRetentionDays: true },
    orderBy: { userId: "asc" },
  });

  const jobs: {
    storageKey: string;
    ownerUserId: string;
    speakingAttemptId: string;
    reason: "RETENTION";
  }[] = [];

  for (const profile of profiles) {
    if (jobs.length >= limit || profile.recordingRetentionDays === null) break;
    const cutoff = new Date(
      now.getTime() - profile.recordingRetentionDays * DAY_MS,
    );
    const attempts = await db.speakingAttempt.findMany({
      where: {
        session: { userId: profile.userId },
        audioFilePath: { not: null },
        createdAt: { lte: cutoff },
      },
      select: { id: true, audioFilePath: true },
      orderBy: { createdAt: "asc" },
      take: limit - jobs.length,
    });

    for (const attempt of attempts) {
      if (!attempt.audioFilePath) continue;
      assertOwnedPrivateSpeakingKey(attempt.audioFilePath, profile.userId);
      jobs.push({
        storageKey: attempt.audioFilePath,
        ownerUserId: profile.userId,
        speakingAttemptId: attempt.id,
        reason: "RETENTION",
      });
    }
  }

  if (jobs.length === 0) return 0;
  const result = await db.privateObjectDeletion.createMany({
    data: jobs,
    skipDuplicates: true,
  });
  return result.count;
}

/**
 * Finds unreferenced private recordings. Only timestamped objects older than
 * 24 hours qualify, preventing a maintenance run from racing an upload that
 * has not created its SpeakingAttempt row yet.
 */
export async function queueOrphanedSpeakingObjects(
  now: Date = new Date(),
  limit = DEFAULT_BATCH_SIZE,
  storage: StorageProvider = getStorageProvider(),
): Promise<number> {
  const keys = await storage.list("speaking");
  const eligible = keys.filter((key) => {
    const parsed = parsePrivateSpeakingObjectKey(key);
    return (
      parsed?.createdAt !== null &&
      parsed?.createdAt !== undefined &&
      now.getTime() - parsed.createdAt.getTime() >= ORPHAN_GRACE_MS
    );
  });
  if (eligible.length === 0) return 0;

  const referenced = new Set<string>();
  for (let offset = 0; offset < eligible.length; offset += 500) {
    const paths = eligible.slice(offset, offset + 500);
    const attempts = await db.speakingAttempt.findMany({
      where: { audioFilePath: { in: paths } },
      select: { audioFilePath: true },
    });
    for (const attempt of attempts) {
      if (attempt.audioFilePath) referenced.add(attempt.audioFilePath);
    }
  }

  const jobs = eligible
    .filter((key) => !referenced.has(key))
    .slice(0, limit)
    .map((storageKey) => ({
      storageKey,
      ownerUserId: parsePrivateSpeakingObjectKey(storageKey)!.ownerUserId,
      reason: "ORPHAN_CLEANUP" as const,
    }));
  if (jobs.length === 0) return 0;
  const result = await db.privateObjectDeletion.createMany({
    data: jobs,
    skipDuplicates: true,
  });
  return result.count;
}

export interface PrivateObjectDeletionResult {
  selected: number;
  completed: number;
  failed: number;
}

export async function processPrivateObjectDeletionJobs(
  options: {
    now?: Date;
    limit?: number;
    ownerUserId?: string;
    storage?: StorageProvider;
  } = {},
): Promise<PrivateObjectDeletionResult> {
  const now = options.now ?? new Date();
  const limit = options.limit ?? DEFAULT_BATCH_SIZE;
  const storage = options.storage ?? getStorageProvider();
  const staleBefore = new Date(now.getTime() - STALE_PROCESSING_MS);
  const candidates = await db.privateObjectDeletion.findMany({
    where: {
      ...(options.ownerUserId ? { ownerUserId: options.ownerUserId } : {}),
      OR: [
        { status: "PENDING" },
        { status: "FAILED", nextAttemptAt: { lte: now } },
        {
          status: "PROCESSING",
          processingStartedAt: { lte: staleBefore },
        },
      ],
    },
    orderBy: [{ nextAttemptAt: "asc" }, { createdAt: "asc" }],
    take: limit,
  });

  let completed = 0;
  let failed = 0;

  for (const candidate of candidates) {
    try {
      assertOwnedPrivateSpeakingKey(
        candidate.storageKey,
        candidate.ownerUserId,
      );
    } catch (error) {
      await db.privateObjectDeletion.update({
        where: { id: candidate.id },
        data: {
          status: "FAILED",
          nextAttemptAt: new Date(now.getTime() + DAY_MS),
          processingStartedAt: null,
          lastError: safeErrorMessage(error),
        },
      });
      failed += 1;
      continue;
    }
    const claimed = await db.privateObjectDeletion.updateMany({
      where: {
        id: candidate.id,
        OR: [
          { status: "PENDING" },
          { status: "FAILED", nextAttemptAt: { lte: now } },
          {
            status: "PROCESSING",
            processingStartedAt: { lte: staleBefore },
          },
        ],
      },
      data: {
        status: "PROCESSING",
        processingStartedAt: now,
        attempts: { increment: 1 },
      },
    });
    if (claimed.count === 0) continue;

    try {
      await storage.delete(candidate.storageKey);
      await db.$transaction(async (tx) => {
        if (candidate.speakingAttemptId) {
          await tx.speakingAttempt.updateMany({
            where: {
              id: candidate.speakingAttemptId,
              audioFilePath: candidate.storageKey,
            },
            data: { audioFilePath: null },
          });
        }
        await tx.privateObjectDeletion.update({
          where: { id: candidate.id },
          data: {
            status: "COMPLETED",
            completedAt: now,
            processingStartedAt: null,
            lastError: null,
          },
        });
      });
      completed += 1;
    } catch (error) {
      const attempts = candidate.attempts + 1;
      const delayMinutes = Math.min(24 * 60, 2 ** Math.min(attempts, 10));
      await db.privateObjectDeletion.update({
        where: { id: candidate.id },
        data: {
          status: "FAILED",
          processingStartedAt: null,
          nextAttemptAt: new Date(now.getTime() + delayMinutes * 60 * 1000),
          lastError: safeErrorMessage(error),
        },
      });
      failed += 1;
    }
  }

  return { selected: candidates.length, completed, failed };
}

function safeErrorMessage(error: unknown): string {
  const message =
    error instanceof Error ? error.message : "Unknown storage deletion failure";
  return message
    .replace(/[A-Za-z]:\\[^\s"']+/g, "[local-path]")
    .replace(/speaking\/[^\s"']+/g, "speaking/[redacted]")
    .replace(/[\r\n]+/g, " ")
    .slice(0, 500);
}

export async function runPrivateObjectRetention(
  now: Date = new Date(),
  storage: StorageProvider = getStorageProvider(),
) {
  const expiredQueued = await queueExpiredSpeakingObjects(now);
  const orphansQueued = await queueOrphanedSpeakingObjects(
    now,
    DEFAULT_BATCH_SIZE,
    storage,
  );
  const processed = await processPrivateObjectDeletionJobs({ now, storage });
  const outstandingFailed = await db.privateObjectDeletion.count({
    where: { status: "FAILED" },
  });
  const purgedCompleted = await db.privateObjectDeletion.deleteMany({
    where: {
      status: "COMPLETED",
      completedAt: {
        lt: new Date(now.getTime() - COMPLETED_AUDIT_RETENTION_MS),
      },
    },
  });

  return {
    expiredQueued,
    orphansQueued,
    processed,
    outstandingFailed,
    purgedCompleted: purgedCompleted.count,
  };
}
