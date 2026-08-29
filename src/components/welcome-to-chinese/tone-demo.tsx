"use client";

import { Loader2 } from "lucide-react";
import { useHanAudio } from "@/lib/client-han-audio";
import { Caption } from "@/components/ui/typography";
import { cn } from "@/lib/cn";

/** The classic mā/má/mǎ/mà demonstration - one syllable, four tones, four unrelated real words. */
const TONES = [
  { han: "妈", pinyin: "mā", tone: "tone 1", meaning: "mom", contour: "M4 6 L36 6" },
  { han: "麻", pinyin: "má", tone: "tone 2", meaning: "hemp", contour: "M4 14 L36 4" },
  {
    han: "马",
    pinyin: "mǎ",
    tone: "tone 3",
    meaning: "horse",
    contour: "M4 8 Q 14 18 20 12 Q 26 6 36 2",
  },
  { han: "骂", pinyin: "mà", tone: "tone 4", meaning: "scold", contour: "M4 2 L36 16" },
] as const;

export function ToneDemo() {
  const { play, isPending, errorText } = useHanAudio();

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {TONES.map((t) => {
          const pending = isPending(t.han);
          return (
            <button
              key={t.han}
              type="button"
              onClick={() => play(t.han)}
              disabled={pending}
              className={cn(
                "flex flex-col items-start gap-2 rounded-card border border-border bg-elevated p-4 text-left transition-all duration-fast ease-standard hover:border-secondary-400 hover:-translate-y-0.5",
                pending &&
                  "border-primary-400 shadow-[0_0_0_3px_rgba(196,42,62,0.25)]",
              )}
            >
              <div className="flex h-5 w-10 items-center">
                {pending ? (
                  <Loader2
                    className="size-4 animate-spin text-primary-400"
                    aria-hidden="true"
                  />
                ) : (
                  <svg viewBox="0 0 40 20" className="h-5 w-10">
                    <path
                      d={t.contour}
                      stroke="var(--color-primary-400)"
                      strokeWidth="2.5"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </div>
              <span className="font-chinese text-2xl font-medium text-text-primary">
                {t.han}
              </span>
              <span className="text-supporting text-accent-300">
                {t.pinyin} · {t.tone}
              </span>
              <span className="text-caption text-text-muted">{t.meaning}</span>
            </button>
          );
        })}
      </div>
      <Caption className="mt-4 block">
        {errorText ?? "🔊 Tap a card to hear it — the first tap generates it for everyone, every one after is instant."}
      </Caption>
    </div>
  );
}
