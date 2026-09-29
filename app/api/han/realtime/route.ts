import { createHash } from "node:crypto";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { serverEnv } from "@/lib/env/server";
import { getCompetencyProgress } from "@/lib/progress-data";
import { buildAdaptiveLearnerSummary } from "@/lib/ai-learner-adaptation";
import {
  buildRealtimeSystemPrompt,
  type AiTeacherContext,
  type AiTeacherMode,
} from "@/lib/ai-context";
import {
  realtimeSpeechSpeed,
  resolveRealtimePracticeLevel,
} from "@/lib/han-realtime";
import {
  buildRealtimeSttConfig,
  transcriptHintsFromContext,
} from "@/lib/speech/transcript-quality";
import {
  realtimeNoiseReductionConfig,
  realtimeVadConfig,
} from "@/lib/speech/realtime-vad";
import {
  AI_FAMILY_AUTHORIZATION_USD,
  checkDailyUsageCap,
  DailyUsageCapExceededError,
  recordAiUsage,
} from "@/lib/ai-usage";

const REALTIME_URL = "https://api.openai.com/v1/realtime/calls";
const VOICES = new Set([
  "alloy",
  "ash",
  "ballad",
  "coral",
  "echo",
  "fable",
  "nova",
  "onyx",
  "sage",
  "shimmer",
  "verse",
  "marin",
  "cedar",
]);
const MODES = new Set<AiTeacherMode>(["TUTOR", "PRACTICE"]);
const CONNECTION_WINDOW_MS = 10 * 60 * 1000;
const MAX_CONNECTIONS_PER_WINDOW = 6;
const connectionTimestamps = new Map<string, number[]>();

function allowConnection(userId: string): boolean {
  const now = Date.now();
  const recent = (connectionTimestamps.get(userId) ?? []).filter(
    (timestamp) => now - timestamp < CONNECTION_WINDOW_MS,
  );
  if (recent.length >= MAX_CONNECTIONS_PER_WINDOW) return false;
  recent.push(now);
  connectionTimestamps.set(userId, recent);
  return true;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });
  if (!allowConnection(session.user.id)) {
    return new Response(
      "Too many live voice sessions. Please wait a few minutes.",
      { status: 429 },
    );
  }
  if (!serverEnv.OPENAI_API_KEY) {
    return new Response("Realtime voice is not configured", { status: 503 });
  }

  const url = new URL(request.url);
  const requestedVoice = url.searchParams.get("voice") ?? "marin";
  const voice = VOICES.has(requestedVoice) ? requestedVoice : "marin";
  const requestedMode = url.searchParams.get("mode") as AiTeacherMode | null;
  const mode =
    requestedMode && MODES.has(requestedMode) ? requestedMode : "TUTOR";
  let context: AiTeacherContext = {};
  const encodedContext = request.headers.get("x-han-context");
  if (encodedContext) {
    try {
      context = JSON.parse(
        decodeURIComponent(encodedContext),
      ) as AiTeacherContext;
    } catch {
      return new Response("Invalid lesson context", { status: 400 });
    }
  }
  // Ephemeral app context is server-owned. Never let a browser-provided
  // x-han-context value inject persistent Realtime session instructions.
  delete context.onDemandAppContext;
  try {
    await checkDailyUsageCap(session.user.id, "han-realtime-session", {
      provider: "openai",
      model: "gpt-realtime-mini",
    });
  } catch (error) {
    if (error instanceof DailyUsageCapExceededError) {
      return Response.json({ error: error.message }, { status: 429 });
    }
    throw error;
  }
  const [profile, competencyProgress, recentEvidence, learnerFacts] =
    await Promise.all([
      db.learnerProfile.findUnique({
        where: { userId: session.user.id },
        select: {
          currentLevel: true,
          explanationLanguage: true,
          generalLevelPoints: true,
          displayName: true,
        },
      }),
      getCompetencyProgress(session.user.id),
      db.progressEvidence.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { result: true },
      }),
      // Han Companion's personal memory (2026-08-31, fixed same day) - only
      // Companion (mode === "PRACTICE", no role-play) ever reads this - see
      // ai-teacher-data.ts's sendAiTeacherMessage for the matching text-chat
      // fix and why `!context.rolePlay` alone wasn't the right gate (Han
      // Tutor's voice conversations are also not role-play).
      mode === "PRACTICE" && !context.rolePlay
        ? db.learnerFact.findMany({
            where: { userId: session.user.id },
            orderBy: { updatedAt: "desc" },
            take: 8,
            select: { fact: true },
          })
        : Promise.resolve([]),
    ]);
  const adaptive = buildAdaptiveLearnerSummary(
    competencyProgress.map((item) => ({
      name: item.name,
      weightedScore: item.weightedScore,
      evidenceCount: item.evidenceCount,
    })),
    recentEvidence.map((item) => item.result),
  );
  const resolvedRolePlayLevel = resolveRealtimePracticeLevel(
    context.rolePlay,
    profile?.generalLevelPoints,
  );
  if (
    context.rolePlay?.isFreeTopic &&
    resolvedRolePlayLevel &&
    !context.rolePlay.level
  ) {
    context = {
      ...context,
      rolePlay: { ...context.rolePlay, level: resolvedRolePlayLevel },
    };
  }
  const contextualSttVocabulary = transcriptHintsFromContext(context).map(
    (hint) => `${hint.hanzi} (${hint.pinyin})`,
  );
  const contextualSttGrammar = [
    context.selectedGrammarPoint,
    ...(context.lessonGrammar ?? []),
  ]
    .filter((item) => item?.name && item.structure)
    .map((item) => `${item!.name}: ${item!.structure}`);
  const realtimeInstructions = buildRealtimeSystemPrompt(
    {
      level: profile?.currentLevel ?? null,
      explanationLanguage: profile?.explanationLanguage ?? null,
      generalLevelPoints: profile?.generalLevelPoints,
      learnerName: profile?.displayName,
      knownFacts: learnerFacts.map((row) => row.fact),
      ...adaptive,
    },
    context,
    mode,
  );
  const speechSpeed = realtimeSpeechSpeed(context.rolePlay);
  const noiseReduction = realtimeNoiseReductionConfig(
    context.rolePlay?.isFreeTopic === true,
  );

  const formData = new FormData();
  formData.set("sdp", await request.text());
  formData.set(
    "session",
    JSON.stringify({
      type: "realtime",
      model: "gpt-realtime-mini",
      output_modalities: ["audio"],
      include: ["item.input_audio_transcription.logprobs"],
      instructions: realtimeInstructions,
      audio: {
        input: {
          ...(noiseReduction ? { noise_reduction: noiseReduction } : {}),
          transcription: {
            ...buildRealtimeSttConfig(
              context.rolePlay ? "mandarin" : "han-multilingual",
              [
                ...(context.rolePlay?.lessonVocabulary ?? []),
                ...contextualSttVocabulary,
                ...contextualSttGrammar,
              ],
            ),
          },
          turn_detection: realtimeVadConfig(
            context.rolePlay?.isFreeTopic === true,
          ),
        },
        output: { voice, speed: speechSpeed },
      },
    }),
  );

  const openAiResponse = await fetch(REALTIME_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${serverEnv.OPENAI_API_KEY}`,
      "OpenAI-Safety-Identifier": createHash("sha256")
        .update(session.user.id)
        .digest("hex"),
    },
    body: formData,
  });
  const body = await openAiResponse.text();
  if (openAiResponse.ok) {
    // The browser talks directly to Realtime after this handshake, so the
    // server never receives provider usage totals. Record the same explicit,
    // conservative session allowance used by the global authorization gate.
    await recordAiUsage({
      userId: session.user.id,
      feature: "han-realtime-session",
      provider: "openai",
      model: "gpt-realtime-mini",
      estimatedCostUsd: AI_FAMILY_AUTHORIZATION_USD.REALTIME,
    });
    return Response.json({
      sdp: body,
      instructions: realtimeInstructions,
      speechSpeed,
      rolePlayLevel: resolvedRolePlayLevel ?? null,
    });
  }
  return new Response(body, {
    status: openAiResponse.status,
    headers: {
      "content-type":
        openAiResponse.headers.get("content-type") ?? "application/sdp",
    },
  });
}
