"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  createSpeakingSession,
  submitRecording,
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

function speakingErrorMessage(error: unknown): string {
  if (error instanceof SpeakingInputError) return error.message;
  if (error instanceof SpeakingRateLimitError) return error.message;
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

const MAX_AUDIO_BYTES = 15 * 1024 * 1024;
const MAX_AUDIO_DURATION_SECONDS = 5 * 60;

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
      maxBytes: MAX_AUDIO_BYTES,
      maxDurationSeconds: MAX_AUDIO_DURATION_SECONDS,
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
