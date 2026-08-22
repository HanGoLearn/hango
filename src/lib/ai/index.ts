import "server-only";
import { serverEnv } from "@/lib/env/server";
import { OpenAiProvider } from "@/lib/ai/providers/openai";
import { AnthropicAiProvider } from "@/lib/ai/providers/anthropic";
import { MockAiProvider } from "@/lib/ai/providers/mock";
import type { AiProvider } from "@/lib/ai/provider";

let cached: AiProvider | undefined;

/**
 * The one place that decides which `AiProvider` the rest of the app talks
 * to. Nothing outside this file (or the provider classes themselves) ever
 * checks a provider env var directly - adding/removing a key just changes
 * what this returns, no other code changes.
 *
 * OpenAI is the project's chosen provider (see FASE 8 notes in TASKS.md -
 * decided partly for its Realtime API, the intended fit for FASE 10's
 * Speaking Lab). The Anthropic adapter is still fully built and selectable
 * as a fallback - proof the abstraction actually supports swapping, not
 * just a claim.
 */
export function getAiProvider(): AiProvider {
  if (!cached) {
    if (serverEnv.OPENAI_API_KEY) {
      cached = new OpenAiProvider(serverEnv.OPENAI_API_KEY);
    } else if (serverEnv.ANTHROPIC_API_KEY) {
      cached = new AnthropicAiProvider(serverEnv.ANTHROPIC_API_KEY);
    } else {
      cached = new MockAiProvider();
    }
  }
  return cached;
}

export * from "@/lib/ai/provider";
