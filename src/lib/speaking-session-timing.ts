/**
 * Objective completion is assessment state only; it never ends Speaking.
 * Learners receive the full level-scaled practice window. The character then
 * starts a natural closing line, with a small hard-stop reserve so its audio is
 * not cut off while it is still playing.
 */
export const SPEAKING_CLOSING_RESERVE_MS = 12_000;

export function speakingSessionTiming(hskReference: number | null): {
  naturalCloseAfterMs: number;
  maxSessionMs: number;
} {
  const hsk = hskReference ?? 3;
  const practiceDurationMs =
    hsk <= 1 ? 120_000 : hsk === 2 ? 160_000 : hsk <= 4 ? 240_000 : 300_000;
  return {
    naturalCloseAfterMs: practiceDurationMs,
    maxSessionMs: practiceDurationMs + SPEAKING_CLOSING_RESERVE_MS,
  };
}
