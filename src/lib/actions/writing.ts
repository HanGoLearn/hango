"use server";

import { auth } from "@/lib/auth";
import {
  getOrCreateDraftAttempt,
  saveDraft,
  submitWritingAttempt,
  createRewriteAttempt,
  submitCustomWriting,
  WritingRateLimitError,
  WritingInputError,
} from "@/lib/writing-data";
import type {
  WritingFeedback,
  CustomWritingCharacteristics,
} from "@/lib/writing-feedback";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

const MAX_DRAFT_LENGTH = 2000;

export async function getOrCreateDraftAttemptAction(
  taskId: string,
): Promise<{ attemptId: string; draft: string }> {
  const userId = await requireUserId();
  const attempt = await getOrCreateDraftAttempt(userId, taskId);
  return { attemptId: attempt.id, draft: attempt.draft };
}

export async function saveDraftAction(
  attemptId: string,
  draft: string,
): Promise<void> {
  const userId = await requireUserId();
  if (draft.length > MAX_DRAFT_LENGTH) {
    throw new Error(`Draft is too long (max ${MAX_DRAFT_LENGTH} characters).`);
  }
  await saveDraft(userId, attemptId, draft);
}

export interface SubmitWritingResult {
  correctedVersion: string | null;
  feedback: WritingFeedback;
}

/** Never throws for a rate-limit failure (same pattern as AI Teacher/Mission/Speaking) - a burst of submissions used to hit Next's generic error boundary instead of an inline message. */
export type SubmitWritingActionResult =
  { ok: true; result: SubmitWritingResult } | { ok: false; error: string };

export async function submitWritingAttemptAction(
  attemptId: string,
): Promise<SubmitWritingActionResult> {
  const userId = await requireUserId();
  try {
    const attempt = await submitWritingAttempt(userId, attemptId);
    return {
      ok: true,
      result: {
        correctedVersion: attempt.correctedVersion,
        feedback: attempt.feedback as unknown as WritingFeedback,
      },
    };
  } catch (error) {
    if (error instanceof WritingRateLimitError) {
      return { ok: false, error: error.message };
    }
    return {
      ok: false,
      error: "Something went wrong submitting your writing. Please try again.",
    };
  }
}

export async function createRewriteAttemptAction(
  attemptId: string,
): Promise<{ attemptId: string }> {
  const userId = await requireUserId();
  const attempt = await createRewriteAttempt(userId, attemptId);
  return { attemptId: attempt.id };
}

export type SubmitCustomWritingResult =
  { ok: true; feedback: WritingFeedback } | { ok: false; error: string };

/** Never throws for rate-limit/validation/AI failure - same "an error shows an inline message, not a crash" pattern as every other Writing Lab action. */
export async function submitCustomWritingAction(
  characteristics: CustomWritingCharacteristics,
  text: string,
): Promise<SubmitCustomWritingResult> {
  const userId = await requireUserId();
  try {
    const feedback = await submitCustomWriting(userId, characteristics, text);
    return { ok: true, feedback };
  } catch (error) {
    if (error instanceof WritingRateLimitError || error instanceof WritingInputError) {
      return { ok: false, error: error.message };
    }
    return {
      ok: false,
      error: "Something went wrong submitting your writing. Please try again.",
    };
  }
}
