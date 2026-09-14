"use client";

import { useState } from "react";
import {
  Sprout,
  MessageCircle,
  MessagesSquare,
  Users,
  Briefcase,
  GraduationCap,
  HelpCircle,
} from "lucide-react";
import { saveLevelStepAction } from "@/lib/actions/onboarding";
import { RadioGroup } from "@/components/ui/radio-group";
import { RadioTile } from "@/components/onboarding/option-tile";
import { Button } from "@/components/ui/button";
import { InformationBanner } from "@/components/ui/banner";
import { SectionTitle } from "@/components/ui/typography";
import { HanMascot } from "@/components/ui/han-mascot";
import { cn } from "@/lib/cn";
import type { AppLocale } from "@/i18n/config";
import type { OnboardingMessages } from "@/i18n/messages/types";

// Increasing height per bar (2026-08-28: "que crezcan verticalmente ... se
// ve como progreso para arriba") - a staircase read as growing progress,
// not just a row of equal-height segments changing color. Shrunk overall
// twice now ("muy grandes", then "muy altas") - 4px wide, capped at 10px
// tall so it sits comfortably inside the single-line row layout.
const LEVEL_BAR_HEIGHTS = ["h-1", "h-1.5", "h-2", "h-2.5", "h-3"];

/** Small filled-segment meter next to each level's label (2026-08-28, "para que sea mas didactico") - purely decorative reinforcement of the label/description, so it's aria-hidden. */
function LevelBars({ filled }: { filled: number }) {
  return (
    <span className="flex shrink-0 items-end gap-0.5" aria-hidden="true">
      {LEVEL_BAR_HEIGHTS.map((height, i) => (
        <span
          key={i}
          className={cn(
            "w-1 rounded-full",
            height,
            i < filled ? "bg-primary-500" : "bg-border",
          )}
        />
      ))}
    </span>
  );
}

// Labels use the same tier names shown everywhere else in the app
// (2026-08-27 audit) - the `value`s stay the ChineseLevel enum's real
// values (HSK_1_2 etc.), an internal/schema concern the learner never sees.
// Icons form a rough "growing ability" progression, from just starting
// out (Sprout) to near-mastery (GraduationCap) - purely visual, no data
// tie to the real HSK level number. `filled` drives the same progression
// as a level-strength meter (0 = Getting By, 5 = Nearing Mastery); UNSURE
// has none since it isn't a real level.
const OPTIONS: {
  value: string;
  key: keyof OnboardingMessages["level"]["options"];
  icon: typeof Sprout;
  filled?: number;
}[] = [
  { value: "HSK_1_2", key: "hsk12", icon: Sprout, filled: 0 },
  { value: "HSK_3", key: "hsk3", icon: MessageCircle, filled: 1 },
  { value: "HSK_4", key: "hsk4", icon: MessagesSquare, filled: 2 },
  { value: "HSK_5", key: "hsk5", icon: Users, filled: 3 },
  { value: "HSK_6", key: "hsk6", icon: Briefcase, filled: 4 },
  { value: "HSK_7_9", key: "hsk79", icon: GraduationCap, filled: 5 },
  { value: "UNSURE", key: "unsure", icon: HelpCircle },
];

export interface LevelStepProps {
  initialValue: string | null;
  onNext: (value: string) => void;
  onBack: () => void;
  locale: AppLocale;
  messages: OnboardingMessages["level"];
  commonMessages: OnboardingMessages["common"];
}

export function LevelStep({
  initialValue,
  onNext,
  onBack,
  locale,
  messages,
  commonMessages,
}: LevelStepProps) {
  const [value, setValue] = useState(initialValue ?? "");
  const [error, setError] = useState<string>();
  const [isPending, setIsPending] = useState(false);

  const handleContinue = async () => {
    if (!value) return;
    setIsPending(true);
    const formData = new FormData();
    formData.set("currentLevel", value);
    formData.set("locale", locale);
    const result = await saveLevelStepAction({ status: "idle" }, formData);
    setIsPending(false);
    if (result.status === "error") {
      setError(result.message);
      return;
    }
    onNext(value);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <HanMascot pose="curious" size={110} />
        <SectionTitle>{messages.title}</SectionTitle>
      </div>

      {error && <InformationBanner variant="error">{error}</InformationBanner>}

      <RadioGroup
        value={value}
        onValueChange={setValue}
        className="grid grid-cols-2 gap-3"
      >
        {OPTIONS.map((option) => (
          <RadioTile
            key={option.value}
            value={option.value}
            label={messages.options[option.key]}
            icon={<option.icon className="size-5" aria-hidden="true" />}
            layout="row"
            className="min-h-[112px]"
            meta={
              option.filled !== undefined ? (
                <LevelBars filled={option.filled} />
              ) : undefined
            }
          />
        ))}
      </RadioGroup>

      <div className="flex justify-between gap-3">
        <Button variant="tertiary" onClick={onBack} type="button">
          {commonMessages.back}
        </Button>
        <Button
          size="lg"
          onClick={handleContinue}
          loading={isPending}
          disabled={!value}
        >
          {commonMessages.continue}
        </Button>
      </div>
    </div>
  );
}
