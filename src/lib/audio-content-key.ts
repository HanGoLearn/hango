import "server-only";
import { createHash } from "node:crypto";

/**
 * A content-addressed storage key for generated speech (2026-08-23, cost
 * audit): every audio-generation flow used to key its cached file by the
 * database row's id (dialogue-audio/${line.id}.wav). Re-seeding a lesson
 * (`createFullLesson` in prisma/seed.ts) deletes and recreates every row
 * with a fresh id, which silently orphaned every already-paid-for OpenAI
 * TTS file - a fresh `npm run db:seed` (e.g. a new teammate's first setup)
 * started with zero cached audio and re-paid for identical text.
 *
 * Keying by a hash of the exact text being spoken instead means the same
 * words always resolve to the same file regardless of which row currently
 * references them - a reseed, or two different rows that happen to speak
 * the same line, both reuse one generation instead of paying twice.
 * `namespace` must include everything besides the text that changes the
 * actual audio output (voice, pace/difficulty) so two different-sounding
 * renditions of the same words never collide on one key.
 */
export function contentAudioKey(namespace: string, text: string): string {
  const hash = createHash("sha256").update(text).digest("hex").slice(0, 24);
  return `${namespace}/${hash}.wav`;
}
