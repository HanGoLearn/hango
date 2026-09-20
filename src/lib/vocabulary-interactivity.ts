import "server-only";
import { db } from "@/lib/db";
import { getTtsProvider } from "@/lib/tts";
import { getStorageProvider } from "@/lib/storage";
import { contentAudioKey } from "@/lib/audio-content-key";
import { recordVocabularyInteraction } from "@/lib/reflection";
import {
  recordAiUsage,
  estimateTtsCostUsd,
  estimateTtsDurationSeconds,
  trackAiOperation,
} from "@/lib/ai-usage";
import {
  buildFillBlankQuestion,
  buildSentenceOrderQuestion,
  buildVocabularyQuizOptions,
  planVocabularyQuestions,
  seededRandom,
  type VocabularyQuizItem,
} from "@/lib/content/vocabulary-quiz";

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

async function synthesizeAndStore(
  userId: string,
  key: string,
  text: string,
): Promise<string> {
  const tts = getTtsProvider();
  const result = await trackAiOperation(
    { userId, feature: "vocabulary-audio", provider: tts.name },
    () => tts.synthesize(text, VOICE),
  );
  await recordAiUsage({
    userId,
    feature: "vocabulary-audio",
    provider: result.provider,
    model: result.model,
    estimatedCostUsd: estimateTtsCostUsd(text),
    durationSeconds: estimateTtsDurationSeconds(text),
    durationSource: "TEXT_LENGTH_ESTIMATE",
  });
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

  // Content-addressed (see audio-content-key.ts) - reuses an already-paid-for
  // file across reseeds instead of re-generating identical audio.
  const key = contentAudioKey("vocabulary-audio/word", item.chineseForm);
  if (await storage.exists(key)) {
    await db.vocabularyItem.update({
      where: { id: item.id },
      data: { audioFilePath: key },
    });
    return storage.getUrl(key);
  }

  checkRateLimit(userId);
  await synthesizeAndStore(userId, key, item.chineseForm);
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

  const key = contentAudioKey("vocabulary-audio/example", example.chineseText);
  if (await storage.exists(key)) {
    await db.vocabularyExample.update({
      where: { id: example.id },
      data: { audioFilePath: key },
    });
    return storage.getUrl(key);
  }

  checkRateLimit(userId);
  await synthesizeAndStore(userId, key, example.chineseText);
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

export type VocabularyQuizAnswerInput =
  | { type: "OPTION"; optionId: string }
  | { type: "ORDER"; tokens: string[] };

export interface VocabularyQuizAttemptInput {
  vocabularyItemId: string;
  questionKey: string;
  answer: VocabularyQuizAnswerInput;
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
 * Green/red feedback is still shown instantly in the browser, but persisted
 * correctness is recomputed here from the canonical lesson, vocabulary,
 * examples, difficulty and deterministic question plan. The browser submits
 * only the selected option or ordered tokens; it cannot award itself a
 * correct answer or invent a question that affects Reflection/points.
 */
export async function recordVocabularyQuizAttempts(
  userId: string,
  lessonId: string,
  attempts: VocabularyQuizAttemptInput[],
): Promise<void> {
  if (attempts.length === 0) return;
  if (attempts.length > 200) {
    throw new Error("Too many vocabulary answers in one submission.");
  }
  const uniqueKeys = new Set(attempts.map((attempt) => attempt.questionKey));
  if (uniqueKeys.size !== attempts.length) {
    throw new Error("Duplicate vocabulary question in one submission.");
  }

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: {
      scenarioLevel: { select: { difficulty: true } },
      vocabulary: {
        where: { vocabularyItem: { status: "PUBLISHED" } },
        orderBy: { order: "asc" },
        select: {
          vocabularyItem: {
            select: {
              id: true,
              meaning: true,
              pinyin: true,
              chineseForm: true,
              examples: {
                orderBy: { order: "asc" },
                select: { chineseText: true, translation: true },
              },
            },
          },
        },
      },
    },
  });
  if (!lesson) throw new VocabularyInteractivityNotFoundError("Lesson not found.");

  const quizItems: VocabularyQuizItem[] = lesson.vocabulary.map(
    ({ vocabularyItem }) => ({
      id: vocabularyItem.id,
      meaning: vocabularyItem.meaning,
      pinyin: vocabularyItem.pinyin,
      chineseForm: vocabularyItem.chineseForm,
    }),
  );
  const words = new Map(
    lesson.vocabulary.map(({ vocabularyItem }) => [
      vocabularyItem.id,
      vocabularyItem,
    ]),
  );

  const graded = attempts.map((attempt) => {
    if (
      attempt.questionKey.length > 200 ||
      (attempt.answer.type === "OPTION" &&
        attempt.answer.optionId.length > 200) ||
      (attempt.answer.type === "ORDER" &&
        (attempt.answer.tokens.length > 64 ||
          attempt.answer.tokens.some((token) => token.length > 64)))
    ) {
      throw new Error("Invalid vocabulary answer.");
    }
    const word = words.get(attempt.vocabularyItemId);
    if (!word) {
      throw new Error("Vocabulary item does not belong to this lesson.");
    }

    const quickTestKey = `${word.id}:quicktest`;
    const planEntry =
      attempt.questionKey === quickTestKey
        ? { key: quickTestKey, type: "meaning" as const }
        : planVocabularyQuestions(
            word.id,
            lessonId,
            lesson.scenarioLevel.difficulty,
            word.examples.length,
          ).find((entry) => entry.key === attempt.questionKey);
    if (!planEntry) throw new Error("Vocabulary question was not planned.");

    if (planEntry.type === "order") {
      const example = word.examples[planEntry.exampleIndex!];
      const question =
        example &&
        buildSentenceOrderQuestion(
          quizItems,
          word.id,
          example.chineseText,
          example.translation,
          seededRandom(`${word.id}:order:${example.chineseText}`),
        );
      if (!question || attempt.answer.type !== "ORDER") {
        throw new Error("Invalid vocabulary order answer.");
      }
      const isCorrect =
        attempt.answer.tokens.length === question.correctOrder.length &&
        attempt.answer.tokens.every(
          (token, index) => token === question.correctOrder[index],
        );
      return { ...attempt, isCorrect };
    }

    const field = planEntry.type === "chineseForm" ? "chineseForm" : "meaning";
    const example =
      planEntry.type === "blank"
        ? word.examples[planEntry.exampleIndex!]
        : null;
    const options =
      planEntry.type === "blank"
        ? example
          ? buildFillBlankQuestion(
              quizItems,
              word.id,
              example.chineseText,
              undefined,
              seededRandom(`${word.id}:blank:${example.chineseText}`),
            )?.options
          : null
        : buildVocabularyQuizOptions(
            quizItems,
            word.id,
            field,
            undefined,
            seededRandom(`${word.id}:${field}`),
          );
    const optionAnswer = attempt.answer;
    if (
      !options ||
      options.length < 2 ||
      optionAnswer.type !== "OPTION" ||
      !options.some((option) => option.id === optionAnswer.optionId)
    ) {
      throw new Error("Invalid vocabulary option answer.");
    }
    return {
      ...attempt,
      isCorrect: optionAnswer.optionId === word.id,
    };
  });

  await db.vocabularyQuizAttempt.createMany({
    data: graded.map((attempt) => ({
      userId,
      lessonId,
      vocabularyItemId: attempt.vocabularyItemId,
      questionKey: attempt.questionKey,
      isCorrect: attempt.isCorrect,
    })),
  });
}
