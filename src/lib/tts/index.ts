import "server-only";
import { serverEnv } from "@/lib/env/server";
import { OpenAiTtsProvider } from "@/lib/tts/providers/openai";
import { MockTtsProvider } from "@/lib/tts/providers/mock";
import type { TtsProvider } from "@/lib/tts/provider";

let cached: TtsProvider | undefined;

/** Same factory pattern as src/lib/speech/index.ts - OpenAI when configured, mock otherwise. */
export function getTtsProvider(): TtsProvider {
  cached ??= serverEnv.OPENAI_API_KEY
    ? new OpenAiTtsProvider(serverEnv.OPENAI_API_KEY)
    : new MockTtsProvider();
  return cached;
}

export * from "@/lib/tts/provider";
