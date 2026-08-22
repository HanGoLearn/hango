"use client";

import { useRef, useState } from "react";
import { AlertCircle, Loader2, Play, Square } from "lucide-react";
import { cn } from "@/lib/cn";

type AudioState = "idle" | "loading" | "playing" | "error";

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
}: {
  fetchUrl: () => Promise<{ ok: boolean; url?: string; error?: string }>;
  label: string;
  size?: "sm" | "md";
}) {
  const [state, setState] = useState<AudioState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
      setErrorMessage(result.error ?? "Couldn't load audio.");
      return;
    }
    const audio = new Audio(result.url);
    audio.onplay = () => setState("playing");
    audio.onended = () => setState("idle");
    audio.onpause = () => setState("idle");
    audio.onerror = () => {
      setState("error");
      setErrorMessage("This audio file couldn't be played.");
    };
    audioRef.current = audio;
    void audio.play();
  }

  function toggle(event: React.MouseEvent) {
    event.stopPropagation();
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
          ? `Stop ${label}`
          : state === "error"
            ? `${errorMessage ?? "Couldn't load audio"} - tap to retry playing ${label}`
            : `Play ${label}`
      }
      title={state === "error" ? (errorMessage ?? "Couldn't load audio - tap to retry") : undefined}
      disabled={state === "loading"}
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
      ) : state === "error" ? (
        <AlertCircle className="size-3" aria-hidden="true" />
      ) : (
        <Play className="size-3 translate-x-0.5" aria-hidden="true" />
      )}
    </button>
  );
}
