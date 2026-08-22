import "server-only";
import { serverEnv } from "@/lib/env/server";
import { OpenAiSttProvider } from "@/lib/speech/providers/openai";
import { MockSttProvider } from "@/lib/speech/providers/mock";
import type { SttProvider } from "@/lib/speech/provider";

let cached: SttProvider | undefined;

/** Same factory pattern as src/lib/ai/index.ts - OpenAI when configured, mock otherwise. */
export function getSttProvider(): SttProvider {
  cached ??= serverEnv.OPENAI_API_KEY
    ? new OpenAiSttProvider(serverEnv.OPENAI_API_KEY)
    : new MockSttProvider();
  return cached;
}

export * from "@/lib/speech/provider";
