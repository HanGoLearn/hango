import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { getAiProvider, AiProviderError } from "@/lib/ai";
import { estimateCostUsd } from "@/lib/ai/cost";
import { recordAiUsage, trackAiOperation } from "@/lib/ai-usage";
import { hskNumberForPoints } from "@/lib/points-system";
import { createTtlCache } from "@/lib/ttl-cache";
import type { AppLocale } from "@/i18n/config";
import {
  buildVocabularyLookupPrompt,
  parseVocabularyLookupResult,
  type VocabularyLookupResult,
} from "@/lib/vocabulary-lookup-prompt";

export class VocabularyLookupInputError extends Error {}
export class VocabularyLookupRateLimitError extends Error {}

const MAX_INPUT_LENGTH = 50;

// Its own limiter, same copy-paste convention as every other AI-cost-
// sensitive path in this app (ai-teacher-data.ts, speaking-data.ts) - rate
// limiting isn't shared infrastructure here.
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX_LOOKUPS = 20;
const recentLookupTimestamps = new Map<string, number[]>();

function checkRateLimit(userId: string): void {
  const now = Date.now();
  const timestamps = (recentLookupTimestamps.get(userId) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );
  if (timestamps.length >= RATE_LIMIT_MAX_LOOKUPS) {
    throw new VocabularyLookupRateLimitError(
      "You've looked up a lot of words in a short time. Please wait a bit before continuing.",
    );
  }
  timestamps.push(now);
  recentLookupTimestamps.set(userId, timestamps);
}

const LOOKUP_PROMPT_VERSION = 1;
const LOOKUP_MEMORY_TTL_MS = 24 * 60 * 60 * 1000;

const INTERFACE_LANGUAGE: Record<
  AppLocale,
  { db: "EN" | "ES"; prompt: string }
> = {
  en: { db: "EN", prompt: "English" },
  es: { db: "ES", prompt: "Spanish" },
};

/**
 * NFKC folds equivalent keyboard forms and lowercasing/whitespace folding
 * makes pinyin lookups such as "YAO", "yao", and " yao " share one paid
 * result. Chinese characters are unaffected.
 */
export function normalizeVocabularyLookupInput(input: string): string {
  return input
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("en-US");
}

/**
 * L1 process cache plus L2 database cache. userId and displayInput are
 * deliberately absent from the cache key: results are shared across learners
 * at the same normalized word, earned level, interface locale, and prompt
 * version. Cache hits return before rate/cap checks and before provider usage,
 * so only a genuinely new combination can incur an AI charge.
 */
const getOrGenerateVocabularyLookup = createTtlCache(
  async (
    userId: string,
    displayInput: string,
    normalizedInput: string,
    hskLevel: number,
    locale: AppLocale,
  ): Promise<VocabularyLookupResult | null> => {
    const language = INTERFACE_LANGUAGE[locale];
    const cacheKey = {
      normalizedInput,
      hskLevel,
      locale: language.db,
      promptVersion: LOOKUP_PROMPT_VERSION,
    } as const;
    const persisted = await db.vocabularyLookupCache.findUnique({
      where: {
        normalizedInput_hskLevel_locale_promptVersion: cacheKey,
      },
      select: { result: true },
    });
    if (persisted) {
      const parsed = parseVocabularyLookupResult(
        JSON.stringify(persisted.result),
      );
      if (parsed) return parsed;
    }

    checkRateLimit(userId);
    const provider = getAiProvider();
    const result = await trackAiOperation(
      { userId, feature: "vocabulary-lookup", provider: provider.name },
      () =>
        provider.complete({
          systemPrompt: buildVocabularyLookupPrompt(
            displayInput,
            hskLevel,
            language.prompt,
          ),
          messages: [{ role: "user", content: displayInput }],
          maxOutputTokens: 900,
        }),
    );
    await recordAiUsage({
      userId,
      feature: "vocabulary-lookup",
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
    const parsed = parseVocabularyLookupResult(result.content);
    if (!parsed) return null;

    await db.vocabularyLookupCache.upsert({
      where: {
        normalizedInput_hskLevel_locale_promptVersion: cacheKey,
      },
      create: {
        ...cacheKey,
        result: parsed as unknown as Prisma.InputJsonValue,
      },
      update: {
        result: parsed as unknown as Prisma.InputJsonValue,
      },
    });
    return parsed;
  },
  LOOKUP_MEMORY_TTL_MS,
  (_userId, _displayInput, normalizedInput, hskLevel, locale) =>
    `${normalizedInput}:${hskLevel}:${locale}:${LOOKUP_PROMPT_VERSION}`,
);

export function clearVocabularyLookupProcessCache(): void {
  getOrGenerateVocabularyLookup.clear();
}

/**
 * Han Vocabulary (2026-08-31) - a reference/lookup tool, not a practice
 * activity: deliberately never touches points, achievements, or HanCoins
 * (same "pure practice, no scoring" spirit already decided for Han
 * Companion). Level is always the learner's real, earned
 * `generalLevelPoints` via `hskNumberForPoints` - never a manual override,
 * by explicit user decision (a level-switch button would mean a second
 * full AI call per press).
 */
export async function lookupVocabularyWord(
  userId: string,
  input: string,
  locale: AppLocale = "en",
): Promise<VocabularyLookupResult | null> {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    throw new VocabularyLookupInputError("Type a word or its pinyin.");
  }
  if (trimmed.length > MAX_INPUT_LENGTH) {
    throw new VocabularyLookupInputError(
      `That's too long (max ${MAX_INPUT_LENGTH} characters) - try a single word or short phrase.`,
    );
  }
  const profile = await db.learnerProfile.findUnique({
    where: { userId },
    select: { generalLevelPoints: true },
  });
  const hskLevel = hskNumberForPoints(profile?.generalLevelPoints ?? 0);
  const normalizedInput = normalizeVocabularyLookupInput(trimmed);

  try {
    return await getOrGenerateVocabularyLookup(
      userId,
      trimmed,
      normalizedInput,
      hskLevel,
      locale,
    );
  } catch (error) {
    if (error instanceof AiProviderError) return null;
    throw error;
  }
}
