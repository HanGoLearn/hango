import { describe, expect, it } from "vitest";
import {
  CLOSING_AUDIO_MAX_WAIT_MS,
  CLOSING_AUDIO_SILENCE_MS,
  shouldFinishClosingPlayback,
} from "@/lib/speech/realtime-playback";

describe("shouldFinishClosingPlayback", () => {
  it("keeps the microphone gated after response.done while role-play audio is still audible", () => {
    expect(
      shouldFinishClosingPlayback(
        {
          responseDoneAt: 1_000,
          audioObserved: true,
          lastAudibleAt: 1_300,
          playbackStoppedEvent: false,
        },
        1_300 + CLOSING_AUDIO_SILENCE_MS - 1,
      ),
    ).toBe(false);
  });

  it("finishes on the precise playback-stopped event", () => {
    expect(
      shouldFinishClosingPlayback(
        {
          responseDoneAt: 1_000,
          audioObserved: false,
          lastAudibleAt: null,
          playbackStoppedEvent: true,
        },
        1_001,
      ),
    ).toBe(true);
  });

  it("falls back to measured remote-stream silence", () => {
    expect(
      shouldFinishClosingPlayback(
        {
          responseDoneAt: 1_000,
          audioObserved: true,
          lastAudibleAt: 1_250,
          playbackStoppedEvent: false,
        },
        1_250 + CLOSING_AUDIO_SILENCE_MS,
      ),
    ).toBe(true);
  });

  it("has a final ceiling if browser playback signals are unavailable", () => {
    expect(
      shouldFinishClosingPlayback(
        {
          responseDoneAt: 1_000,
          audioObserved: false,
          lastAudibleAt: null,
          playbackStoppedEvent: false,
        },
        1_000 + CLOSING_AUDIO_MAX_WAIT_MS,
      ),
    ).toBe(true);
  });
});
