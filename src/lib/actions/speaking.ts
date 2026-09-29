"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  createSpeakingSession,
  discardUnclaimedSpeakingUpload,
  submitRecording,
  submitUploadedRecording,
  submitTextFallback,
  completeSpeakingSession,
  deleteSpeakingAttempt,
  generateCustomScenario,
  SpeakingInputError,
  SpeakingRateLimitError,
  SpeakingScenarioRateLimitError,
} from "@/lib/speaking-data";
import { getStorageProvider } from "@/lib/storage";
import type { SpeakingFeedback } from "@/lib/speaking-feedback";
import type { CustomScenario } from "@/lib/custom-scenario-prompt";
import {
  LearnerAudioValidationError,
  validateLearnerAudio,
} from "@/lib/media-validation";
import {
  assertOwnedSpeakingUploadKey,
  MAX_SPEAKING_AUDIO_BYTES,
  MAX_SPEAKING_AUDIO_DURATION_SECONDS,
  prepareSpeakingUpload,
  SpeakingUploadRateLimitError,
} from "@/lib/speaking-upload";

function speakingErrorMessage(error: unknown): string {
  if (error instanceof SpeakingInputError) return error.message;
  if (error instanceof SpeakingRateLimitError) return error.message;
  if (error instanceof SpeakingUploadRateLimitError) return error.message;
  if (error instanceof SpeakingScenarioRateLimitError) return error.message;
  if (error instanceof LearnerAudioValidationError) return error.message;
  if (error instanceof Error && error.message === "Recording is too large.") {
    return error.message;
  }
  if (
    error instanceof Error &&
    error.message === "Unsupported recording format."
  ) {
    return error.message;
  }
  return "Something went wrong submitting your attempt. Please try again.";
}

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export async function createSpeakingSessionAction(
  activityType:
    | "PRONUNCIATION"
    | "SHADOWING"
    | "GUIDED_CONVERSATION"
    | "SCENARIO_ROLE_PLAY",
  prompt: string,
  refs: { lessonId?: string; scenarioId?: string },
): Promise<{ sessionId: string }> {
  const userId = await requireUserId();
  const session = await createSpeakingSession(
    userId,
    activityType,
    prompt,
    refs,
  );
  return { sessionId: session.id };
}

export interface SpeakingAttemptResult {
  transcript: string;
  audioUrl: string | null;
  feedback: SpeakingFeedback;
}

/**
 * Never throws for validation/rate-limit/AI failure (same pattern as AI
 * Teacher/Mission) - an oversized recording or a burst of retries used to
 * hit Next's generic error boundary instead of an inline message.
 */
export type SubmitSpeakingResult =
  { ok: true; result: SpeakingAttemptResult } | { ok: false; error: string };

export async function submitRecordingAction(
  sessionId: string,
  formData: FormData,
): Promise<SubmitSpeakingResult> {
  const userId = await requireUserId();

  try {
    const audioFile = formData.get("audio");
    if (!(audioFile instanceof Blob)) {
      throw new Error("Missing audio recording");
    }

    const rawToneScore = formData.get("toneScore");
    const toneScore =
      typeof rawToneScore === "string" && rawToneScore !== ""
        ? Number(rawToneScore)
        : null;

    const buffer = Buffer.from(await audioFile.arrayBuffer());
    const audio = await validateLearnerAudio(buffer, audioFile.type, {
      maxBytes: MAX_SPEAKING_AUDIO_BYTES,
      maxDurationSeconds: MAX_SPEAKING_AUDIO_DURATION_SECONDS,
    });
    const attempt = await submitRecording(
      userId,
      sessionId,
      audio.buffer,
      audio.mimeType,
      audio.durationSeconds,
      Number.isFinite(toneScore) ? toneScore : null,
    );

    const audioUrl = attempt.audioFilePath
      ? await getStorageProvider().getUrl(attempt.audioFilePath)
      : null;

    return {
      ok: true,
      result: {
        transcript: attempt.transcript ?? "",
        audioUrl,
        feedback: attempt.feedback as unknown as SpeakingFeedback,
      },
    };
  } catch (error) {
    return { ok: false, error: speakingErrorMessage(error) };
  }
}

export type PrepareSpeakingUploadResult =
  | { ok: true; pathname: string; mimeType: string }
  | { ok: false; error: string };

export async function prepareSpeakingUploadAction(
  sessionId: string,
  claimedMimeType: string,
): Promise<PrepareSpeakingUploadResult> {
  const userId = await requireUserId();
  try {
    const target = await prepareSpeakingUpload(
      userId,
      sessionId,
      claimedMimeType,
    );
    return { ok: true, ...target };
  } catch (error) {
    return { ok: false, error: speakingErrorMessage(error) };
  }
}

export async function submitUploadedRecordingAction(
  sessionId: string,
  input: {
    storageKey: string;
    claimedMimeType: string;
    toneScore: number | null;
  },
): Promise<SubmitSpeakingResult> {
  const userId = await requireUserId();
  let ownedStorageKey: string | null = null;

  try {
    ownedStorageKey = assertOwnedSpeakingUploadKey(
      input.storageKey,
      userId,
      sessionId,
      input.claimedMimeType,
    );
    const buffer = await getStorageProvider().download(ownedStorageKey);
    const audio = await validateLearnerAudio(buffer, input.claimedMimeType, {
      maxBytes: MAX_SPEAKING_AUDIO_BYTES,
      maxDurationSeconds: MAX_SPEAKING_AUDIO_DURATION_SECONDS,
    });
    const toneScore =
      typeof input.toneScore === "number" &&
      Number.isFinite(input.toneScore) &&
      input.toneScore >= 0 &&
      input.toneScore <= 100
        ? input.toneScore
        : null;
    const attempt = await submitUploadedRecording(
      userId,
      sessionId,
      ownedStorageKey,
      audio.buffer,
      audio.mimeType,
      audio.durationSeconds,
      toneScore,
    );
    const audioUrl = attempt.audioFilePath
      ? await getStorageProvider().getUrl(attempt.audioFilePath)
      : null;

    return {
      ok: true,
      result: {
        transcript: attempt.transcript ?? "",
        audioUrl,
        feedback: attempt.feedback as unknown as SpeakingFeedback,
      },
    };
  } catch (error) {
    if (ownedStorageKey) {
      try {
        await discardUnclaimedSpeakingUpload(
          userId,
          sessionId,
          ownedStorageKey,
        );
      } catch {
        // The daily orphan scan is the final cleanup path when both direct
        // deletion and its durable outbox are temporarily unavailable.
      }
    }
    return { ok: false, error: speakingErrorMessage(error) };
  }
}

export async function submitTextFallbackAction(
  sessionId: string,
  text: string,
): Promise<SubmitSpeakingResult> {
  const userId = await requireUserId();

  try {
    const attempt = await submitTextFallback(userId, sessionId, text);
    return {
      ok: true,
      result: {
        transcript: attempt.transcript ?? "",
        audioUrl: null,
        feedback: attempt.feedback as unknown as SpeakingFeedback,
      },
    };
  } catch (error) {
    return { ok: false, error: speakingErrorMessage(error) };
  }
}

export async function completeSpeakingSessionAction(
  sessionId: string,
): Promise<void> {
  const userId = await requireUserId();
  await completeSpeakingSession(userId, sessionId);
}

export async function deleteSpeakingAttemptAction(
  attemptId: string,
): Promise<void> {
  const userId = await requireUserId();
  await deleteSpeakingAttempt(userId, attemptId);
}

export type GenerateCustomScenarioResult =
  { ok: true; scenario: CustomScenario } | { ok: false; error: string };

/**
 * Han Companion's "what do you want to practice today?" (2026-08-31,
 * Fase 4). Never throws for validation/rate-limit/AI failure - same
 * ok/error pattern as every other Speaking/AI Teacher action.
 */
export async function generateCustomScenarioAction(
  learnerRequest: string,
): Promise<GenerateCustomScenarioResult> {
  const userId = await requireUserId();

  try {
    const [profile, facts] = await Promise.all([
      db.learnerProfile.findUnique({
        where: { userId },
        select: { generalLevelPoints: true },
      }),
      db.learnerFact.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        take: 8,
        select: { fact: true },
      }),
    ]);
    const scenario = await generateCustomScenario(
      userId,
      learnerRequest,
      profile?.generalLevelPoints,
      facts.map((row) => row.fact),
    );
    if (!scenario) {
      return {
        ok: false,
        error:
          "Han couldn't come up with a scenario for that. Try rephrasing it.",
      };
    }
    return { ok: true, scenario };
  } catch (error) {
    return { ok: false, error: speakingErrorMessage(error) };
  }
}
