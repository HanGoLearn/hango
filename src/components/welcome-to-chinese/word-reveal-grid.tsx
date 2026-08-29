"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useHanAudio } from "@/lib/client-han-audio";
import { cn } from "@/lib/cn";

export interface RevealWord {
  han: string;
  pinyin: string;
  meaning: string;
}

/** Tap-to-reveal flashcards - no scoring, no "correct/incorrect", just exploration (Welcome to Chinese is explicitly ungraded). */
export function WordRevealGrid({
  words,
  className,
}: {
  words: RevealWord[];
  className?: string;
}) {
  const { play, isPending } = useHanAudio();
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  return (
    <div className={cn("grid grid-cols-3 gap-3 sm:grid-cols-5", className)}>
      {words.map((word, index) => {
        const isRevealed = revealed.has(index);
        const pending = isPending(word.han);
        return (
          <button
            key={word.han}
            type="button"
            onClick={() => {
              setRevealed((prev) => new Set(prev).add(index));
              play(word.han);
            }}
            disabled={pending}
            aria-label={`${word.han}, ${word.pinyin}, ${word.meaning}`}
            className="relative flex aspect-square flex-col items-center justify-center gap-1 overflow-hidden rounded-card border border-border bg-elevated transition-colors duration-fast ease-standard hover:border-secondary-400"
          >
            {pending && (
              <Loader2
                className="absolute top-1.5 right-1.5 size-3 animate-spin text-text-muted"
                aria-hidden="true"
              />
            )}
            <span className="font-chinese text-xl font-medium text-text-primary">
              {word.han}
            </span>
            <span
              className={cn(
                "text-caption text-accent-300 transition-opacity duration-fast",
                isRevealed ? "opacity-100" : "opacity-0",
              )}
            >
              {word.pinyin}
            </span>
            <span
              className={cn(
                "absolute inset-x-0 bottom-0 bg-primary-500 py-1 text-center text-caption text-on-color-light transition-transform duration-base ease-standard",
                isRevealed ? "translate-y-0" : "translate-y-full",
              )}
            >
              {word.meaning}
            </span>
          </button>
        );
      })}
    </div>
  );
}
