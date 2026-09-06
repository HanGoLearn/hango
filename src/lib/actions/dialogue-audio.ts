"use server";

import { auth } from "@/lib/auth";
import {
  getOrGenerateDialogueLineAudioUrl,
  getOrGenerateDialogueAudioUrl,
  DialogueAudioRateLimitError,
  DialogueAudioNotFoundError,
} from "@/lib/dialogue-audio";
import { TtsProviderError } from "@/lib/tts";
import { DailyUsageCapExceededError } from "@/lib/ai-usage";

export type DialogueLineAudioActionResult =
  { ok: true; url: string } | { ok: false; error: string };

function toErrorResult(error: unknown): DialogueLineAudioActionResult {
  if (
    error instanceof DialogueAudioRateLimitError ||
    error instanceof DailyUsageCapExceededError ||
    error instanceof TtsProviderError
  ) {
    return { ok: false, error: error.message };
  }
  if (error instanceof DialogueAudioNotFoundError) {
    return { ok: false, error: "That couldn't be found." };
  }
  return {
    ok: false,
    error: "Couldn't generate audio. Please try again.",
  };
}

export async function getDialogueLineAudioAction(
  lineId: string,
): Promise<DialogueLineAudioActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "You need to be signed in to play audio." };
  }

  try {
    const url = await getOrGenerateDialogueLineAudioUrl(
      session.user.id,
      lineId,
    );
    return { ok: true, url };
  } catch (error) {
    return toErrorResult(error);
  }
}

/** Full-conversation, seekable audio (Dialogue.audioFilePath) - see src/lib/dialogue-audio.ts. */
export async function getDialogueAudioAction(
  dialogueId: string,
): Promise<DialogueLineAudioActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "You need to be signed in to play audio." };
  }

  try {
    const url = await getOrGenerateDialogueAudioUrl(
      session.user.id,
      dialogueId,
    );
    return { ok: true, url };
  } catch (error) {
    return toErrorResult(error);
  }
}
