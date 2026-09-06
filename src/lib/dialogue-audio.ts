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
// generic role titles like 顾客/客服/服务员). Speakers with a `voice`
// override (see DialogueSpeaker.voice) skip this entirely - no seeded
// dialogue actually sets one today, so there's no live collision risk to
// preserve by avoiding these two IDs.
//
// Swapped from "alloy"/"onyx" to "cedar"/"marin" (2026-08-23, user
// feedback): the older voices read scripted emotion (哈哈, 真好) flatly,
// like pronouncing the word rather than performing it - "cedar" was
// already chosen for Han's own voice for sounding more natural, so this
// pilots the same upgrade for dialogue speakers.
const VOICES = ["cedar", "marin"] as const;

type LessonDifficulty =
  "BEGINNER" | "INTERMEDIATE" | "UPPER_INTERMEDIATE" | "ADVANCED";

// Pace scales with the lesson's level (2026-08-23, user request): "natural
// conversational speed" is the whole point at Advanced, but the same
// instruction would outrun a Beginner's ability to follow along during
// Comprehension's "listen before you read" step - full native speed serves
// nobody if the learner can't parse a word of it.
const PACE_BY_DIFFICULTY: Record<LessonDifficulty, string> = {
  BEGINNER:
    "Speak noticeably slower than normal conversational speed, with clear, unhurried enunciation of every syllable - a real person speaking clearly to someone still learning the language, not rushed native speed.",
  INTERMEDIATE:
    "Speak at a relaxed, slightly slower than fully natural pace, still clearly enunciated.",
  UPPER_INTERMEDIATE: "Speak at a natural conversational pace.",
  ADVANCED: "Speak at full natural native conversational speed and rhythm.",
};

/**
 * A line-specific delivery note, layered on top of the shared instruction
 * below (2026-08-23, user request: "more emotion" after a flat first pass).
 * Deliberately narrow and literal (real question -> real curiosity; a
 * natural-reaction opener -> land it as a genuine beat) rather than asking
 * for a broad emotion like excitement or laughter - forcing 哈哈/真好 to
 * sound genuinely amused or surprised didn't work even with more specific
 * instructions and a more expressive voice (see VOICES above), so this
 * stays inside what a TTS model can actually do: shape real intonation on
 * real words, not perform a reaction that isn't in the text.
 */
function buildEmotionNote(chineseText: string): string {
  const trimmed = chineseText.trim();
  if (trimmed.endsWith("吗？") || trimmed.endsWith("呢？")) {
    return "This is a real question, not a recitation - let genuine curiosity and interest come through in the rising intonation.";
  }
  if (/^(嗯|哦|啊)/.test(trimmed)) {
    return "The opening word is a real, natural reaction, not a performed sound effect - let it land as a brief, unhurried, genuine beat before continuing.";
  }
  return "";
}

/**
 * Pilot (2026-08-23, user request): the default TTS instructions
 * (src/lib/tts/providers/openai.ts) are generic across dialogue, vocabulary,
 * and grammar audio - fine for a single word read clearly, but it reads
 * scenario dialogue flat, like a phrasebook rather than two people talking.
 * This overrides it for dialogue lines specifically, pushing for real
 * conversational warmth and natural pitch movement, while still forbidding
 * invented words/sounds (TTS models can hallucinate extra speech otherwise).
 */
function buildDialogueLineInstructions(
  difficulty: LessonDifficulty,
  chineseText: string,
): string {
  const pace = PACE_BY_DIFFICULTY[difficulty];
  const emotionNote = buildEmotionNote(chineseText);
  return `Speak this line as one turn in a warm, casual conversation between close friends - real pitch rise on questions and relaxed warmth on statements, the way a person actually talks, not a flat phrasebook reading. ${pace}${emotionNote ? ` ${emotionNote}` : ""} Do not add any words, filler, or sounds beyond exactly the given text.`;
}

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
  difficulty: LessonDifficulty,
): Promise<string> {
  // Lines generated before the switch to WAV (needed for merging, see
  // getOrGenerateDialogueAudioUrl below) were cached as .mp3 - those are
  // stale and would break mergeWavAudio's format parsing, so they're
  // regenerated here rather than reused.
  if (line.audioFilePath?.endsWith(".wav")) return line.audioFilePath;

  const storage = getStorageProvider();
  const voice = pickVoice(line.speaker);
  // Content-addressed (see audio-content-key.ts) - a reseed recreates this
  // row with a fresh id, but the exact same Chinese text + voice + pace
  // resolves to the exact same key, so an already-generated file is reused
  // instead of re-paying OpenAI for identical words.
  const key = contentAudioKey(
    `dialogue-audio/${voice}/${difficulty}`,
    line.chineseText,
  );
  if (await storage.exists(key)) {
    await db.dialogueLine.update({
      where: { id: line.id },
      data: { audioFilePath: key },
    });
    return key;
  }

  checkRateLimit(userId);
  await checkDailyUsageCap(userId, "dialogue-audio");

  const tts = getTtsProvider();
  const result = await tts.synthesize(
    line.chineseText,
    voice,
    buildDialogueLineInstructions(difficulty, line.chineseText),
  );
  await recordAiUsage({
    userId,
    feature: "dialogue-audio",
    provider: result.provider,
    model: result.model,
    estimatedCostUsd: estimateTtsCostUsd(line.chineseText),
    durationSeconds: estimateTtsDurationSeconds(line.chineseText),
    durationSource: "TEXT_LENGTH_ESTIMATE",
  });

  await storage.upload(key, result.audio, result.contentType);
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
    include: {
      speaker: true,
      dialogue: {
        include: { lesson: { include: { scenarioLevel: true } } },
      },
    },
  });
  if (!line) {
    throw new DialogueAudioNotFoundError("Dialogue line not found.");
  }

  const difficulty = line.dialogue.lesson.scenarioLevel
    .difficulty as LessonDifficulty;
  const key = await ensureLineAudioKey(userId, line, difficulty);
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
      lesson: { include: { scenarioLevel: true } },
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

  const difficulty = dialogue.lesson.scenarioLevel
    .difficulty as LessonDifficulty;
  const lineKeys: string[] = [];
  for (const line of dialogue.lines) {
    lineKeys.push(await ensureLineAudioKey(userId, line, difficulty));
  }

  const clips = await Promise.all(lineKeys.map((key) => storage.download(key)));
  // A real pause between speaker turns, not a hard cut - see mergeWavAudio.
  // Raised from 450ms (2026-08-23, user feedback): back-to-back turns felt
  // like neither speaker had time to actually think before answering.
  const TURN_GAP_MS = 700;
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
