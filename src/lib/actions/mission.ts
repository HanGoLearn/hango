"use server";

import { auth } from "@/lib/auth";
import {
  startMissionAttempt,
  sendMissionMessage,
  endMissionAttempt,
  MissionInputError,
  MissionRateLimitError,
} from "@/lib/mission-data";
import { AiProviderError } from "@/lib/ai";
import type { MissionReport } from "@/lib/mission-evaluation";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export async function startMissionAttemptAction(
  missionId: string,
): Promise<{ attemptId: string }> {
  const userId = await requireUserId();
  const attempt = await startMissionAttempt(userId, missionId);
  return { attemptId: attempt.id };
}

export type SendMissionMessageResult =
  { ok: true; reply: string } | { ok: false; error: string };

/** Never throws for AI failure (12/8.6 pattern) - the chat UI shows the error inline with a retry option. */
export async function sendMissionMessageAction(
  attemptId: string,
  message: string,
): Promise<SendMissionMessageResult> {
  const userId = await requireUserId();
  try {
    const { reply } = await sendMissionMessage(userId, attemptId, message);
    return { ok: true, reply };
  } catch (error) {
    if (error instanceof MissionInputError) {
      return { ok: false, error: error.message };
    }
    if (error instanceof MissionRateLimitError) {
      return { ok: false, error: error.message };
    }
    if (error instanceof AiProviderError) {
      return { ok: false, error: error.message };
    }
    return {
      ok: false,
      error: "Something went wrong reaching the AI. Please try again.",
    };
  }
}

export async function endMissionAttemptAction(
  attemptId: string,
): Promise<MissionReport> {
  const userId = await requireUserId();
  const attempt = await endMissionAttempt(userId, attemptId);
  return attempt.report as unknown as MissionReport;
}
