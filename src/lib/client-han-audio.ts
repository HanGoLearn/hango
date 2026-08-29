"use client";

import { useCallback, useRef, useState } from "react";
import { getWelcomeAudioAction } from "@/lib/actions/welcome-audio";

/**
 * Real, server-generated Chinese audio for Welcome to Chinese
 * (welcome-audio.ts) - replaced the browser's speechSynthesis (2026-08-24
 * user report: it mispronounced everything on systems with no real
 * Mandarin voice installed). Content-addressed and cached server-side, so
 * only the very first learner to ever tap a given phrase pays for
 * generation - every play after, by anyone, is free and instant.
 *
 * `urlCache` is a plain in-memory Map, not React state - it exists purely
 * to skip a redundant server round-trip for a phrase already resolved
 * earlier in this same page visit; losing it on refresh is fine, the real
 * cache is server-side.
 */
export function useHanAudio() {
  const urlCache = useRef(new Map<string, string>());
  const [pendingText, setPendingText] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  const play = useCallback(async (text: string) => {
    setErrorText(null);
    const cachedUrl = urlCache.current.get(text);
    if (cachedUrl) {
      void new Audio(cachedUrl).play();
      return;
    }

    setPendingText(text);
    const result = await getWelcomeAudioAction(text);
    setPendingText(null);

    if (!result.ok) {
      setErrorText(result.error);
      return;
    }
    urlCache.current.set(text, result.url);
    void new Audio(result.url).play();
  }, []);

  return {
    play,
    isPending: (text: string) => pendingText === text,
    errorText,
  };
}
