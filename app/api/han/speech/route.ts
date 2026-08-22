import { auth } from "@/lib/auth";
import { getAiProvider } from "@/lib/ai";
import { serverEnv } from "@/lib/env/server";
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

  let spokenText = removePinyinForSpeech(text);
  try {
    const oralScript = await getAiProvider().complete({
      systemPrompt: oralScriptPrompt(responseLanguage, conversational),
      messages: [{ role: "user", content: text }],
      maxOutputTokens: 260,
    });
    spokenText = selectUsefulOralScript(text, oralScript.content);
  } catch {
    // Voice remains available even if the optional conversational rewrite fails.
  }

  const segments = splitSpeechByLanguage(spokenText, responseLanguage);
  const responses = await Promise.all(
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

  if (responses.some((response) => !response.ok)) {
    const rateLimited = responses.some((response) => response.status === 429);
    return Response.json(
      { error: "Han's voice is temporarily unavailable" },
      { status: rateLimited ? 429 : 502 },
    );
  }

  const audio = mergeWavAudio(
    await Promise.all(responses.map((response) => response.arrayBuffer())),
  );
  const audioBody = audio.slice().buffer as ArrayBuffer;

  return new Response(audioBody, {
    headers: {
      "content-type": "audio/wav",
      "cache-control": "private, no-store",
    },
  });
}
