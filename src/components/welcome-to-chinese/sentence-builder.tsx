"use client";

import { Volume2, Loader2 } from "lucide-react";
import { useHanAudio } from "@/lib/client-han-audio";
import { Button } from "@/components/ui/button";
import { Supporting, Caption } from "@/components/ui/typography";
import { cn } from "@/lib/cn";

export interface SentencePiece {
  han: string;
  pinyin: string;
  /** Visually highlighted (used for the pattern's "load-bearing" piece, e.g. 是). */
  emphasize?: boolean;
}

/** A short sentence built piece by piece (fade-in-up keyframe, app/globals.css), with a real audio replay of the full line. Reused for both the 是 pattern and the age-example below it. */
export function SentenceBuilder({
  pieces,
  fullSentence,
  translation,
  note,
  playLabel = "Play the full sentence",
}: {
  pieces: SentencePiece[];
  /** The exact string passed to useHanAudio - must be one of welcome-audio.ts's allowlisted phrases. */
  fullSentence: string;
  translation: string;
  /** An optional short aside, e.g. flagging a grammar quirk. */
  note?: string;
  playLabel?: string;
}) {
  const { play, isPending, errorText } = useHanAudio();
  const pending = isPending(fullSentence);

  return (
    <div>
      <Button
        type="button"
        variant="secondary"
        onClick={() => play(fullSentence)}
        disabled={pending}
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Volume2 className="size-4" aria-hidden="true" />
        )}
        {playLabel}
      </Button>
      {errorText && <Caption className="mt-2 block">{errorText}</Caption>}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {pieces.map((piece, index) => (
          <div
            key={piece.han}
            style={{ animationDelay: `${index * 160}ms` }}
            className={cn(
              "animate-[fade-in-up_420ms_ease_forwards] rounded-control border border-border bg-elevated px-4 py-3 text-center opacity-0",
              piece.emphasize && "border-primary-400 bg-primary-500/10",
            )}
          >
            <span className="block font-chinese text-xl font-medium text-text-primary">
              {piece.han}
            </span>
            <span className="text-caption text-text-muted">{piece.pinyin}</span>
          </div>
        ))}
      </div>
      <Supporting className="mt-4">&ldquo;{translation}&rdquo;</Supporting>
      {note && <Caption className="mt-1.5 block">{note}</Caption>}
    </div>
  );
}
