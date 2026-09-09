"use server";

import { auth } from "@/lib/auth";
import {
  getNextQuestion,
  loadAttempts,
  maybeCompleteSession,
  PlacementExamNotFoundError,
  recordPlacementTimeout,
  startPlacementSession,
  submitPlacementAnswer,
  submitPlacementQuestionBlock,
  type PlacementAnswer,
  type PlacementQuestionView,
  type PlacementResult,
} from "@/lib/placement-exam-data";
import {
  getOrGeneratePlacementListeningAudioUrl,
  PlacementAudioNotFoundError,
  PlacementAudioRateLimitError,
} from "@/lib/placement-listening-audio";
import { TtsProviderError } from "@/lib/tts";
import { getAiProvider } from "@/lib/ai";
import { estimateCostUsd } from "@/lib/ai/cost";
import {
  recordAiUsage,
  DailyUsageCapExceededError,
  trackAiOperation,
} from "@/lib/ai-usage";
import type { SpeakingTranscriptMessage } from "@/lib/reflection-prompt";
import {
  buildPlacementSpeakingEvaluationPrompt,
  parsePlacementSpeakingEvaluation,
  PLACEMENT_SPEAKING_SCENARIOS,
  type PlacementSpeakingEvaluation,
  type PlacementSpeakingLevel,
} from "@/lib/placement-speaking";
import {
  applyPlacementCredit,
  type PlacementSpeakingAttemptForCredit,
} from "@/lib/placement-credit";

export type PlacementActionResult<T> =
  { ok: true; value: T } | { ok: false; error: string };

// Its own limiter, same copy-paste convention as speaking-data.ts's
// checkScenarioRateLimit and every other AI-cost file in this codebase -
// rate limiting isn't shared infrastructure here. This call had NO
// limiter at all until the 2026-09-05 cost audit found it (1,800 tokens +
// 45s timeout, the single most expensive per-call budget of any text
// completion in the app) - window/max mirrors speaking-data.ts's own
// precedent for a comparably costly full AI generation call.
export class PlacementSpeakingGradingRateLimitError extends Error {}

const GRADING_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const GRADING_RATE_LIMIT_MAX = 10;
const recentGradingTimestamps = new Map<string, number[]>();

function checkGradingRateLimit(userId: string): void {
  const now = Date.now();
  const timestamps = (recentGradingTimestamps.get(userId) ?? []).filter(
    (t) => now - t < GRADING_RATE_LIMIT_WINDOW_MS,
  );
  if (timestamps.length >= GRADING_RATE_LIMIT_MAX) {
    throw new PlacementSpeakingGradingRateLimitError(
      "You've requested a lot of speaking evaluations recently. Please wait a bit before trying again.",
    );
  }
  timestamps.push(now);
  recentGradingTimestamps.set(userId, timestamps);
}

function toErrorMessage(error: unknown): string {
  if (
    error instanceof PlacementAudioRateLimitError ||
    error instanceof DailyUsageCapExceededError ||
    error instanceof TtsProviderError
  ) {
    return error.message;
  }
  if (
    error instanceof PlacementExamNotFoundError ||
    error instanceof PlacementAudioNotFoundError
  ) {
    return "That couldn't be found.";
  }
  return "Something went wrong. Please try again.";
}

export async function startPlacementExamAction(): Promise<
  PlacementActionResult<{
    sessionId: string;
    question: PlacementQuestionView | null;
  }>
> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      ok: false,
      error: "You need to be signed in to start the placement exam.",
    };
  }
  try {
    const sessionId = await startPlacementSession(session.user.id);
    const question = await getNextQuestion(sessionId);
    return { ok: true, value: { sessionId, question } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

type AdvanceResult = PlacementActionResult<{
  isCorrect: boolean;
  nextQuestion: PlacementQuestionView | null;
  result: PlacementResult;
}>;

async function advanceAfterAttempt(
  sessionId: string,
  isCorrect: boolean,
): Promise<AdvanceResult> {
  // Fetch attempts once and compute the next question once, then hand
  // both to maybeCompleteSession instead of letting it recompute the same
  // two things internally - this (plus the getNextQuestion de-dupe) cuts
  // real per-answer database cost by roughly half.
  const attempts = await loadAttempts(sessionId);
  const nextQuestion = await getNextQuestion(sessionId, attempts);
  const result = await maybeCompleteSession(sessionId, nextQuestion, attempts);
  return { ok: true, value: { isCorrect, nextQuestion, result } };
}

export async function submitPlacementAnswerAction(
  sessionId: string,
  questionId: string,
  answer: PlacementAnswer,
): Promise<AdvanceResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "You need to be signed in for this." };
  }
  try {
    const { isCorrect } = await submitPlacementAnswer(
      sessionId,
      questionId,
      answer,
    );
    return await advanceAfterAttempt(sessionId, isCorrect);
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

/** HSK1-2's 10s-per-question limit ran out with nothing submitted - see placement-exam-data.ts's recordPlacementTimeout. */
export async function recordPlacementTimeoutAction(
  sessionId: string,
  questionId: string,
): Promise<AdvanceResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "You need to be signed in for this." };
  }
  try {
    await recordPlacementTimeout(sessionId, questionId);
    return await advanceAfterAttempt(sessionId, false);
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

/**
 * Submits every answer in a Reading or Listening block at once (see
 * PlacementQuestionView.questionGroup) - one action call for the whole
 * passage/audio, whether it's a real submit or the block's timer running
 * out (unanswered questions pass `optionId: null`).
 */
export async function submitPlacementQuestionBlockAction(
  sessionId: string,
  answers: { questionId: string; optionId: string | null }[],
): Promise<AdvanceResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "You need to be signed in for this." };
  }
  try {
    await submitPlacementQuestionBlock(sessionId, answers);
    return await advanceAfterAttempt(sessionId, true);
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function getPlacementListeningAudioAction(
  questionId: string,
): Promise<PlacementActionResult<{ url: string }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "You need to be signed in to play audio." };
  }
  try {
    const url = await getOrGeneratePlacementListeningAudioUrl(
      session.user.id,
      questionId,
    );
    return { ok: true, value: { url } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function gradePlacementSpeakingAction(
  level: PlacementSpeakingLevel,
  transcript: SpeakingTranscriptMessage[],
  learnerTurnConfidences: number[],
): Promise<PlacementActionResult<PlacementSpeakingEvaluation>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "You need to be signed in for this." };
  }
  const scenario = PLACEMENT_SPEAKING_SCENARIOS[level];
  if (!scenario) return { ok: false, error: "That speaking level is invalid." };

  const safeTranscript = transcript
    .slice(0, 20)
    .filter(
      (message) =>
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string",
    )
    .map((message) => ({
      role: message.role,
      content: message.content.trim().slice(0, 600),
    }))
    .filter((message) => message.content.length > 0);
  const safeConfidences = learnerTurnConfidences
    .filter(
      (value) =>
        typeof value === "number" &&
        Number.isFinite(value) &&
        value >= 0 &&
        value <= 1,
    )
    .slice(0, 10);

  try {
    checkGradingRateLimit(session.user.id);
    const provider = getAiProvider();
    const result = await trackAiOperation(
      {
        userId: session.user.id,
        feature: "placement-grading",
        provider: provider.name,
      },
      () =>
        provider.complete({
          systemPrompt: buildPlacementSpeakingEvaluationPrompt(
            scenario,
            safeTranscript,
            safeConfidences,
          ),
          messages: [
            {
              role: "user",
              content: "Grade this placement speaking attempt now.",
            },
          ],
          maxOutputTokens: 1_800,
          timeoutMs: 45_000,
        }),
    );
    await recordAiUsage({
      userId: session.user.id,
      feature: "placement-grading",
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
    return {
      ok: true,
      value: parsePlacementSpeakingEvaluation(result.content),
    };
  } catch (error) {
    if (error instanceof PlacementSpeakingGradingRateLimitError) {
      return { ok: false, error: error.message };
    }
    if (error instanceof DailyUsageCapExceededError) {
      return { ok: false, error: error.message };
    }
    return {
      ok: false,
      error:
        "Speaking evaluation is temporarily unavailable. Please try this level again.",
    };
  }
}

/**
 * Applies General Level point credit for a just-finished placement session
 * (2026-08-24, "How placement results become real Learning Journey
 * credit" - project/TASKS.md). Called once from PlacementExamHome right
 * when the result screen appears - safe to call more than once for the
 * same session (applyPlacementCredit skips lessons already completed).
 */
export async function applyPlacementCreditAction(
  sessionId: string,
  speakingCreditedLevel: number | null,
  speakingAttempts: PlacementSpeakingAttemptForCredit[],
): Promise<PlacementActionResult<{ creditedLessonCount: number }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "You need to be signed in for this." };
  }
  try {
    const result = await applyPlacementCredit(
      session.user.id,
      sessionId,
      speakingCreditedLevel,
      speakingAttempts,
    );
    return {
      ok: true,
      value: { creditedLessonCount: result?.creditedLessonCount ?? 0 },
    };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}
