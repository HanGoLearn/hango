"use client";

import { Volume2, Loader2 } from "lucide-react";
import { useHanAudio } from "@/lib/client-han-audio";
import { cn } from "@/lib/cn";

export function SayChip({
  han,
  pinyin,
  meaning,
  say,
  className,
}: {
  han: string;
  pinyin: string;
  meaning?: string;
  /** Overrides what gets spoken - defaults to `han`. Used when the visible text isn't the cleanest thing to speak. */
  say?: string;
  className?: string;
}) {
  const { play, isPending, errorText } = useHanAudio();
  const text = say ?? han;
  const pending = isPending(text);

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={() => play(text)}
        disabled={pending}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-border-strong bg-surface px-4 py-2.5 font-interface text-body text-text-primary transition-colors duration-fast ease-standard hover:border-primary-400",
          "disabled:cursor-wait",
          className,
        )}
      >
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-500 text-on-color-light">
          {pending ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Volume2 className="size-3.5" aria-hidden="true" />
          )}
        </span>
        <span className="font-chinese text-[1.1rem] font-medium">{han}</span>
        <span className="text-supporting text-text-muted">
          {pinyin}
          {meaning ? ` · ${meaning}` : ""}
        </span>
      </button>
      {errorText && (
        <span className="text-caption text-warning-500">{errorText}</span>
      )}
    </div>
  );
}
