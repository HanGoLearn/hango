import "server-only";
import { getTtsProvider } from "@/lib/tts";
import { getStorageProvider } from "@/lib/storage";
import { contentAudioKey } from "@/lib/audio-content-key";
import {
  recordAiUsage,
  estimateTtsCostUsd,
  estimateTtsDurationSeconds,
  trackAiOperation,
} from "@/lib/ai-usage";

/**
 * Real, content-addressed TTS for Welcome to Chinese - same mechanism as
 * vocabulary/dialogue/grammar audio (audio-content-key.ts), not the
 * browser's speechSynthesis this page started with. That first version
 * mispronounced everything when a system had no real Mandarin voice
 * installed (2026-08-24 user report) - this generates once, for real,
 * through the same paid TTS provider every other lesson uses, then serves
 * the cached file to every learner after at zero further cost.
 *
 * A fixed allowlist, not arbitrary text: this page's content is
 * hand-authored, not database-backed, so there's no VocabularyItem-style
 * row to key generation off of. Restricting to exactly the phrases this
 * page actually uses keeps this from becoming an open, abusable
 * text-to-speech endpoint.
 */
const WELCOME_PHRASES = new Set([
  "你好",
  "再见",
  "谢谢",
  "不客气",
  "对不起",
  "没关系",
  "妈",
  "麻",
  "马",
  "骂",
  "我",
  "你",
  "他",
  "她",
  "我们",
  "你们",
  "他们",
  "她们",
  "一",
  "二",
  "三",
  "四",
  "五",
  "六",
  "七",
  "八",
  "九",
  "十",
  "十一",
  "二十",
  "二十一",
  "我是学生",
  "我十八岁",
]);

export class WelcomeAudioNotAllowedError extends Error {}

const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX_GENERATIONS = 30;
const recentGenerationTimestamps = new Map<string, number[]>();

export class WelcomeAudioRateLimitError extends Error {}

function checkRateLimit(userId: string): void {
  const now = Date.now();
  const timestamps = (recentGenerationTimestamps.get(userId) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );
  if (timestamps.length >= RATE_LIMIT_MAX_GENERATIONS) {
    throw new WelcomeAudioRateLimitError(
      "You've generated a lot of new audio in a short time. Please wait a bit before continuing.",
    );
  }
  timestamps.push(now);
  recentGenerationTimestamps.set(userId, timestamps);
}

// Same single narration voice as vocabulary-interactivity.ts - one
// consistent speaker, not a scene with multiple dialogue characters.
const VOICE = "alloy";

/** Generated once per unique phrase (content-addressed key), reused by every learner after. */
export async function getOrGenerateWelcomeAudioUrl(
  userId: string,
  text: string,
): Promise<string> {
  if (!WELCOME_PHRASES.has(text)) {
    throw new WelcomeAudioNotAllowedError("That phrase isn't recognized.");
  }

  const storage = getStorageProvider();
  const key = contentAudioKey("welcome-audio", text);

  if (await storage.exists(key)) {
    return storage.getUrl(key);
  }

  checkRateLimit(userId);
  const tts = getTtsProvider();
  const result = await trackAiOperation(
    { userId, feature: "welcome-audio", provider: tts.name },
    () => tts.synthesize(text, VOICE),
  );
  await recordAiUsage({
    userId,
    feature: "welcome-audio",
    provider: result.provider,
    model: result.model,
    estimatedCostUsd: estimateTtsCostUsd(text),
    durationSeconds: estimateTtsDurationSeconds(text),
    durationSource: "TEXT_LENGTH_ESTIMATE",
  });
  await storage.upload(key, result.audio, result.contentType);

  return storage.getUrl(key);
}
