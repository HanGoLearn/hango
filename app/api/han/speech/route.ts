import { auth } from "@/lib/auth";
import { getAiProvider } from "@/lib/ai";
import { estimateCostUsd } from "@/lib/ai/cost";
import {
  recordAiUsage,
  checkDailyUsageCap,
  trackAiOperation,
  estimateTtsCostUsd,
  estimateTtsDurationSeconds,
  DailyUsageCapExceededError,
} from "@/lib/ai-usage";
import { serverEnv } from "@/lib/env/server";
import { getStorageProvider } from "@/lib/storage";
import { contentAudioKey } from "@/lib/audio-content-key";
import {
  oralScriptPrompt,
  mergeWavAudio,
  removePinyinForSpeech,
  segmentSpeechInstructions,
  selectUsefulOralScript,
  splitSpeechByLanguage,
} from "@/lib/han-speech";

const OPENAI_SPEECH_URL = "https://api.openai.com/v1/audio/speech";
const MAX_SPEECH_CHARACTERS = 4_000;

class HanSpeechProviderError extends Error {
  readonly code: "provider_rate_limited" | "provider_http_error";

  constructor(readonly rateLimited: boolean) {
    super("Han's voice is temporarily unavailable");
    this.code = rateLimited ? "provider_rate_limited" : "provider_http_error";
  }
}

// Same cache-miss-only throttle shape as every other TTS surface in the app
// (welcome-audio.ts, dialogue-audio.ts, etc.) - this route previously had
// none at all despite making both a text completion call (the "oral script"
// rewrite) and N raw TTS calls per request (2026-09-05 cost audit finding).
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX_GENERATIONS = 30;
const recentGenerationTimestamps = new Map<string, number[]>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const timestamps = (recentGenerationTimestamps.get(userId) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );
  if (timestamps.length >= RATE_LIMIT_MAX_GENERATIONS) return false;
  timestamps.push(now);
  recentGenerationTimestamps.set(userId, timestamps);
  return true;
}

const HAN_VOICES = new Set([
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

export async function POST(request: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    text?: unknown;
    voice?: unknown;
    responseLanguage?: unknown;
    delivery?: unknown;
  } | null;
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  const voice = typeof body?.voice === "string" ? body.voice : "cedar";
  const responseLanguage =
    body?.responseLanguage === "Spanish" ||
    body?.responseLanguage === "English" ||
    body?.responseLanguage === "Chinese"
      ? body.responseLanguage
      : "English";
  const conversational = body?.delivery === "conversation";

  if (!text || text.length > MAX_SPEECH_CHARACTERS || !HAN_VOICES.has(voice)) {
    return Response.json({ error: "Invalid speech request" }, { status: 400 });
  }
  if (!serverEnv.OPENAI_API_KEY) {
    return Response.json(
      { error: "Speech is not configured" },
      { status: 503 },
    );
  }

  const storage = getStorageProvider();
  // Content-addressed on the exact request shape (2026-09-05 cost audit
  // fix): a replayed message, or a short phrase Han says often, reuses the
  // already-generated clip instead of paying for both a fresh oral-script
  // rewrite and a fresh TTS render every single time.
  const cacheKey = contentAudioKey(
    `han-speech/${voice}/${responseLanguage}/${conversational ? "conversational" : "plain"}`,
    text,
  );
  if (await storage.exists(cacheKey)) {
    const cached = await storage.download(cacheKey);
    return new Response(new Uint8Array(cached), {
      headers: {
        "content-type": "audio/wav",
        "cache-control": "private, no-store",
      },
    });
  }

  if (!checkRateLimit(session.user.id)) {
    return Response.json(
      { error: "Han's voice is temporarily unavailable" },
      { status: 429 },
    );
  }
  try {
    await checkDailyUsageCap(session.user.id, "han-speech");
  } catch (error) {
    if (error instanceof DailyUsageCapExceededError) {
      return Response.json({ error: error.message }, { status: 429 });
    }
    throw error;
  }

  let spokenText = removePinyinForSpeech(text);
  try {
    const provider = getAiProvider();
    const oralScript = await trackAiOperation(
      {
        userId: session.user.id,
        feature: "han-speech",
        provider: provider.name,
        capAlreadyChecked: true,
      },
      () =>
        provider.complete({
          systemPrompt: oralScriptPrompt(responseLanguage, conversational),
          messages: [{ role: "user", content: text }],
          maxOutputTokens: 260,
        }),
    );
    await recordAiUsage({
      userId: session.user.id,
      feature: "han-speech",
      provider: oralScript.provider,
      model: oralScript.model,
      inputTokens: oralScript.inputTokens,
      outputTokens: oralScript.outputTokens,
      estimatedCostUsd: estimateCostUsd(
        oralScript.model,
        oralScript.inputTokens,
        oralScript.outputTokens,
      ),
    });
    spokenText = selectUsefulOralScript(text, oralScript.content);
  } catch {
    // Voice remains available even if the optional conversational rewrite fails.
  }

  const segments = splitSpeechByLanguage(spokenText, responseLanguage);
  let responses: Response[];
  try {
    responses = await trackAiOperation(
      {
        userId: session.user.id,
        feature: "han-speech",
        provider: "openai",
        model: "gpt-4o-mini-tts",
        capAlreadyChecked: true,
      },
      async () => {
        const generated = await Promise.all(
          segments.map((segment) =>
            fetch(OPENAI_SPEECH_URL, {
              method: "POST",
              headers: {
                authorization: `Bearer ${serverEnv.OPENAI_API_KEY}`,
                "content-type": "application/json",
              },
              body: JSON.stringify({
                model: "gpt-4o-mini-tts",
                voice,
                input: segment.text,
                response_format: "wav",
                instructions: segmentSpeechInstructions(segment.language),
              }),
            }),
          ),
        );
        if (generated.some((response) => !response.ok)) {
          throw new HanSpeechProviderError(
            generated.some((response) => response.status === 429),
          );
        }
        return generated;
      },
    );
  } catch (error) {
    const rateLimited =
      error instanceof HanSpeechProviderError && error.rateLimited;
    return Response.json(
      { error: "Han's voice is temporarily unavailable" },
      { status: rateLimited ? 429 : 502 },
    );
  }

  const audio = mergeWavAudio(
    await Promise.all(responses.map((response) => response.arrayBuffer())),
  );
  await recordAiUsage({
    userId: session.user.id,
    feature: "han-speech",
    provider: "openai",
    model: "gpt-4o-mini-tts",
    estimatedCostUsd: estimateTtsCostUsd(spokenText),
    durationSeconds: estimateTtsDurationSeconds(spokenText),
    durationSource: "TEXT_LENGTH_ESTIMATE",
  });
  await storage.upload(cacheKey, Buffer.from(audio), "audio/wav");
  const audioBody = audio.slice().buffer as ArrayBuffer;

  return new Response(audioBody, {
    headers: {
      "content-type": "audio/wav",
      "cache-control": "private, no-store",
    },
  });
}
