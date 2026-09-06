import "server-only";
import { db } from "@/lib/db";
import { getTtsProvider } from "@/lib/tts";
import { getStorageProvider } from "@/lib/storage";
import { mergeWavAudio } from "@/lib/han-speech";
import { contentAudioKey } from "@/lib/audio-content-key";
import {
  recordAiUsage,
  checkDailyUsageCap,
  estimateTtsCostUsd,
  estimateTtsDurationSeconds,
} from "@/lib/ai-usage";

// Mirrors dialogue-audio.ts's rate limit exactly - same abuse/cost
// protection rationale, generation is cached so this only throttles the
// cold-cache path.
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX_GENERATIONS = 30;
const recentGenerationTimestamps = new Map<string, number[]>();

export class PlacementAudioRateLimitError extends Error {}
export class PlacementAudioNotFoundError extends Error {}

function checkRateLimit(userId: string): void {
  const now = Date.now();
  const timestamps = (recentGenerationTimestamps.get(userId) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );
  if (timestamps.length >= RATE_LIMIT_MAX_GENERATIONS) {
    throw new PlacementAudioRateLimitError(
      "You've generated a lot of new audio in a short time. Please wait a bit before continuing.",
    );
  }
  timestamps.push(now);
  recentGenerationTimestamps.set(userId, timestamps);
}

// Same fallback voice pair as dialogue-audio.ts for a speaker with no
// explicit gender-appropriate override - the seeded HSK1-2 scripts always
// set voice explicitly (echo for 男, nova for 女), so this only matters for
// future content that doesn't.
const FALLBACK_VOICES = ["alloy", "onyx"] as const;

function pickVoice(line: { order: number; voice: string | null }): string {
  if (line.voice) return line.voice;
  return (
    FALLBACK_VOICES[line.order % FALLBACK_VOICES.length] ?? FALLBACK_VOICES[0]
  );
}

/**
 * Pace guidance per HSK level (2026-08-16 user feedback: HSK1 and HSK2
 * listening sounded the same). Mirrors describeSpeakingDifficulty()'s
 * existing per-level pacing language (ai-context.ts) so the voice
 * curriculum stays consistent between Speaking role-play and this exam.
 */
function pacingInstructionsForLevel(hskLevel: number): string {
  if (hskLevel <= 1) {
    return "Speak this line slowly and clearly, with a brief natural pause between phrases - this is a true-beginner listening exercise. Do not add anything else.";
  }
  return "Speak this line at a natural, normal conversational pace - not slowed down for beginners, but not rushed or native-fast either. Do not add anything else.";
}

async function ensureLineAudioKey(
  userId: string,
  line: {
    id: string;
    chineseText: string;
    audioFilePath: string | null;
    order: number;
    voice: string | null;
  },
  hskLevel: number,
): Promise<string> {
  const storage = getStorageProvider();
  const voice = pickVoice(line);
  // Content-addressed (see audio-content-key.ts) - reuses an already-paid-for
  // file across reseeds instead of re-generating identical audio.
  const key = contentAudioKey(
    `placement-audio/${voice}/hsk${hskLevel}`,
    line.chineseText,
  );

  // Only trust a cached path if it's exactly THIS content-addressed key -
  // never a stale `placement-audio/${line.id}.wav` path from before the
  // 2026-08-23 content-addressing refactor. That old scheme trusted
  // whatever was cached under the line's own id blindly, which included
  // MockTtsProvider's silent placeholder (src/lib/tts/providers/mock.ts,
  // used whenever OPENAI_API_KEY is unset) from a run where the key wasn't
  // configured - once cached, it was served as real audio forever
  // (2026-08-27 bug: several Listening questions produced no sound at all).
  // A mismatched/legacy path now falls through and regenerates for real.
  if (line.audioFilePath === key) return key;

  if (await storage.exists(key)) {
    await db.placementListeningLine.update({
      where: { id: line.id },
      data: { audioFilePath: key },
    });
    return key;
  }

  checkRateLimit(userId);
  await checkDailyUsageCap(userId, "placement-listening-audio");

  const tts = getTtsProvider();
  const result = await tts.synthesize(
    line.chineseText,
    voice,
    pacingInstructionsForLevel(hskLevel),
  );
  await recordAiUsage({
    userId,
    feature: "placement-listening-audio",
    provider: result.provider,
    model: result.model,
    estimatedCostUsd: estimateTtsCostUsd(line.chineseText),
    durationSeconds: estimateTtsDurationSeconds(line.chineseText),
    durationSource: "TEXT_LENGTH_ESTIMATE",
  });

  await storage.upload(key, result.audio, result.contentType);
  await db.placementListeningLine.update({
    where: { id: line.id },
    data: { audioFilePath: key },
  });

  return key;
}

/**
 * Lazily generates and caches one continuous, seekable audio clip for a
 * placement Listening question - same generate-once-cache-forever pattern
 * as getOrGenerateDialogueAudioUrl (dialogue-audio.ts): the script is
 * static exam content, not per-learner, so it's generated once ever and
 * reused for every test-taker after that.
 */
export async function getOrGeneratePlacementListeningAudioUrl(
  userId: string,
  questionId: string,
): Promise<string> {
  const script = await db.placementListeningScript.findUnique({
    where: { questionId },
    include: {
      lines: { orderBy: { order: "asc" } },
      question: { select: { hskLevel: true } },
    },
  });
  if (!script) {
    throw new PlacementAudioNotFoundError("Listening script not found.");
  }
  if (script.lines.length === 0) {
    throw new PlacementAudioNotFoundError("Listening script has no lines.");
  }

  const storage = getStorageProvider();
  if (script.audioFilePath) {
    return storage.getUrl(script.audioFilePath);
  }

  const lineKeys: string[] = [];
  for (const line of script.lines) {
    lineKeys.push(
      await ensureLineAudioKey(userId, line, script.question.hskLevel),
    );
  }

  const clips = await Promise.all(lineKeys.map((key) => storage.download(key)));
  const TURN_GAP_MS = 450;
  const merged = mergeWavAudio(
    clips.map((buffer) => new Uint8Array(buffer).slice().buffer),
    TURN_GAP_MS,
  );

  const mergedKey = `placement-audio/${script.id}-full.wav`;
  await storage.upload(mergedKey, Buffer.from(merged), "audio/wav");
  await db.placementListeningScript.update({
    where: { id: script.id },
    data: { audioFilePath: mergedKey },
  });

  return storage.getUrl(mergedKey);
}
