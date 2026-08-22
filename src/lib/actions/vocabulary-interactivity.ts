"use server";

import { auth } from "@/lib/auth";
import {
  getOrGenerateVocabularyItemAudioUrl,
  getOrGenerateVocabularyExampleAudioUrl,
  getVocabularyExamples,
  recordVocabularyQuizAttempts,
  recordVocabularyWordSeen,
  VocabularyInteractivityRateLimitError,
  VocabularyInteractivityNotFoundError,
  type VocabularyExampleView,
  type VocabularyQuizAttemptInput,
} from "@/lib/vocabulary-interactivity";
import { TtsProviderError } from "@/lib/tts";

export type VocabularyAudioActionResult =
  { ok: true; url: string } | { ok: false; error: string };

export type VocabularyExamplesActionResult =
  | { ok: true; examples: VocabularyExampleView[] }
  | { ok: false; error: string };

function toErrorMessage(error: unknown): string {
  if (
    error instanceof VocabularyInteractivityRateLimitError ||
    error instanceof TtsProviderError
  ) {
    return error.message;
  }
  if (error instanceof VocabularyInteractivityNotFoundError) {
    return "That couldn't be found.";
  }
  return "Something went wrong. Please try again.";
}

export async function getVocabularyItemAudioAction(
  vocabularyItemId: string,
): Promise<VocabularyAudioActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "You need to be signed in to play audio." };
  }

  try {
    const url = await getOrGenerateVocabularyItemAudioUrl(
      session.user.id,
      vocabularyItemId,
    );
    return { ok: true, url };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function getVocabularyExampleAudioAction(
  exampleId: string,
): Promise<VocabularyAudioActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "You need to be signed in to play audio." };
  }

  try {
    const url = await getOrGenerateVocabularyExampleAudioUrl(
      session.user.id,
      exampleId,
    );
    return { ok: true, url };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function getVocabularyExamplesAction(
  vocabularyItemId: string,
): Promise<VocabularyExamplesActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "You need to be signed in for this." };
  }

  try {
    const examples = await getVocabularyExamples(
      session.user.id,
      vocabularyItemId,
    );
    return { ok: true, examples };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

/** Fire-and-forget from the client, once per word arrival (2026-08-19, Facet C - see vocabulary-interactivity.ts's recordVocabularyWordSeen). */
export async function recordVocabularyWordSeenAction(
  vocabularyItemId: string,
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  await recordVocabularyWordSeen(session.user.id, vocabularyItemId);
}

/**
 * Fire-and-forget from the client, once per word left (not once per
 * question - 2026-08-19, project/learning-journey-optimization.md Facet C
 * follow-up). The Vocabulary Step buffers a word's answers and flushes
 * them together via this one call instead of one call per question.
 */
export async function recordVocabularyQuizAttemptsAction(
  lessonId: string,
  attempts: VocabularyQuizAttemptInput[],
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  await recordVocabularyQuizAttempts(session.user.id, lessonId, attempts);
}
