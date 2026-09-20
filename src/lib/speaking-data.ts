import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { getStorageProvider } from "@/lib/storage";
import { getSttProvider, SttProviderError } from "@/lib/speech";
import {
  assessHanTranscript,
  HAN_STT_REPEAT_MESSAGE,
} from "@/lib/speech/transcript-quality";
import { getAiProvider, AiProviderError } from "@/lib/ai";
import { estimateCostUsd } from "@/lib/ai/cost";
import {
  recordAiUsage,
  trackAiOperation,
  estimateSttCostUsd,
  DailyUsageCapExceededError,
} from "@/lib/ai-usage";
import {
  buildSpeakingFeedbackPrompt,
  parseSpeakingFeedback,
  DEFAULT_SPEAKING_FEEDBACK,
  type SpeakingFeedback,
} from "@/lib/speaking-feedback";
import {
  recordProgressEvidence,
  getLessonCompetencyIds,
} from "@/lib/progress-evidence";
import { recomputeGeneralLevelPoints } from "@/lib/general-level";
import { checkSpeakingLabAchievements } from "@/lib/achievements";
import { hskLevelForPoints } from "@/lib/points-system";
import {
  buildCustomScenarioPrompt,
  parseCustomScenario,
  type CustomScenario,
} from "@/lib/custom-scenario-prompt";
import {
  deleteSpeakingAttemptWithPrivateObject,
  processPrivateObjectDeletionJobs,
  queuePrivateSpeakingObjectDeletion,
} from "@/lib/private-object-retention";

/** Only lesson-scoped sessions produce evidence - Competency has no scenario-level link (see progress-evidence.ts). */
async function recordSpeakingEvidence(
  userId: string,
  session: { lessonId: string | null },
  feedback: SpeakingFeedback,
  attemptId: string,
) {
  const competencyIds = await getLessonCompetencyIds(
    session.lessonId,
    "SPEAKING",
  );
  const result =
    (feedback.pronunciation +
      feedback.fluency +
      feedback.accuracy +
      feedback.complexity +
      feedback.communicationEffectiveness) /
    500;
  await recordProgressEvidence(
    userId,
    competencyIds,
    "SPEAKING",
    result,
    null,
    attemptId,
  );
}

export async function createSpeakingSession(
  userId: string,
  activityType:
    | "PRONUNCIATION"
    | "SHADOWING"
    | "GUIDED_CONVERSATION"
    | "SCENARIO_ROLE_PLAY",
  prompt: string,
  refs: { lessonId?: string; scenarioId?: string },
) {
  return db.speakingSession.create({
    data: {
      userId,
      activityType,
      prompt,
      lessonId: refs.lessonId,
      scenarioId: refs.scenarioId,
    },
  });
}

// Each attempt below triggers a paid AI feedback call (and, for recordings,
// an STT call too) - same abuse/cost protection as the AI Teacher chat and
// Mission chat (16.5 "Rate limiting").
const MAX_TEXT_LENGTH = 1000;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 15;
const recentAttemptTimestamps = new Map<string, number[]>();

export class SpeakingInputError extends Error {}
export class SpeakingRateLimitError extends Error {}

function checkRateLimit(userId: string): void {
  const now = Date.now();
  const timestamps = (recentAttemptTimestamps.get(userId) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );
  if (timestamps.length >= RATE_LIMIT_MAX_ATTEMPTS) {
    throw new SpeakingRateLimitError(
      "You've submitted a lot of attempts in a short time. Please wait a bit before continuing.",
    );
  }
  timestamps.push(now);
  recentAttemptTimestamps.set(userId, timestamps);
}

async function assertOwnedSession(userId: string, sessionId: string) {
  const session = await db.speakingSession.findUniqueOrThrow({
    where: { id: sessionId },
  });
  if (session.userId !== userId) throw new Error("Not authorized");
  return session;
}

/** Never throws for AI failure (10/8.6 pattern) - falls back to DEFAULT_SPEAKING_FEEDBACK. */
async function generateFeedback(
  userId: string,
  activityType: string,
  prompt: string,
  transcript: string,
): Promise<SpeakingFeedback> {
  try {
    const provider = getAiProvider();
    const result = await trackAiOperation(
      { userId, feature: "speaking-feedback", provider: provider.name },
      () =>
        provider.complete({
          systemPrompt: buildSpeakingFeedbackPrompt(
            activityType,
            prompt,
            transcript,
          ),
          messages: [
            { role: "user", content: transcript || "(no speech detected)" },
          ],
          maxOutputTokens: 300,
        }),
    );
    await recordAiUsage({
      userId,
      feature: "speaking-feedback",
      provider: result.provider,
      model: result.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      estimatedCostUsd: estimateCostUsd(
        result.model,
        result.inputTokens,
        result.outputTokens,
      ),
    });
    return parseSpeakingFeedback(result.content);
  } catch (error) {
    if (
      error instanceof AiProviderError ||
      error instanceof DailyUsageCapExceededError
    ) {
      return DEFAULT_SPEAKING_FEEDBACK;
    }
    throw error;
  }
}

/**
 * The core Speaking Lab pipeline (10.2-10.6): store the recording, transcribe
 * it, generate feedback, save the attempt. STT failure downgrades to an
 * empty transcript with zero confidence rather than blocking the attempt
 * (10.4 "Handle provider failure") - feedback generation still runs (on an
 * empty transcript) so the learner always gets a result.
 */
export async function submitRecording(
  userId: string,
  sessionId: string,
  audio: Buffer,
  mimeType: string,
  durationSeconds: number,
  /** Real tone-contour score computed client-side (tone-analysis.ts) - never trusted for competency evidence, see recordSpeakingEvidence. */
  toneScore: number | null = null,
) {
  checkRateLimit(userId);
  const session = await assertOwnedSession(userId, sessionId);

  const storage = getStorageProvider();
  const extension = speakingAudioExtension(mimeType);
  const key = `speaking/${userId}/${sessionId}-${Date.now()}.${extension}`;
  await storage.upload(key, audio, mimeType);

  let transcript = "";
  let confidence: number | null = null;
  try {
    const stt = getSttProvider();
    const result = await trackAiOperation(
      { userId, feature: "speaking-transcribe", provider: stt.name },
      () => stt.transcribe(audio, mimeType, "mandarin"),
    );
    await recordAiUsage({
      userId,
      feature: "speaking-transcribe",
      provider: result.provider,
      model: result.model,
      estimatedCostUsd: estimateSttCostUsd(durationSeconds),
      durationSeconds,
      durationSource: "SERVER_DECODED",
    });
    const assessment = assessHanTranscript(
      result.transcript,
      result.confidence,
    );
    if (!assessment.ok) {
      try {
        await storage.delete(key);
      } catch {
        // A cleanup failure must not turn a repeatable learner-input problem
        // into a generic submission error. Persist it for the daily retry.
        try {
          await queuePrivateSpeakingObjectDeletion({
            storageKey: key,
            ownerUserId: userId,
            reason: "FAILED_UPLOAD",
          });
        } catch {
          // The orphan scanner is the final fallback if even the outbox write
          // is temporarily unavailable.
        }
      }
      throw new SpeakingInputError(HAN_STT_REPEAT_MESSAGE);
    }
    transcript = assessment.transcript;
    confidence = result.confidence;
  } catch (error) {
    if (
      !(error instanceof SttProviderError) &&
      !(error instanceof DailyUsageCapExceededError)
    ) {
      throw error;
    }
  }

  const feedback: SpeakingFeedback = {
    ...(await generateFeedback(
      userId,
      session.activityType,
      session.prompt,
      transcript,
    )),
    toneScore,
  };

  const attempt = await db.speakingAttempt.create({
    data: {
      sessionId,
      audioFilePath: key,
      durationSeconds,
      transcript,
      transcriptionConfidence: confidence,
      feedback: feedback as unknown as Prisma.InputJsonValue,
    },
  });

  await recordSpeakingEvidence(userId, session, feedback, attempt.id);

  const profile = await db.learnerProfile.findUnique({
    where: { userId },
    select: { recordingRetentionDays: true },
  });
  if (profile?.recordingRetentionDays === 0) {
    await queuePrivateSpeakingObjectDeletion({
      storageKey: key,
      ownerUserId: userId,
      speakingAttemptId: attempt.id,
      reason: "RETENTION",
    });
    await processPrivateObjectDeletionJobs({ ownerUserId: userId });
    return db.speakingAttempt.findUniqueOrThrow({
      where: { id: attempt.id },
    });
  }

  return attempt;
}

function speakingAudioExtension(
  mimeType: string,
): "webm" | "ogg" | "m4a" | "wav" {
  if (mimeType === "audio/ogg") return "ogg";
  if (mimeType === "audio/mp4") return "m4a";
  if (mimeType === "audio/wav") return "wav";
  return "webm";
}

/** 10.2 "Provide text fallback" - no microphone/recording involved, transcript is exactly what the learner typed. */
export async function submitTextFallback(
  userId: string,
  sessionId: string,
  text: string,
) {
  if (text.trim().length === 0) {
    throw new SpeakingInputError("Response can't be empty.");
  }
  if (text.length > MAX_TEXT_LENGTH) {
    throw new SpeakingInputError(
      `Response is too long (max ${MAX_TEXT_LENGTH} characters).`,
    );
  }
  checkRateLimit(userId);
  const session = await assertOwnedSession(userId, sessionId);
  const feedback = await generateFeedback(
    userId,
    session.activityType,
    session.prompt,
    text,
  );

  const attempt = await db.speakingAttempt.create({
    data: {
      sessionId,
      transcript: text,
      transcriptionConfidence: 1,
      feedback: feedback as unknown as Prisma.InputJsonValue,
    },
  });

  await recordSpeakingEvidence(userId, session, feedback, attempt.id);

  return attempt;
}

export async function completeSpeakingSession(
  userId: string,
  sessionId: string,
) {
  await assertOwnedSession(userId, sessionId);
  const session = await db.speakingSession.update({
    where: { id: sessionId },
    data: { completionState: "COMPLETED", completedAt: new Date() },
  });
  // Points & Leveling System (2026-08-16): a newly-completed session can
  // change Speaking Lab's contribution to the General Level.
  await recomputeGeneralLevelPoints(userId);
  await checkSpeakingLabAchievements(userId);
  return session;
}

export async function getSpeakingSessionWithAttempts(
  userId: string,
  sessionId: string,
) {
  const session = await assertOwnedSession(userId, sessionId);
  const attempts = await db.speakingAttempt.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
  });
  return { session, attempts };
}

/** 10.3 "Support deletion" - removes both the stored audio file and the database row. */
export async function deleteSpeakingAttempt(userId: string, attemptId: string) {
  const attempt = await db.speakingAttempt.findUniqueOrThrow({
    where: { id: attemptId },
    include: { session: { select: { userId: true } } },
  });
  if (attempt.session.userId !== userId) throw new Error("Not authorized");

  await deleteSpeakingAttemptWithPrivateObject({
    attemptId,
    ownerUserId: userId,
    storageKey: attempt.audioFilePath,
  });
  await processPrivateObjectDeletionJobs({ ownerUserId: userId });
}

// Its own limiter, same copy-paste convention as this file's own
// checkRateLimit and ai-teacher-data.ts's - rate limiting isn't shared
// infrastructure in this codebase. Stricter and longer-windowed than a
// plain attempt submission: this is a full AI generation call, not a
// feedback pass on an already-recorded attempt, and the one real "no DB
// row" TTS precedent (welcome-audio.ts) exists only for a fixed, closed
// phrase list specifically because unrestricted generation is an
// abusable, costly surface (2026-08-31, Fase 4 plan review finding).
const SCENARIO_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const SCENARIO_RATE_LIMIT_MAX = 10;
const recentScenarioGenerations = new Map<string, number[]>();

export class SpeakingScenarioRateLimitError extends Error {}

function checkScenarioRateLimit(userId: string): void {
  const now = Date.now();
  const timestamps = (recentScenarioGenerations.get(userId) ?? []).filter(
    (t) => now - t < SCENARIO_RATE_LIMIT_WINDOW_MS,
  );
  if (timestamps.length >= SCENARIO_RATE_LIMIT_MAX) {
    throw new SpeakingScenarioRateLimitError(
      "You've generated a lot of practice scenarios recently. Please wait a bit before generating another.",
    );
  }
  timestamps.push(now);
  recentScenarioGenerations.set(userId, timestamps);
}

const MAX_SCENARIO_REQUEST_LENGTH = 300;

/**
 * Han Companion's "what do you want to practice today?" (2026-08-31,
 * Fase 4) - generates a one-off scenario from the learner's own request
 * instead of a pre-authored Mission row (missions are 100% seeded content -
 * see mission-data.ts). Deliberately never creates a SpeakingSession or
 * touches points/achievements (user decision, 2026-08-31): Han Companion is
 * pure practice, same no-pressure spirit as its whole Practice-mode
 * personality (ai-context.ts) - the generated scenario only ever becomes a
 * RolePlayContext fed straight into a live conversation. Never throws for
 * AI failure (same 8.6 pattern as generateFeedback above) - returns null so
 * the caller can show a plain "couldn't generate that, try again" message
 * instead of crashing the page.
 */
export async function generateCustomScenario(
  userId: string,
  learnerRequest: string,
  learnerLevel: number | null | undefined,
  knownFacts: string[],
): Promise<CustomScenario | null> {
  const trimmed = learnerRequest.trim();
  if (trimmed.length === 0) {
    throw new SpeakingInputError("Tell Han what you'd like to practice.");
  }
  if (trimmed.length > MAX_SCENARIO_REQUEST_LENGTH) {
    throw new SpeakingInputError(
      `That's too long (max ${MAX_SCENARIO_REQUEST_LENGTH} characters).`,
    );
  }
  checkScenarioRateLimit(userId);

  try {
    const provider = getAiProvider();
    const result = await trackAiOperation(
      { userId, feature: "speaking-scenario", provider: provider.name },
      () =>
        provider.complete({
          systemPrompt: buildCustomScenarioPrompt(
            trimmed,
            hskLevelForPoints(learnerLevel ?? 0),
            knownFacts,
          ),
          messages: [{ role: "user", content: trimmed }],
          maxOutputTokens: 400,
        }),
    );
    await recordAiUsage({
      userId,
      feature: "speaking-scenario",
      provider: result.provider,
      model: result.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      estimatedCostUsd: estimateCostUsd(
        result.model,
        result.inputTokens,
        result.outputTokens,
      ),
    });
    return parseCustomScenario(result.content);
  } catch (error) {
    if (
      error instanceof AiProviderError ||
      error instanceof DailyUsageCapExceededError
    ) {
      return null;
    }
    throw error;
  }
}
