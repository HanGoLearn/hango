import "server-only";

import { createHash } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { recomputeGeneralLevelPoints } from "@/lib/general-level";
import { checkWritingLabAchievements } from "@/lib/achievements";
import {
  HANDWRITTEN_LEVEL_CONFIG,
  HANDWRITTEN_TOPIC_CONFIG,
  type HandwrittenLevel,
  type HandwrittenSubmissionResult,
  type HandwrittenTopic,
} from "@/lib/handwritten-writing";
import {
  evaluateHandwrittenWriting,
  HANDWRITTEN_EVALUATION_MODEL,
} from "@/lib/handwritten-writing-evaluator";
import { estimateCostUsd } from "@/lib/ai/cost";
import { recordAiUsage, trackAiOperation } from "@/lib/ai-usage";

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_SUBMISSIONS = 4;
const DEDUPE_WINDOW_MS = 60 * 1000;
const recentSubmissionTimestamps = new Map<string, number[]>();
const recentResults = new Map<
  string,
  { createdAt: number; result: HandwrittenSubmissionResult }
>();
const inFlightSubmissions = new Map<
  string,
  Promise<HandwrittenSubmissionResult>
>();

export class HandwrittenRateLimitError extends Error {}

function checkRateLimit(userId: string): void {
  const now = Date.now();
  const timestamps = (recentSubmissionTimestamps.get(userId) ?? []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS,
  );
  if (timestamps.length >= RATE_LIMIT_MAX_SUBMISSIONS) {
    throw new HandwrittenRateLimitError(
      "You've submitted several photo evaluations. Please wait a few minutes before trying again.",
    );
  }
  timestamps.push(now);
  recentSubmissionTimestamps.set(userId, timestamps);
}

function submissionFingerprint(
  userId: string,
  level: HandwrittenLevel,
  topic: HandwrittenTopic,
  images: { bytes: ArrayBuffer }[],
): string {
  const hash = createHash("sha256");
  hash.update(userId);
  hash.update(level);
  hash.update(topic);
  for (const image of images) hash.update(Buffer.from(image.bytes));
  return hash.digest("hex");
}

async function evaluateAndPersist(
  userId: string,
  level: HandwrittenLevel,
  topic: HandwrittenTopic,
  images: { mimeType: string; bytes: ArrayBuffer }[],
): Promise<HandwrittenSubmissionResult> {
  checkRateLimit(userId);
  const { result, transcription, usage } = await trackAiOperation(
    {
      userId,
      feature: "handwritten-writing",
      provider: "openai",
      model: HANDWRITTEN_EVALUATION_MODEL,
    },
    () => evaluateHandwrittenWriting(userId, level, topic, images),
  );
  // Recorded regardless of readable/unreadable - the vision call itself
  // already happened and cost money either way.
  if (usage) {
    await recordAiUsage({
      userId,
      feature: "handwritten-writing",
      provider: "openai",
      model: HANDWRITTEN_EVALUATION_MODEL,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      estimatedCostUsd: estimateCostUsd(
        HANDWRITTEN_EVALUATION_MODEL,
        usage.inputTokens,
        usage.outputTokens,
      ),
    });
  }

  if (result.readable && transcription) {
    const levelConfig = HANDWRITTEN_LEVEL_CONFIG[level];
    const topicConfig = HANDWRITTEN_TOPIC_CONFIG[topic];
    await db.writingAttempt.create({
      data: {
        userId,
        taskId: null,
        customPrompt: {
          kind: "HANDWRITTEN_PARAGRAPH",
          level,
          topic: topicConfig.label,
          prompt: topicConfig.prompts[level],
          characterTarget: levelConfig.characterTarget,
        } as unknown as Prisma.InputJsonValue,
        draft: transcription,
        submittedResponse: transcription,
        submittedAt: new Date(),
        feedback: result.evaluation as unknown as Prisma.InputJsonValue,
        correctedVersion: result.evaluation.correctedVersion,
      },
    });
    await recomputeGeneralLevelPoints(userId);
    await checkWritingLabAchievements(userId);
  }

  return result;
}

/**
 * Photo evaluation has its own tighter paid-call limit. Identical accidental
 * submissions share one in-flight call and reuse its result briefly instead
 * of creating duplicate OpenAI usage and duplicate attempts.
 */
export async function submitHandwrittenWriting(
  userId: string,
  level: HandwrittenLevel,
  topic: HandwrittenTopic,
  images: { mimeType: string; bytes: ArrayBuffer }[],
): Promise<HandwrittenSubmissionResult> {
  const fingerprint = submissionFingerprint(userId, level, topic, images);
  const cached = recentResults.get(fingerprint);
  if (cached && Date.now() - cached.createdAt < DEDUPE_WINDOW_MS) {
    return cached.result;
  }

  const inFlight = inFlightSubmissions.get(fingerprint);
  if (inFlight) return inFlight;

  const submission = evaluateAndPersist(userId, level, topic, images)
    .then((result) => {
      recentResults.set(fingerprint, { createdAt: Date.now(), result });
      return result;
    })
    .finally(() => inFlightSubmissions.delete(fingerprint));
  inFlightSubmissions.set(fingerprint, submission);
  return submission;
}
