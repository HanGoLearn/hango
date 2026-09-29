import "server-only";

import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { LearnerAudioValidationError } from "@/lib/media-validation";
import { parsePrivateSpeakingObjectKey } from "@/lib/private-object-retention";
import { normalizeStorageKey } from "@/lib/storage/key";
import { getStorageProvider } from "@/lib/storage";

export const MAX_SPEAKING_AUDIO_BYTES = 15 * 1024 * 1024;
export const MAX_SPEAKING_AUDIO_DURATION_SECONDS = 5 * 60;
export const SPEAKING_UPLOAD_TOKEN_TTL_MS = 10 * 60 * 1000;
export const SPEAKING_UPLOAD_CONTENT_TYPES = [
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/wav",
  "audio/x-wav",
] as const;

export type SpeakingUploadMimeType =
  (typeof SPEAKING_UPLOAD_CONTENT_TYPES)[number];

const UPLOAD_PREPARATION_WINDOW_MS = 15 * 60 * 1000;
const UPLOAD_PREPARATION_MAX = 30;
const recentUploadPreparations = new Map<string, number[]>();

export class SpeakingUploadRateLimitError extends Error {}

function checkUploadPreparationRateLimit(userId: string): void {
  const now = Date.now();
  const recent = (recentUploadPreparations.get(userId) ?? []).filter(
    (timestamp) => now - timestamp < UPLOAD_PREPARATION_WINDOW_MS,
  );
  if (recent.length >= UPLOAD_PREPARATION_MAX) {
    throw new SpeakingUploadRateLimitError(
      "You've submitted a lot of attempts in a short time. Please wait a bit before continuing.",
    );
  }
  recent.push(now);
  recentUploadPreparations.set(userId, recent);
}

export function normalizeSpeakingUploadMimeType(
  value: string,
): SpeakingUploadMimeType {
  const normalized = value.split(";", 1)[0]?.trim().toLowerCase() ?? "";
  const waveNormalized = normalized === "audio/wave" ? "audio/wav" : normalized;
  if (
    !SPEAKING_UPLOAD_CONTENT_TYPES.includes(
      waveNormalized as SpeakingUploadMimeType,
    )
  ) {
    throw new LearnerAudioValidationError("FORMAT");
  }
  return waveNormalized as SpeakingUploadMimeType;
}

function extensionForMimeType(
  mimeType: SpeakingUploadMimeType,
): "webm" | "ogg" | "m4a" | "wav" {
  if (mimeType === "audio/ogg") return "ogg";
  if (mimeType === "audio/mp4") return "m4a";
  if (mimeType === "audio/wav" || mimeType === "audio/x-wav") return "wav";
  return "webm";
}

export function buildSpeakingUploadKey(
  userId: string,
  sessionId: string,
  claimedMimeType: string,
  now = Date.now(),
): string {
  const mimeType = normalizeSpeakingUploadMimeType(claimedMimeType);
  return `speaking/${userId}/${sessionId}-${randomUUID()}-${now}.${extensionForMimeType(mimeType)}`;
}

export function assertOwnedSpeakingUploadKey(
  storageKey: string,
  userId: string,
  sessionId: string,
  claimedMimeType?: string,
): string {
  const normalized = normalizeStorageKey(storageKey);
  const prefix = `speaking/${userId}/${sessionId}-`;
  if (!normalized.startsWith(prefix)) {
    throw new Error("Not authorized");
  }

  const remainder = normalized.slice(prefix.length);
  const match =
    /^([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})-(\d{13})\.(webm|ogg|m4a|wav)$/i.exec(
      remainder,
    );
  if (!match) throw new Error("Not authorized");

  if (claimedMimeType) {
    const expectedExtension = extensionForMimeType(
      normalizeSpeakingUploadMimeType(claimedMimeType),
    );
    if (match[3] !== expectedExtension) {
      throw new LearnerAudioValidationError("FORMAT");
    }
  }

  return normalized;
}

async function assertOwnedSpeakingSession(
  userId: string,
  sessionId: string,
): Promise<void> {
  const session = await db.speakingSession.findFirst({
    where: { id: sessionId, userId },
    select: { id: true },
  });
  if (!session) throw new Error("Not authorized");
}

export async function prepareSpeakingUpload(
  userId: string,
  sessionId: string,
  claimedMimeType: string,
): Promise<{ pathname: string; mimeType: SpeakingUploadMimeType }> {
  await assertOwnedSpeakingSession(userId, sessionId);

  if (getStorageProvider().name !== "vercel-blob") {
    throw new Error("Direct speaking uploads are not configured.");
  }

  const mimeType = normalizeSpeakingUploadMimeType(claimedMimeType);
  return {
    pathname: buildSpeakingUploadKey(userId, sessionId, mimeType),
    mimeType,
  };
}

export async function authorizeSpeakingUploadToken(input: {
  userId: string;
  sessionId: string;
  pathname: string;
}): Promise<void> {
  await assertOwnedSpeakingSession(input.userId, input.sessionId);
  const key = assertOwnedSpeakingUploadKey(
    input.pathname,
    input.userId,
    input.sessionId,
  );
  const createdAt = parsePrivateSpeakingObjectKey(key)?.createdAt;
  if (
    !createdAt ||
    Math.abs(Date.now() - createdAt.getTime()) > SPEAKING_UPLOAD_TOKEN_TTL_MS
  ) {
    throw new Error("Invalid upload request");
  }
  checkUploadPreparationRateLimit(input.userId);
}
