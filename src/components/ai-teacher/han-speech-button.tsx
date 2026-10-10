"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Pause, Volume2 } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";

export function HanSpeechButton({
  text,
  voice,
  autoPlay = false,
  responseLanguage,
  speechStyle = "tutor",
  labels,
}: {
  text: string;
  voice: string;
  autoPlay?: boolean;
  responseLanguage?: "English" | "Spanish" | "Chinese";
  speechStyle?: "tutor" | "companion";
  labels?: {
    listen: string;
    pause: string;
    unavailable: string;
  };
}) {
  const [state, setState] = useState<"idle" | "loading" | "playing">("idle");
  const [error, setError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const autoPlayedRef = useRef(false);

  useEffect(() => {
    audioRef.current?.pause();
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    audioRef.current = null;
    audioUrlRef.current = null;

    return () => {
      audioRef.current?.pause();
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    };
  }, [responseLanguage, speechStyle, text, voice]);

  const play = useCallback(async () => {
    setError(false);
    if (audioRef.current && audioUrlRef.current) {
      await audioRef.current.play();
      return;
    }

    setState("loading");
    try {
      const response = await fetch("/api/han/speech", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          text,
          voice,
          responseLanguage,
          delivery: speechStyle,
        }),
      });
      if (!response.ok) throw new Error("speech failed");
      const url = URL.createObjectURL(await response.blob());
      const audio = new Audio(url);
      audioUrlRef.current = url;
      audioRef.current = audio;
      audio.onplay = () => setState("playing");
      audio.onpause = () => setState("idle");
      audio.onended = () => setState("idle");
      audio.onerror = () => {
        setState("idle");
        setError(true);
      };
      await audio.play();
    } catch {
      setState("idle");
      setError(true);
    }
  }, [responseLanguage, speechStyle, text, voice]);

  useEffect(() => {
    if (autoPlay && !autoPlayedRef.current) {
      autoPlayedRef.current = true;
      void play();
    }
  }, [autoPlay, play]);

  function toggle() {
    if (state === "playing") audioRef.current?.pause();
    else void play();
  }

  return (
    <div className="flex items-center gap-1">
      <IconButton
        type="button"
        icon={
          state === "loading" ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : state === "playing" ? (
            <Pause className="size-3.5" aria-hidden="true" />
          ) : (
            <Volume2 className="size-3.5" aria-hidden="true" />
          )
        }
        aria-label={
          state === "playing"
            ? (labels?.pause ?? "Pause Han")
            : (labels?.listen ?? "Listen to Han")
        }
        disabled={state === "loading"}
        onClick={toggle}
        className="size-7"
      />
      {error && (
        <span
          className="font-interface text-caption text-error-500"
          role="alert"
        >
          {labels?.unavailable ?? "Voice unavailable"}
        </span>
      )}
    </div>
  );
}
