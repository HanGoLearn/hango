import { cn } from "@/lib/cn";
import {
  alignCharactersWithPinyin,
  type SyllableScore,
} from "@/lib/tone-analysis";

const PASS_THRESHOLD = 55;

/**
 * Shades each Chinese character green/red based on its own tone-match score
 * (Speaking Lab Shadowing redesign, 2026-08-08) - lets a learner see exactly
 * which syllables landed and which didn't, instead of one overall number.
 * Characters not yet scored (no attempt yet, or `syllableScores` is null)
 * render neutral, not red - never implies failure without evidence.
 */
export function CharacterToneFeedback({
  text,
  pinyin,
  syllableScores,
  showPinyin,
  className,
  onColorFill = false,
}: {
  text: string;
  pinyin: string;
  syllableScores: SyllableScore[] | null;
  showPinyin: boolean;
  className?: string;
  /**
   * True when rendered inside a solid, non-inverting brand fill (e.g.
   * ConversationShadowing's isRight bubble, bg-primary-900) instead of the
   * default page/surface context - text-text-secondary/text-text-primary
   * invert per theme and go unreadable against a fill that doesn't (the
   * same on-color-token bug fixed elsewhere this session). Swaps to the
   * fixed text-on-color-light tokens instead.
   */
  onColorFill?: boolean;
}) {
  const characters = alignCharactersWithPinyin(text, pinyin);
  let syllableIndex = 0;

  return (
    <div
      lang="zh"
      className={cn("flex flex-wrap items-end gap-x-0.5 gap-y-1.5", className)}
    >
      {characters.map((character, index) => {
        if (!character.isSyllable) {
          return (
            <span
              key={index}
              className={cn(
                "self-end pb-1 font-chinese text-chinese-body",
                onColorFill ? "text-on-color-light/85" : "text-text-secondary",
              )}
            >
              {character.char}
            </span>
          );
        }

        const score = syllableScores?.[syllableIndex]?.score ?? null;
        syllableIndex++;

        return (
          <span
            key={index}
            className={cn(
              "flex flex-col items-center rounded-control px-1 py-0.5",
              score !== null &&
                (score >= PASS_THRESHOLD
                  ? "bg-success-500/20"
                  : "bg-error-500/20"),
            )}
          >
            {showPinyin && (
              <span
                className={cn(
                  "font-interface text-caption",
                  onColorFill ? "text-on-color-light/85" : "text-text-secondary",
                )}
              >
                {character.pinyin}
              </span>
            )}
            <span
              className={cn(
                "font-chinese text-chinese-body font-medium",
                onColorFill ? "text-on-color-light" : "text-text-primary",
              )}
            >
              {character.char}
            </span>
          </span>
        );
      })}
    </div>
  );
}
