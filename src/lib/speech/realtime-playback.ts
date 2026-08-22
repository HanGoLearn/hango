export const CLOSING_AUDIO_RMS_THRESHOLD = 0.0025;
export const CLOSING_AUDIO_SILENCE_MS = 350;
export const CLOSING_AUDIO_MAX_WAIT_MS = 8_000;

export type ClosingPlaybackState = {
  responseDoneAt: number | null;
  audioObserved: boolean;
  lastAudibleAt: number | null;
  playbackStoppedEvent: boolean;
};

/**
 * `response.done` means generation/transport finished, not browser playback.
 * Prefer the Realtime playback-stopped event when it is emitted by the
 * connection; otherwise finish after measured remote-stream silence. The
 * final ceiling prevents an unavailable analyser from trapping the session.
 */
export function shouldFinishClosingPlayback(
  state: ClosingPlaybackState,
  now: number,
): boolean {
  if (state.responseDoneAt == null) return false;
  if (state.playbackStoppedEvent) return true;
  if (
    state.audioObserved &&
    state.lastAudibleAt != null &&
    now - state.lastAudibleAt >= CLOSING_AUDIO_SILENCE_MS
  )
    return true;
  return now - state.responseDoneAt >= CLOSING_AUDIO_MAX_WAIT_MS;
}
