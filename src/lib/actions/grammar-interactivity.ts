"use server";

import { auth } from "@/lib/auth";
import {
  getOrGenerateGrammarExampleAudioUrl,
  getGrammarExamples,
  getGrammarExercises,
  GrammarInteractivityRateLimitError,
  GrammarInteractivityNotFoundError,
  type GrammarExampleView,
} from "@/lib/grammar-interactivity";
import { toClientExercise, type ClientExercise } from "@/lib/exercise-progress";
import { TtsProviderError } from "@/lib/tts";

export type GrammarAudioActionResult =
  { ok: true; url: string } | { ok: false; error: string };

export type GrammarExamplesActionResult =
  { ok: true; examples: GrammarExampleView[] } | { ok: false; error: string };

export type GrammarExercisesActionResult =
  { ok: true; exercises: ClientExercise[] } | { ok: false; error: string };

function toErrorMessage(error: unknown): string {
  if (
    error instanceof GrammarInteractivityRateLimitError ||
    error instanceof TtsProviderError
  ) {
    return error.message;
  }
  if (error instanceof GrammarInteractivityNotFoundError) {
    return "That couldn't be found.";
  }
  return "Something went wrong. Please try again.";
}

async function requireUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function getGrammarExampleAudioAction(
  exampleId: string,
): Promise<GrammarAudioActionResult> {
  const userId = await requireUserId();
  if (!userId) {
    return { ok: false, error: "You need to be signed in to play audio." };
  }
  try {
    const url = await getOrGenerateGrammarExampleAudioUrl(userId, exampleId);
    return { ok: true, url };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function getGrammarExamplesAction(
  grammarPointId: string,
): Promise<GrammarExamplesActionResult> {
  const userId = await requireUserId();
  if (!userId) {
    return { ok: false, error: "You need to be signed in for this." };
  }
  try {
    const examples = await getGrammarExamples(grammarPointId);
    return { ok: true, examples };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function getGrammarExercisesAction(
  grammarPointId: string,
): Promise<GrammarExercisesActionResult> {
  const userId = await requireUserId();
  if (!userId) {
    return { ok: false, error: "You need to be signed in for this." };
  }
  try {
    const exercises = await getGrammarExercises(grammarPointId);
    return { ok: true, exercises: exercises.map((e) => toClientExercise(e)) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}
