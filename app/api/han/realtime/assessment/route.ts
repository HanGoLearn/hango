import { auth } from "@/lib/auth";
import { getAiProvider } from "@/lib/ai";
import { estimateCostUsd } from "@/lib/ai/cost";
import { speakingExperience } from "@/lib/ai-experiences";
import type { AiExperience } from "@/lib/ai-experiences";
import {
  recordAiUsage,
  trackAiOperation,
  DailyUsageCapExceededError,
} from "@/lib/ai-usage";
import type { RolePlayContext } from "@/lib/ai-context";
import {
  buildTextConversationAssessmentPrompt,
  applyPlacementSpeakingTurnWindow,
  ensurePendingLearnerQuestionIsAnswered,
  parseTextConversationAssessment,
  stabilizeConversationPracticeTargets,
  keepTimedSpeakingAssessmentOpen,
} from "@/lib/han-realtime";
import type { SpeakingTranscriptMessage } from "@/lib/reflection-prompt";

const MAX_TRANSCRIPT_MESSAGES = 30;
const MAX_MESSAGE_CHARACTERS = 600;

type AssessmentRequest = {
  surface?: unknown;
  rolePlay?: unknown;
  latestLearnerTranscript?: unknown;
  phase?: unknown;
  transcript?: unknown;
  previouslyRemainingPracticeTargets?: unknown;
  continueUntilTimeLimit?: unknown;
  minimumLearnerTurns?: unknown;
  maximumLearnerTurns?: unknown;
};

export async function POST(request: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request
    .json()
    .catch(() => null)) as AssessmentRequest | null;
  const rolePlay = parseRolePlay(body?.rolePlay);
  const latestLearnerTranscript =
    typeof body?.latestLearnerTranscript === "string"
      ? body.latestLearnerTranscript.trim().slice(0, MAX_MESSAGE_CHARACTERS)
      : "";
  const phase =
    body?.phase === "before_reply" || body?.phase === "after_reply"
      ? body.phase
      : null;
  const transcript = parseTranscript(body?.transcript);
  const previouslyRemainingPracticeTargets = parseStringList(
    body?.previouslyRemainingPracticeTargets,
  );
  const continueUntilTimeLimit = body?.continueUntilTimeLimit === true;
  const minimumLearnerTurns = parseTurnLimit(body?.minimumLearnerTurns);
  const maximumLearnerTurns = parseTurnLimit(body?.maximumLearnerTurns);

  if (
    !rolePlay ||
    !latestLearnerTranscript ||
    !phase ||
    !transcript ||
    previouslyRemainingPracticeTargets === undefined
  )
    return Response.json(
      { error: "Invalid assessment request" },
      { status: 400 },
    );

  let experience: AiExperience;
  try {
    experience = speakingExperience(body?.surface, rolePlay.isFreeTopic);
  } catch {
    return Response.json(
      { error: "Invalid Speaking surface" },
      { status: 400 },
    );
  }
  try {
    const provider = getAiProvider();
    const result = await trackAiOperation(
      {
        userId: session.user.id,
        feature: "han-realtime-assessment",
        experience,
        provider: provider.name,
      },
      () =>
        provider.complete({
          systemPrompt: buildTextConversationAssessmentPrompt(
            rolePlay,
            latestLearnerTranscript,
            phase,
            transcript,
            previouslyRemainingPracticeTargets,
            continueUntilTimeLimit,
            minimumLearnerTurns !== null && maximumLearnerTurns !== null
              ? {
                  minimum: Math.min(minimumLearnerTurns, maximumLearnerTurns),
                  maximum: Math.max(minimumLearnerTurns, maximumLearnerTurns),
                }
              : undefined,
          ),
          messages: [
            {
              role: "user",
              content:
                "Assess the transcript and return the required JSON now.",
            },
          ],
          // gpt-5-mini uses part of this budget for reasoning before emitting
          // the compact JSON. Timed continuation also plans a safe next turn
          // after completion, so keep enough headroom for visible output.
          maxOutputTokens: 3_000,
          timeoutMs: 30_000,
        }),
    );
    await recordAiUsage({
      userId: session.user.id,
      feature: "han-realtime-assessment",
      experience,
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
    const parsedAssessment = parseTextConversationAssessment(result.content);
    const stabilizedAssessment = parsedAssessment
      ? ensurePendingLearnerQuestionIsAnswered(
          stabilizeConversationPracticeTargets(
            parsedAssessment,
            previouslyRemainingPracticeTargets,
            rolePlay,
            transcript,
          ),
          latestLearnerTranscript,
          phase,
        )
      : null;
    let assessment =
      stabilizedAssessment && continueUntilTimeLimit
        ? keepTimedSpeakingAssessmentOpen(stabilizedAssessment)
        : stabilizedAssessment;
    if (
      assessment &&
      minimumLearnerTurns !== null &&
      maximumLearnerTurns !== null
    ) {
      assessment = applyPlacementSpeakingTurnWindow(
        assessment,
        transcript,
        Math.min(minimumLearnerTurns, maximumLearnerTurns),
        Math.max(minimumLearnerTurns, maximumLearnerTurns),
      );
    }
    if (!assessment)
      return Response.json(
        { error: "Invalid assessment response" },
        { status: 502 },
      );
    return Response.json(assessment, {
      headers: { "cache-control": "private, no-store" },
    });
  } catch (error) {
    if (error instanceof DailyUsageCapExceededError) {
      return Response.json({ error: error.message }, { status: 429 });
    }
    return Response.json(
      { error: "Conversation assessment is temporarily unavailable" },
      { status: 503 },
    );
  }
}

function parseTurnLimit(value: unknown): number | null {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 12
    ? value
    : null;
}

function parseStringList(value: unknown): string[] | null | undefined {
  if (value == null) return null;
  if (!Array.isArray(value) || value.length > 100) return undefined;
  const strings = value.filter(
    (target): target is string => typeof target === "string",
  );
  if (strings.length !== value.length) return undefined;
  return strings.map((target) => target.slice(0, 200));
}

function parseRolePlay(value: unknown): RolePlayContext | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.aiRole !== "string" ||
    typeof candidate.learnerRole !== "string" ||
    typeof candidate.scenarioContext !== "string" ||
    typeof candidate.objective !== "string"
  )
    return null;
  return candidate as unknown as RolePlayContext;
}

function parseTranscript(value: unknown): SpeakingTranscriptMessage[] | null {
  if (!Array.isArray(value) || value.length > MAX_TRANSCRIPT_MESSAGES)
    return null;
  const transcript: SpeakingTranscriptMessage[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") return null;
    const candidate = item as Record<string, unknown>;
    if (
      (candidate.role !== "user" && candidate.role !== "assistant") ||
      typeof candidate.content !== "string"
    )
      return null;
    transcript.push({
      role: candidate.role,
      content: candidate.content.slice(0, MAX_MESSAGE_CHARACTERS),
    });
  }
  return transcript;
}
