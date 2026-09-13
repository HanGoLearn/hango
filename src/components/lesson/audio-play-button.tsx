"use client";

import { useRef, useState } from "react";
import { AlertCircle, Check, Loader2, Play, Square } from "lucide-react";
import { cn } from "@/lib/cn";
import { useLessonMessages } from "@/components/lesson/lesson-messages";
import { formatMessage } from "@/i18n/format";

type AudioState = "idle" | "loading" | "playing" | "error" | "used-up";

/**
 * A small "play this cached audio" button - shared shape across every
 * generate-once-cache audio feature (dialogue lines, vocabulary words/
 * examples, grammar examples). Extracted from vocabulary-step.tsx (Phase B)
 * when grammar-step.tsx (Phase E) needed the exact same behavior a third
 * time. Each instance owns its own audio element independently.
 */
export function AudioPlayButton({
  fetchUrl,
  label,
  size = "sm",
  maxPlays,
}: {
  fetchUrl: () => Promise<{ ok: boolean; url?: string; error?: string }>;
  label: string;
  size?: "sm" | "md";
  /** Undefined (default) means unlimited replay, matching every existing
   * caller (vocabulary, dialogue, Welcome to Chinese audio all replay
   * freely). Set to 1 for a real listening-exam condition (placement exam
   * Listening, 2026-08-27) - once a play has started, the button disables
   * permanently instead of allowing pause/resume/replay. */
  maxPlays?: number;
}) {
  const messages = useLessonMessages();
  const [state, setState] = useState<AudioState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playsUsedRef = useRef(0);

  async function play() {
    if (audioRef.current) {
      setState("playing");
      void audioRef.current.play();
      return;
    }
    setState("loading");
    setErrorMessage(null);
    const result = await fetchUrl();
    if (!result.ok || !result.url) {
      setState("error");
      // The generation call succeeded/failed server-side with a real reason
      // (e.g. a TTS quota/billing error) - surface it instead of silently
      // reverting to the idle Play icon, which used to look identical to
      // "never clicked" (2026-08-19 fix - a real failure was indistinguishable
      // from doing nothing, see project/TASKS.md).
      setErrorMessage(result.error ?? messages.audio.couldntLoad);
      return;
    }
    playsUsedRef.current += 1;
    const audio = new Audio(result.url);
    audio.onplay = () => setState("playing");
    audio.onended = () =>
      setState(
        maxPlays != null && playsUsedRef.current >= maxPlays
          ? "used-up"
          : "idle",
      );
    audio.onpause = () =>
      setState(
        maxPlays != null && playsUsedRef.current >= maxPlays
          ? "used-up"
          : "idle",
      );
    audio.onerror = () => {
      setState("error");
      setErrorMessage(messages.audio.couldntPlay);
    };
    audioRef.current = audio;
    void audio.play();
  }

  function toggle(event: React.MouseEvent) {
    event.stopPropagation();
    if (state === "used-up") return;
    if (state === "playing") {
      audioRef.current?.pause();
      return;
    }
    if (state === "loading") return;
    void play();
  }

  return (
    <button
      type="button"
      aria-label={
        state === "playing"
          ? formatMessage(messages.audio.stop, { label })
          : state === "used-up"
            ? formatMessage(messages.audio.alreadyPlayed, { label })
            : state === "error"
              ? formatMessage(messages.audio.retry, {
                  error: errorMessage ?? messages.audio.couldntLoad,
                  label,
                })
              : formatMessage(messages.audio.play, { label })
      }
      title={
        state === "used-up"
          ? messages.audio.alreadyPlayedTitle
          : state === "error"
            ? (errorMessage ?? messages.audio.retryTitle)
            : undefined
      }
      disabled={state === "loading" || state === "used-up"}
      onClick={toggle}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full text-page transition-opacity duration-fast ease-standard hover:opacity-90 disabled:opacity-60",
        state === "error" ? "bg-error-500" : "bg-accent-300",
        size === "sm" ? "size-6" : "size-8",
      )}
    >
      {state === "loading" ? (
        <Loader2 className="size-3 animate-spin" aria-hidden="true" />
      ) : state === "playing" ? (
        <Square className="size-3" aria-hidden="true" />
      ) : state === "used-up" ? (
        <Check className="size-3" aria-hidden="true" />
      ) : state === "error" ? (
        <AlertCircle className="size-3" aria-hidden="true" />
      ) : (
        <Play className="size-3 translate-x-0.5" aria-hidden="true" />
      )}
    </button>
  );
}
