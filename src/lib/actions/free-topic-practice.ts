"use server";

import { auth } from "@/lib/auth";
import { getAiProvider, AiProviderError } from "@/lib/ai";
import {
  buildSpeakingConversationFeedbackPrompt,
  parseSpeakingConversationFeedback,
  hasEnoughSpeakingEvidence,
  type SpeakingTranscriptMessage,
  type SpeakingFeedback,
} from "@/lib/reflection-prompt";
import {
  sanitizeSpeakingTurnEvidence,
  type SpeakingTurnEvidence,
} from "@/lib/speech/speaking-pronunciation-evidence";

// One AI call per finished conversation (not per turn) - same cost shape as
// the lesson Speaking step's Reflection scoring. Rate-limited the same way
// as every other paid AI action in Speaking Lab (speaking-data.ts).
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 10;
const recentTimestamps = new Map<string, number[]>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const timestamps = (recentTimestamps.get(userId) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );
  if (timestamps.length >= RATE_LIMIT_MAX_ATTEMPTS) return false;
  timestamps.push(now);
  recentTimestamps.set(userId, timestamps);
  return true;
}

export type FreeTopicFeedbackResult =
  | { ok: true; feedback: SpeakingFeedback | null } // null = not enough conversation to grade
  | { ok: false; error: string };

/**
 * Grades a finished free-topic voice conversation (Speaking Lab's
 * "Practice with Han" mode) using the same rubric/prompt as the lesson
 * Speaking step's Reflection scoring - reused as-is rather than duplicated,
 * see reflection-prompt.ts. Never throws for AI failure (same "AI failure
 * must not block" pattern used throughout Speaking Lab).
 */
export async function getFreeTopicPracticeFeedbackAction(
  topic: string,
  transcript: SpeakingTranscriptMessage[],
  speakingEvidence: SpeakingTurnEvidence[] = [],
): Promise<FreeTopicFeedbackResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Not authenticated" };
  if (!checkRateLimit(session.user.id)) {
    return {
      ok: false,
      error: "You've requested feedback a lot recently. Please wait a bit.",
    };
  }
  if (!hasEnoughSpeakingEvidence(transcript)) {
    return { ok: true, feedback: null };
  }

  try {
    const provider = getAiProvider();
    const result = await provider.complete({
      systemPrompt: buildSpeakingConversationFeedbackPrompt(
        {
          learnerRole: "yourself",
          aiRole: "conversation partner",
          objective: `Have a natural spoken conversation about: ${topic}`,
        },
        transcript,
        sanitizeSpeakingTurnEvidence(speakingEvidence),
      ),
      messages: [{ role: "user", content: "Evaluate the conversation above." }],
      // Same prompt shape (and same generous budget) as reflection.ts's
      // lesson Speaking step scoring: GPT-5's reasoning tokens count
      // against this budget, and the full rubric + up to 6 mistakes need
      // more room than an ordinary chat reply. A smaller budget here
      // previously caused the JSON to get cut off mid-response, which
      // parseSpeakingConversationFeedback silently turned into
      // DEFAULT_SPEAKING_FEEDBACK (flat 50s, generic notes) - a real bug,
      // not intentional (user report, 2026-08-08).
      maxOutputTokens: 1_600,
      timeoutMs: 45_000,
    });
    return {
      ok: true,
      feedback: parseSpeakingConversationFeedback(result.content),
    };
  } catch (error) {
    // Report the real failure instead of silently substituting fabricated
    // scores (DEFAULT_SPEAKING_FEEDBACK) - those looked identical to a real
    // result and misled the learner (user report, 2026-08-08).
    if (error instanceof AiProviderError) {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: "Something went wrong generating feedback." };
  }
}
