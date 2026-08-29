"use server";

import { auth } from "@/lib/auth";
import {
  getOrGenerateWelcomeAudioUrl,
  WelcomeAudioNotAllowedError,
  WelcomeAudioRateLimitError,
} from "@/lib/welcome-audio";
import { TtsProviderError } from "@/lib/tts";

export type WelcomeAudioActionResult =
  { ok: true; url: string } | { ok: false; error: string };

function toErrorMessage(error: unknown): string {
  if (
    error instanceof WelcomeAudioRateLimitError ||
    error instanceof TtsProviderError
  ) {
    return error.message;
  }
  if (error instanceof WelcomeAudioNotAllowedError) {
    return "That couldn't be played.";
  }
  return "Something went wrong. Please try again.";
}

export async function getWelcomeAudioAction(
  text: string,
): Promise<WelcomeAudioActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "You need to be signed in to play audio." };
  }

  try {
    const url = await getOrGenerateWelcomeAudioUrl(session.user.id, text);
    return { ok: true, url };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}
