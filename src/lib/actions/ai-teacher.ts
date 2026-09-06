"use server";

import { auth } from "@/lib/auth";
import {
  sendAiTeacherMessage,
  resetConversation,
  saveRealtimeConversationTurn,
  saveRealtimeConversationMessage,
  saveRealtimeSpeakingEvidence,
  AiTeacherInputError,
  AiTeacherRateLimitError,
  AiProviderError,
} from "@/lib/ai-teacher-data";
import {
  DailyUsageCapExceededError,
  checkDailyUsageCap,
  recordAiUsage,
  estimateSttCostUsd,
  estimateAudioDurationSecondsFromBytes,
} from "@/lib/ai-usage";
import type { AiTeacherContext, AiTeacherMode } from "@/lib/ai-context";
import { getSttProvider, SttProviderError } from "@/lib/speech";
import {
  assessHanTranscript,
  HAN_STT_REPEAT_MESSAGE,
} from "@/lib/speech/transcript-quality";
import { getHanOnDemandAppContext } from "@/lib/han-app-context-data";
import {
  sanitizeSpeakingTurnEvidence,
  type SpeakingTurnEvidence,
} from "@/lib/speech/speaking-pronunciation-evidence";

const MAX_HAN_AUDIO_BYTES = 10 * 1024 * 1024;

export type SendAiTeacherMessageResult =
  | {
      ok: true;
      reply: string;
      responseLanguage: "English" | "Spanish" | "Chinese";
    }
  | { ok: false; error: string };

/**
 * Never throws for AI/validation/rate-limit failures (8.6 "Ensure AI
 * failure does not block lesson completion") - those come back as
 * `{ ok: false, error }` for the chat UI to show inline with a retry
 * option, instead of surfacing Next's error boundary over the whole page.
 * Only an actual auth failure throws, consistent with every other action.
 */
export async function sendAiTeacherMessageAction(
  message: string,
  context: AiTeacherContext,
  mode: AiTeacherMode,
): Promise<SendAiTeacherMessageResult> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  try {
    const { reply, responseLanguage } = await sendAiTeacherMessage(
      session.user.id,
      message,
      context,
      mode,
    );
    return { ok: true, reply, responseLanguage };
  } catch (error) {
    if (error instanceof AiTeacherInputError) {
      return { ok: false, error: error.message };
    }
    if (error instanceof AiTeacherRateLimitError) {
      return { ok: false, error: error.message };
    }
    if (error instanceof DailyUsageCapExceededError) {
      return { ok: false, error: error.message };
    }
    if (error instanceof AiProviderError) {
      return { ok: false, error: error.message };
    }
    return {
      ok: false,
      error: "Something went wrong reaching Han. Please try again.",
    };
  }
}

/**
 * `extractFacts` (2026-08-31) - only Han Companion should ever pass `true`.
 * Defaults to `false` so every other caller (Han Tutor, the floating
 * bubble, any future "Ask AI" entry point) never extracts personal-memory
 * facts, matching the already-agreed rule that Tutor never remembers
 * across sessions.
 */
export async function resetAiTeacherConversationAction(
  extractFacts = false,
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  await resetConversation(session.user.id, extractFacts);
}

/**
 * Realtime voice calls this only after the client-side deterministic intent
 * gate finds an app question. The resolver repeats the gate server-side and
 * returns one-turn context; unrelated voice turns never call this action.
 */
export async function getHanOnDemandAppContextAction(
  message: string,
  currentPageName?: string,
): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const trimmed = message.trim().slice(0, 1000);
  if (!trimmed) return null;
  return getHanOnDemandAppContext(
    session.user.id,
    trimmed,
    currentPageName?.trim().slice(0, 100),
  );
}

export async function saveRealtimeConversationTurnAction(
  userText: string,
  assistantText: string,
  context: AiTeacherContext,
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const user = userText.trim().slice(0, 1000);
  const assistant = assistantText.trim().slice(0, 4000);
  if (!user || !assistant) return;
  await saveRealtimeConversationTurn(session.user.id, user, assistant, context);
}

export async function saveRealtimeConversationMessageAction(
  role: "USER" | "ASSISTANT",
  content: string,
  context: AiTeacherContext,
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const trimmed = content.trim().slice(0, 4000);
  if (!trimmed) return;
  await saveRealtimeConversationMessage(
    session.user.id,
    role,
    trimmed,
    context,
  );
}

export async function saveRealtimeSpeakingEvidenceAction(
  evidence: SpeakingTurnEvidence[],
  context: AiTeacherContext,
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const sanitized = sanitizeSpeakingTurnEvidence(evidence);
  if (sanitized.length === 0) return;
  await saveRealtimeSpeakingEvidence(session.user.id, sanitized, context);
}

export type TranscribeHanMessageResult =
  { ok: true; transcript: string } | { ok: false; error: string };

export async function transcribeHanMessageAction(
  formData: FormData,
): Promise<TranscribeHanMessageResult> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const audio = formData.get("audio");
  if (!(audio instanceof Blob) || audio.size === 0) {
    return { ok: false, error: "No recording was received." };
  }
  if (!audio.type.startsWith("audio/") || audio.size > MAX_HAN_AUDIO_BYTES) {
    return { ok: false, error: "That recording can't be processed." };
  }

  try {
    await checkDailyUsageCap(session.user.id, "han-teacher-transcribe");
    const result = await getSttProvider().transcribe(
      Buffer.from(await audio.arrayBuffer()),
      audio.type,
      "han-multilingual",
    );
    const estimatedDurationSeconds = estimateAudioDurationSecondsFromBytes(
      audio.size,
    );
    await recordAiUsage({
      userId: session.user.id,
      feature: "han-teacher-transcribe",
      provider: result.provider,
      model: result.model,
      estimatedCostUsd: estimateSttCostUsd(estimatedDurationSeconds),
      durationSeconds: estimatedDurationSeconds,
      durationSource: "BYTE_SIZE_ESTIMATE",
    });
    const assessment = assessHanTranscript(
      result.transcript,
      result.confidence,
    );
    return assessment.ok
      ? { ok: true, transcript: assessment.transcript }
      : { ok: false, error: HAN_STT_REPEAT_MESSAGE };
  } catch (error) {
    if (error instanceof DailyUsageCapExceededError) {
      return { ok: false, error: error.message };
    }
    return {
      ok: false,
      error:
        error instanceof SttProviderError
          ? error.message
          : "The recording couldn't be transcribed. Please try again.",
    };
  }
}
