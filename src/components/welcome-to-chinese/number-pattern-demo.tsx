"use client";

import { Loader2, Volume2 } from "lucide-react";
import { useHanAudio } from "@/lib/client-han-audio";
import { Caption } from "@/components/ui/typography";
import { cn } from "@/lib/cn";

/**
 * 11-99 is pure arithmetic in Chinese - unlike English's "eleven" (no
 * visible link to "ten"), 十一 is literally 十 (ten) + 一 (one). Three
 * worked examples are enough to show the rule; the full pattern
 * (ones/tens combination) generalizes from here without more content.
 */
const EXAMPLES = [
  { han: "十一", pinyin: "shíyī", breakdown: "十 (10) + 一 (1)", value: "11" },
  { han: "二十", pinyin: "èrshí", breakdown: "二 (2) × 十 (10)", value: "20" },
  {
    han: "二十一",
    pinyin: "èrshíyī",
    breakdown: "二十 (20) + 一 (1)",
    value: "21",
  },
] as const;

export function NumberPatternDemo() {
  const { play, isPending, errorText } = useHanAudio();

  return (
    <div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {EXAMPLES.map((ex) => {
          const pending = isPending(ex.han);
          return (
            <button
              key={ex.han}
              type="button"
              onClick={() => play(ex.han)}
              disabled={pending}
              className="flex flex-col items-start gap-1.5 rounded-card border border-border bg-elevated p-4 text-left transition-colors duration-fast ease-standard hover:border-secondary-400"
            >
              <div className="flex w-full items-center justify-between">
                <span className="font-chinese text-xl font-medium text-text-primary">
                  {ex.han}
                </span>
                {pending ? (
                  <Loader2
                    className="size-4 animate-spin text-text-muted"
                    aria-hidden="true"
                  />
                ) : (
                  <Volume2
                    className="size-4 text-text-muted"
                    aria-hidden="true"
                  />
                )}
              </div>
              <span className={cn("text-supporting text-accent-300")}>
                {ex.pinyin} · {ex.value}
              </span>
              <span className="text-caption text-text-muted">
                {ex.breakdown}
              </span>
            </button>
          );
        })}
      </div>
      <Caption className="mt-3 block">
        {errorText ??
          "Same logic all the way to 99 — no separate word to memorize for each number."}
      </Caption>
    </div>
  );
}
