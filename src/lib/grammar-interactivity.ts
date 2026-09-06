import "server-only";
import { db } from "@/lib/db";
import { getTtsProvider } from "@/lib/tts";
import { getStorageProvider } from "@/lib/storage";
import { contentAudioKey } from "@/lib/audio-content-key";
import { getExercisesForGrammarPoint } from "@/lib/content/exercise";
import {
  recordAiUsage,
  checkDailyUsageCap,
  estimateTtsCostUsd,
  estimateTtsDurationSeconds,
} from "@/lib/ai-usage";

// Shared across every generation path here (audio, explanation, examples,
// exercises) - all are paid, on-demand calls that only run on a cache miss.
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX_GENERATIONS = 30;
const recentGenerationTimestamps = new Map<string, number[]>();

export class GrammarInteractivityRateLimitError extends Error {}
export class GrammarInteractivityNotFoundError extends Error {}

function checkRateLimit(userId: string): void {
  const now = Date.now();
  const timestamps = (recentGenerationTimestamps.get(userId) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );
  if (timestamps.length >= RATE_LIMIT_MAX_GENERATIONS) {
    throw new GrammarInteractivityRateLimitError(
      "You've generated a lot of new content in a short time. Please wait a bit before continuing.",
    );
  }
  timestamps.push(now);
  recentGenerationTimestamps.set(userId, timestamps);
}

const VOICE = "alloy";

async function synthesizeAndStore(
  userId: string,
  key: string,
  text: string,
): Promise<string> {
  await checkDailyUsageCap(userId, "grammar-audio");
  const tts = getTtsProvider();
  const result = await tts.synthesize(text, VOICE);
  await recordAiUsage({
    userId,
    feature: "grammar-audio",
    provider: result.provider,
    model: result.model,
    estimatedCostUsd: estimateTtsCostUsd(text),
    durationSeconds: estimateTtsDurationSeconds(text),
    durationSource: "TEXT_LENGTH_ESTIMATE",
  });
  await getStorageProvider().upload(key, result.audio, result.contentType);
  return key;
}

/** Lazily generates and caches a grammar example's pronunciation audio. */
export async function getOrGenerateGrammarExampleAudioUrl(
  userId: string,
  exampleId: string,
): Promise<string> {
  const example = await db.grammarExample.findUnique({
    where: { id: exampleId },
  });
  if (!example) {
    throw new GrammarInteractivityNotFoundError("Example not found.");
  }

  const storage = getStorageProvider();
  if (example.audioFilePath) return storage.getUrl(example.audioFilePath);

  // Content-addressed (see audio-content-key.ts) - reuses an already-paid-for
  // file across reseeds instead of re-generating identical audio.
  const key = contentAudioKey("grammar-audio/example", example.chineseText);
  if (await storage.exists(key)) {
    await db.grammarExample.update({
      where: { id: example.id },
      data: { audioFilePath: key },
    });
    return storage.getUrl(key);
  }

  checkRateLimit(userId);
  await synthesizeAndStore(userId, key, example.chineseText);
  await db.grammarExample.update({
    where: { id: example.id },
    data: { audioFilePath: key },
  });

  return storage.getUrl(key);
}

export interface GrammarExampleView {
  id: string;
  chineseText: string;
  pinyin: string;
  translation: string;
}

/**
 * Returns a grammar point's hand-authored example sentences. No live AI
 * fallback (removed 2026-08-14): see getVocabularyExamples in
 * vocabulary-interactivity.ts for why.
 */
export async function getGrammarExamples(
  grammarPointId: string,
): Promise<GrammarExampleView[]> {
  const point = await db.grammarPoint.findUnique({
    where: { id: grammarPointId },
    include: { examples: { orderBy: { order: "asc" } } },
  });
  if (!point) {
    throw new GrammarInteractivityNotFoundError("Grammar point not found.");
  }
  return point.examples;
}

/**
 * Returns a grammar point's hand-authored practice exercises (reuses the
 * existing Exercise/ExerciseOption models via `Exercise.grammarPointId`).
 * No live AI fallback (removed 2026-08-14): see getVocabularyExamples in
 * vocabulary-interactivity.ts for why.
 */
export async function getGrammarExercises(grammarPointId: string) {
  // No existence pre-check (dropped 2026-08-19,
  // project/db-operations-optimization.md Tier 2) - a nonexistent
  // grammarPointId already naturally returns an empty array here, same
  // observable result as the explicit check used to produce via a
  // separate NotFoundError, at half the query cost.
  return getExercisesForGrammarPoint(grammarPointId);
}
