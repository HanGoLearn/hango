import { createHash } from "node:crypto";
import { JOURNEY_SESSION_AUDIO_VERSION } from "@/lib/journey-session-audio-review";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { serverEnv } from "@/lib/env/server";
import { getCompetencyProgress } from "@/lib/progress-data";
import { getJourneySpeakingBanks } from "@/lib/content/journey-speaking-bank-data";
import { getJourneyRealtimeBinding } from "@/lib/journey-speaking-realtime-binding";
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
  checkDailyUsageCap,
  DailyUsageCapExceededError,
  recordAiUsage,
} from "@/lib/ai-usage";
import {
  REALTIME_SESSION_ESTIMATE_USD,
  resolveRealtimeUsageFeature,
} from "@/lib/realtime-usage";

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
const MAX_CONNECTIONS_PER_WINDOW = serverEnv.NODE_ENV === "production" ? 6 : 30;
const LOCAL_REALTIME_DAILY_FALLBACK_USD = 5;
const connectionTimestamps = new Map<string, number[]>();

function connectionAllowance(userId: string): {
  allowed: boolean;
  retryAfterSeconds: number;
} {
  const now = Date.now();
  const recent = (connectionTimestamps.get(userId) ?? []).filter(
    (timestamp) => now - timestamp < CONNECTION_WINDOW_MS,
  );
  if (recent.length >= MAX_CONNECTIONS_PER_WINDOW) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((CONNECTION_WINDOW_MS - (now - recent[0]!)) / 1000),
      ),
    };
  }
  recent.push(now);
  connectionTimestamps.set(userId, recent);
  return { allowed: true, retryAfterSeconds: 0 };
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });
  const allowance = connectionAllowance(session.user.id);
  if (!allowance.allowed) {
    return Response.json(
      {
        error: "Too many live voice sessions. Please wait a few minutes.",
        retryAfterSeconds: allowance.retryAfterSeconds,
      },
      {
        status: 429,
        headers: { "retry-after": String(allowance.retryAfterSeconds) },
      },
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
  // Local small-recorder evidence belongs only to Han Tutor's text request.
  // A live Realtime session hears its own audio and must not inherit stale or
  // browser-supplied pronunciation scores from another surface.
  delete context.pronunciationAttempt;
  // This is authenticated, server-owned exposure evidence, never client data.
  delete context.journeySpeakingBanks;
  const feature = resolveRealtimeUsageFeature(
    mode,
    context,
    url.searchParams.get("surface"),
  );
  if (!feature)
    return new Response("Invalid voice conversation surface", { status: 400 });
  const attemptId = request.headers.get("x-hango-journey-attempt-id");
  let boundAttemptId: string | null = null;
  let boundLocale: "es" | "en" | null = null;
  let boundAudioContext: Awaited<
    ReturnType<typeof getJourneyRealtimeBinding>
  >["audioContext"];
  if (attemptId !== null) {
    if (
      feature !== "journey-speaking-realtime-session" ||
      typeof context.lessonId !== "string"
    )
      return new Response("Invalid Journey attempt surface", { status: 400 });
    try {
      const binding = await getJourneyRealtimeBinding(
        session.user.id,
        attemptId,
        context.lessonId,
      );
      context.rolePlay = binding.rolePlay;
      context.journeySpeakingBanks = binding.banks;
      boundAttemptId = binding.attemptId;
      boundLocale = binding.locale === "es" ? "es" : "en";
      boundAudioContext = binding.audioContext;
    } catch {
      return new Response("Journey attempt unavailable", { status: 403 });
    }
  }
  try {
    await checkDailyUsageCap(
      session.user.id,
      feature,
      {
        provider: "openai",
        model: "gpt-realtime-mini",
      },
      {
        // Hot reloads and repeated device checks create many short sessions in
        // localhost. Keep production's conservative default unchanged while
        // still respecting every explicit global, feature, and per-user policy.
        fallbackDailyLimitUsd:
          serverEnv.NODE_ENV === "production"
            ? undefined
            : LOCAL_REALTIME_DAILY_FALLBACK_USD,
      },
    );
  } catch (error) {
    if (error instanceof DailyUsageCapExceededError) {
      return Response.json({ error: error.message }, { status: 429 });
    }
    throw error;
  }
  if (feature === "journey-speaking-realtime-session") {
    context.speakingSurface = "JOURNEY";
    if (!boundAttemptId && typeof context.lessonId === "string") {
      context.journeySpeakingBanks =
        (await getJourneySpeakingBanks(session.user.id, context.lessonId)) ??
        undefined;
    }
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
              context.rolePlay && context.speakingSurface !== "JOURNEY"
                ? "mandarin"
                : "han-multilingual",
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
    // user-approved session estimate used by the global authorization gate.
    // This is not provider-reported billing and does not rewrite old sessions.
    await recordAiUsage({
      userId: session.user.id,
      feature,
      provider: "openai",
      model: "gpt-realtime-mini",
      estimatedCostUsd: REALTIME_SESSION_ESTIMATE_USD,
    });
    return Response.json({
      sdp: body,
      instructions: realtimeInstructions,
      speechSpeed,
      rolePlayLevel: resolvedRolePlayLevel ?? null,
      ...(boundAttemptId ? { journeyAttemptId: boundAttemptId } : {}),
      ...(boundAttemptId
        ? {
            journeySessionAudioReview: {
              version: JOURNEY_SESSION_AUDIO_VERSION,
              locale: boundLocale,
              ...(boundAudioContext ? { context: boundAudioContext } : {}),
            },
          }
        : {}),
      ...(feature === "journey-speaking-realtime-session"
        ? { journeySpeakingBanks: context.journeySpeakingBanks ?? null }
        : {}),
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
