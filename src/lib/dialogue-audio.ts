import "server-only";
import { db } from "@/lib/db";
import { getTtsProvider } from "@/lib/tts";
import { getStorageProvider } from "@/lib/storage";
import { mergeWavAudio } from "@/lib/han-speech";

// Generation is cached per line/dialogue (see below) so this only throttles
// the cold-cache path — repeated playback of already-generated audio never
// hits this limit.
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX_GENERATIONS = 30;
const recentGenerationTimestamps = new Map<string, number[]>();

export class DialogueAudioRateLimitError extends Error {}
export class DialogueAudioNotFoundError extends Error {}

function checkRateLimit(userId: string): void {
  const now = Date.now();
  const timestamps = (recentGenerationTimestamps.get(userId) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );
  if (timestamps.length >= RATE_LIMIT_MAX_GENERATIONS) {
    throw new DialogueAudioRateLimitError(
      "You've generated a lot of new audio in a short time. Please wait a bit before continuing.",
    );
  }
  timestamps.push(now);
  recentGenerationTimestamps.set(userId, timestamps);
}

// Fallback alternation for speakers with no confident gender signal (e.g.
// generic role titles like 顾客/客服/服务员) - unchanged from the original
// scheme so those speakers keep exactly their prior behavior. Speakers with
// a `voice` override (see DialogueSpeaker.voice) skip this entirely; that
// pool intentionally never reuses "alloy"/"onyx" so an overridden speaker
// can never collide with a same-dialogue fallback speaker.
const VOICES = ["alloy", "onyx"] as const;

function pickVoice(speaker: { order: number; voice: string | null }): string {
  if (speaker.voice) return speaker.voice;
  return VOICES[speaker.order % VOICES.length] ?? VOICES[0];
}

/** Generates (if missing) and returns the storage key for one line's audio. */
async function ensureLineAudioKey(
  userId: string,
  line: {
    id: string;
    chineseText: string;
    audioFilePath: string | null;
    speaker: { order: number; voice: string | null };
  },
): Promise<string> {
  // Lines generated before the switch to WAV (needed for merging, see
  // getOrGenerateDialogueAudioUrl below) were cached as .mp3 - those are
  // stale and would break mergeWavAudio's format parsing, so they're
  // regenerated here rather than reused.
  if (line.audioFilePath?.endsWith(".wav")) return line.audioFilePath;

  checkRateLimit(userId);

  const tts = getTtsProvider();
  const voice = pickVoice(line.speaker);
  const result = await tts.synthesize(line.chineseText, voice);

  const key = `dialogue-audio/${line.id}.wav`;
  await getStorageProvider().upload(key, result.audio, result.contentType);
  await db.dialogueLine.update({
    where: { id: line.id },
    data: { audioFilePath: key },
  });

  return key;
}

/**
 * Lazily generates and caches a dialogue line's audio (Fase A of the
 * Lesson Interactivity Upgrade — see project/TASKS.md). Generated once per
 * line, on first playback by any learner, then reused for everyone after —
 * not regenerated per session.
 */
export async function getOrGenerateDialogueLineAudioUrl(
  userId: string,
  lineId: string,
): Promise<string> {
  const line = await db.dialogueLine.findUnique({
    where: { id: lineId },
    include: { speaker: true },
  });
  if (!line) {
    throw new DialogueAudioNotFoundError("Dialogue line not found.");
  }

  const key = await ensureLineAudioKey(userId, line);
  return getStorageProvider().getUrl(key);
}

/**
 * Lazily generates and caches one continuous, seekable audio file for an
 * entire dialogue (all lines, in order) — a real `<audio controls>` player
 * needs one scrubbable timeline, which separately-played line clips can't
 * provide. Reuses each line's own cached clip where available; only
 * generates the ones still missing, then merges via the same WAV-merge
 * utility Han's segmented voice replies already use.
 */
export async function getOrGenerateDialogueAudioUrl(
  userId: string,
  dialogueId: string,
): Promise<string> {
  const dialogue = await db.dialogue.findUnique({
    where: { id: dialogueId },
    include: {
      lines: { orderBy: { order: "asc" }, include: { speaker: true } },
    },
  });
  if (!dialogue) {
    throw new DialogueAudioNotFoundError("Dialogue not found.");
  }
  if (dialogue.lines.length === 0) {
    throw new DialogueAudioNotFoundError("Dialogue has no lines.");
  }

  const storage = getStorageProvider();

  if (dialogue.audioFilePath) {
    return storage.getUrl(dialogue.audioFilePath);
  }

  const lineKeys: string[] = [];
  for (const line of dialogue.lines) {
    lineKeys.push(await ensureLineAudioKey(userId, line));
  }

  const clips = await Promise.all(lineKeys.map((key) => storage.download(key)));
  // A real pause between speaker turns, not a hard cut - see mergeWavAudio.
  const TURN_GAP_MS = 450;
  const merged = mergeWavAudio(
    clips.map((buffer) => new Uint8Array(buffer).slice().buffer),
    TURN_GAP_MS,
  );

  const mergedKey = `dialogue-audio/${dialogueId}-full.wav`;
  await storage.upload(mergedKey, Buffer.from(merged), "audio/wav");
  await db.dialogue.update({
    where: { id: dialogueId },
    data: { audioFilePath: mergedKey },
  });

  return storage.getUrl(mergedKey);
}
