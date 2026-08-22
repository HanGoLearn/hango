import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { getAiProvider, AiProviderError } from "@/lib/ai";
import { buildMissionSystemPrompt } from "@/lib/mission-prompt";
import {
  buildMissionEvaluationPrompt,
  parseMissionReport,
  defaultMissionReport,
  type MissionTranscriptMessage,
  type MissionReport,
} from "@/lib/mission-evaluation";
import {
  recordProgressEvidence,
  getLessonCompetencyIds,
} from "@/lib/progress-evidence";

// Same limits as the AI Teacher chat (ai-teacher-data.ts) - this is another
// free-form chat backed by a paid AI call per message, so it needs the same
// abuse/cost protection (16.5 "Rate limiting").
const MAX_MESSAGE_LENGTH = 1000;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX_MESSAGES = 15;
const recentMessageTimestamps = new Map<string, number[]>();

export class MissionInputError extends Error {}
export class MissionRateLimitError extends Error {}

function checkRateLimit(userId: string): void {
  const now = Date.now();
  const timestamps = (recentMessageTimestamps.get(userId) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );
  if (timestamps.length >= RATE_LIMIT_MAX_MESSAGES) {
    throw new MissionRateLimitError(
      "You've sent a lot of messages in a short time. Please wait a bit before continuing.",
    );
  }
  timestamps.push(now);
  recentMessageTimestamps.set(userId, timestamps);
}

async function getMissionWithConditions(missionId: string) {
  return db.mission.findUniqueOrThrow({
    where: { id: missionId },
    include: {
      successConditions: { orderBy: { order: "asc" } },
      lesson: { select: { hskReference: true } },
    },
  });
}

async function assertOwnedAttempt(userId: string, attemptId: string) {
  const attempt = await db.missionAttempt.findUniqueOrThrow({
    where: { id: attemptId },
  });
  if (attempt.userId !== userId) throw new Error("Not authorized");
  return attempt;
}

export async function startMissionAttempt(userId: string, missionId: string) {
  return db.missionAttempt.create({ data: { userId, missionId } });
}

interface SendMissionMessageResult {
  reply: string;
}

/** Never throws for AI failure - the caller can't be allowed to lose the mission conversation over a flaky response. */
export async function sendMissionMessage(
  userId: string,
  attemptId: string,
  message: string,
): Promise<SendMissionMessageResult> {
  const trimmed = message.trim();
  if (trimmed.length === 0) {
    throw new MissionInputError("Message can't be empty.");
  }
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    throw new MissionInputError(
      `Message is too long (max ${MAX_MESSAGE_LENGTH} characters).`,
    );
  }
  checkRateLimit(userId);

  const attempt = await assertOwnedAttempt(userId, attemptId);
  const mission = await getMissionWithConditions(attempt.missionId);

  const transcript =
    attempt.transcript as unknown as MissionTranscriptMessage[];
  const systemPrompt = buildMissionSystemPrompt({
    title: mission.title,
    context: mission.context,
    objective: mission.objective,
    learnerRole: mission.learnerRole ?? "learner",
    aiRole: mission.aiRole ?? "conversation partner",
    successConditions: mission.successConditions.map((c) => c.description),
    hskReference: mission.lesson?.hskReference ?? undefined,
  });

  const provider = getAiProvider();
  const result = await provider.complete({
    systemPrompt,
    messages: [...transcript, { role: "user", content: message }],
    maxOutputTokens: 300,
  });

  const nextTranscript: MissionTranscriptMessage[] = [
    ...transcript,
    { role: "user", content: message },
    { role: "assistant", content: result.content },
  ];

  await db.missionAttempt.update({
    where: { id: attemptId },
    data: { transcript: nextTranscript as unknown as Prisma.InputJsonValue },
  });

  return { reply: result.content };
}

/**
 * Ends the mission and generates its report (12.1 "Generate report",
 * 12.5). Never throws for AI failure - falls back to a neutral report
 * built from the mission's real success conditions, same pattern as
 * speaking/writing feedback.
 */
export async function endMissionAttempt(userId: string, attemptId: string) {
  const attempt = await assertOwnedAttempt(userId, attemptId);
  const mission = await getMissionWithConditions(attempt.missionId);
  const successConditionDescriptions = mission.successConditions.map(
    (c) => c.description,
  );
  const transcript =
    attempt.transcript as unknown as MissionTranscriptMessage[];

  let report: MissionReport;
  try {
    const provider = getAiProvider();
    const result = await provider.complete({
      systemPrompt: buildMissionEvaluationPrompt(
        {
          title: mission.title,
          objective: mission.objective,
          learnerRole: mission.learnerRole ?? "learner",
          aiRole: mission.aiRole ?? "conversation partner",
          successConditions: successConditionDescriptions,
        },
        transcript,
      ),
      messages: [{ role: "user", content: "Evaluate this mission." }],
      maxOutputTokens: 500,
    });
    report = parseMissionReport(result.content, successConditionDescriptions);
  } catch (error) {
    if (!(error instanceof AiProviderError)) throw error;
    report = defaultMissionReport(successConditionDescriptions);
  }

  const updated = await db.missionAttempt.update({
    where: { id: attemptId },
    data: {
      completionState: "COMPLETED",
      completedAt: new Date(),
      report: report as unknown as Prisma.InputJsonValue,
    },
  });

  // Only lesson-scoped missions produce evidence - Competency has no
  // scenario-level link (see progress-evidence.ts), so the scenario's
  // final mission doesn't attribute evidence anywhere.
  const competencyIds = await getLessonCompetencyIds(mission.lessonId, "MISSION");
  const result =
    (report.communicationSuccess +
      report.taskCompletion +
      report.vocabularyUsage +
      report.grammarUsage +
      report.clarity) /
    500;
  await recordProgressEvidence(
    userId,
    competencyIds,
    "MISSION",
    result,
    mission.difficulty,
    updated.id,
  );

  return updated;
}
