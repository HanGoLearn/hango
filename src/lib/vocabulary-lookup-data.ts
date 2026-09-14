import { db } from "@/lib/db";
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

/**
 * The same word, same level, same interface language never needs to be
 * regenerated within the window - a real cost saver (Tier 3 pattern,
 * project/db-operations-optimization.md) since the content itself isn't
 * per-user, only the (word, level, language) key is. Deliberately
 * in-memory, not persisted - a server restart just means the next lookup
 * regenerates it, an accepted trade-off matching every other Tier 3 cache
 * in this app.
 */
const LOOKUP_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const generateVocabularyLookup = createTtlCache(
  // userId is deliberately NOT part of the cache key below - the lookup
  // itself is shared across every learner at the same (word, level,
  // language), same as before. It's only threaded through so a real
  // cache-miss generation can be attributed to whoever triggered it for the
  // daily usage cap/log (2026-09-05 cost audit) - a cache HIT never reaches
  // this function at all, so it never costs anything or counts against
  // anyone's cap, regardless of who requests it.
  async (
    userId: string,
    normalizedInput: string,
    hskLevel: number,
    interfaceLanguage: string,
  ): Promise<VocabularyLookupResult | null> => {
    const provider = getAiProvider();
    const result = await trackAiOperation(
      { userId, feature: "vocabulary-lookup", provider: provider.name },
      () =>
        provider.complete({
          systemPrompt: buildVocabularyLookupPrompt(
            normalizedInput,
            hskLevel,
            interfaceLanguage,
          ),
          messages: [{ role: "user", content: normalizedInput }],
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
    return parseVocabularyLookupResult(result.content);
  },
  LOOKUP_CACHE_TTL_MS,
  (_userId, normalizedInput, hskLevel, interfaceLanguage) =>
    `${normalizedInput}:${hskLevel}:${interfaceLanguage}`,
);

const INTERFACE_LANGUAGE_LABEL: Record<AppLocale, string> = {
  en: "English",
  es: "Spanish",
};

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
  checkRateLimit(userId);

  const profile = await db.learnerProfile.findUnique({
    where: { userId },
    select: { generalLevelPoints: true },
  });
  const hskLevel = hskNumberForPoints(profile?.generalLevelPoints ?? 0);
  const interfaceLanguage = INTERFACE_LANGUAGE_LABEL[locale];

  try {
    return await generateVocabularyLookup(
      userId,
      trimmed,
      hskLevel,
      interfaceLanguage,
    );
  } catch (error) {
    if (error instanceof AiProviderError) return null;
    throw error;
  }
}
