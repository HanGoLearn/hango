import "server-only";
import { db } from "@/lib/db";
import { getTtsProvider } from "@/lib/tts";
import { getStorageProvider } from "@/lib/storage";
import { recordVocabularyInteraction } from "@/lib/reflection";

// Shared by both audio generation (TTS) and example generation (AI text) -
// both are paid, on-demand calls that only run on a cache miss, but still
// deserve the same abuse/cost protection as every other AI-backed action.
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX_GENERATIONS = 30;
const recentGenerationTimestamps = new Map<string, number[]>();

export class VocabularyInteractivityRateLimitError extends Error {}
export class VocabularyInteractivityNotFoundError extends Error {}

function checkRateLimit(userId: string): void {
  const now = Date.now();
  const timestamps = (recentGenerationTimestamps.get(userId) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );
  if (timestamps.length >= RATE_LIMIT_MAX_GENERATIONS) {
    throw new VocabularyInteractivityRateLimitError(
      "You've generated a lot of new content in a short time. Please wait a bit before continuing.",
    );
  }
  timestamps.push(now);
  recentGenerationTimestamps.set(userId, timestamps);
}

// One consistent narration voice - unlike dialogue lines, this isn't a
// scene with multiple characters, just the word/example being pronounced.
const VOICE = "alloy";

async function synthesizeAndStore(key: string, text: string): Promise<string> {
  const tts = getTtsProvider();
  const result = await tts.synthesize(text, VOICE);
  await getStorageProvider().upload(key, result.audio, result.contentType);
  return key;
}

/**
 * Lazily generates and caches a vocabulary word's pronunciation audio.
 * Generated once, reused for every learner after.
 */
export async function getOrGenerateVocabularyItemAudioUrl(
  userId: string,
  vocabularyItemId: string,
): Promise<string> {
  const item = await db.vocabularyItem.findUnique({
    where: { id: vocabularyItemId },
  });
  if (!item) {
    throw new VocabularyInteractivityNotFoundError("Word not found.");
  }

  await recordVocabularyInteraction(userId, item.id);

  const storage = getStorageProvider();
  if (item.audioFilePath) return storage.getUrl(item.audioFilePath);

  checkRateLimit(userId);
  const key = `vocabulary-audio/${item.id}.wav`;
  await synthesizeAndStore(key, item.chineseForm);
  await db.vocabularyItem.update({
    where: { id: item.id },
    data: { audioFilePath: key },
  });

  return storage.getUrl(key);
}

/**
 * Lazily generates and caches an example sentence's pronunciation audio.
 */
export async function getOrGenerateVocabularyExampleAudioUrl(
  userId: string,
  exampleId: string,
): Promise<string> {
  const example = await db.vocabularyExample.findUnique({
    where: { id: exampleId },
  });
  if (!example) {
    throw new VocabularyInteractivityNotFoundError("Example not found.");
  }

  const storage = getStorageProvider();
  if (example.audioFilePath) return storage.getUrl(example.audioFilePath);

  checkRateLimit(userId);
  const key = `vocabulary-audio/example-${example.id}.wav`;
  await synthesizeAndStore(key, example.chineseText);
  await db.vocabularyExample.update({
    where: { id: example.id },
    data: { audioFilePath: key },
  });

  return storage.getUrl(key);
}

export interface VocabularyExampleView {
  id: string;
  chineseText: string;
  pinyin: string;
  translation: string;
}

/**
 * Returns a vocabulary word's hand-authored example sentences. No live AI
 * fallback (removed 2026-08-14): every word in the app is expected to be
 * pre-authored, so a missing example set means content is genuinely missing
 * and should be authored, not silently papered over with a paid, slow
 * generation call while a real learner is mid-lesson.
 */
export async function getVocabularyExamples(
  userId: string,
  vocabularyItemId: string,
): Promise<VocabularyExampleView[]> {
  const item = await db.vocabularyItem.findUnique({
    where: { id: vocabularyItemId },
    include: { examples: { orderBy: { order: "asc" } } },
  });
  if (!item) {
    throw new VocabularyInteractivityNotFoundError("Word not found.");
  }
  await recordVocabularyInteraction(userId, item.id);
  return item.examples;
}

/**
 * Marks a word as seen, without re-fetching its content (2026-08-19,
 * project/learning-journey-optimization.md Facet C). The Vocabulary Step
 * now gets `examples` eagerly, server-side, via
 * `content/vocabulary.ts`'s `getVocabularyForLesson` (same reasoning as
 * Grammar's examples - both are hand-authored, not AI-generated, since the
 * 2026-08-14 removal above) - it no longer needs `getVocabularyExamples`'s
 * content read on every word transition, just the interaction signal that
 * used to ride along with it as a side effect.
 */
export async function recordVocabularyWordSeen(
  userId: string,
  vocabularyItemId: string,
): Promise<void> {
  await recordVocabularyInteraction(userId, vocabularyItemId);
}

export interface VocabularyQuizAttemptInput {
  vocabularyItemId: string;
  questionKey: string;
  isCorrect: boolean;
}

/**
 * Persists several Vocabulary Step quiz answers in one call (Points &
 * Leveling System, docs/02_academy/points_system.md - added 2026-08-16;
 * batched 2026-08-19, project/learning-journey-optimization.md Facet C
 * follow-up). `questionKey` mirrors the UI's own question identity
 * (`${itemId}:meaning`, `${itemId}:pinyin`, `${itemId}:chineseForm`,
 * `${itemId}:blank:${index}` - see vocabulary-step.tsx). Multiple rows per
 * question are allowed (a learner can revisit a word) - scoring uses the
 * first by `createdAt`, the same convention as `computeExerciseScore()` in
 * reflection.ts.
 *
 * Correctness (green/red) is computed client-side (vocabulary-quiz.ts
 * builds the questions and grades them in the browser, never AI-generated
 * or server-validated) and shown instantly regardless of when this call
 * fires - the Vocabulary Step buffers a word's answers and flushes them
 * together when the learner leaves that word (Next/Back/finishing the
 * step), instead of one `create` per question (4-6 per word, the highest-
 * frequency interaction in a lesson).
 */
export async function recordVocabularyQuizAttempts(
  userId: string,
  lessonId: string,
  attempts: VocabularyQuizAttemptInput[],
): Promise<void> {
  if (attempts.length === 0) return;
  await db.vocabularyQuizAttempt.createMany({
    data: attempts.map((attempt) => ({
      userId,
      lessonId,
      vocabularyItemId: attempt.vocabularyItemId,
      questionKey: attempt.questionKey,
      isCorrect: attempt.isCorrect,
    })),
  });
}
