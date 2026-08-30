"use client";

import { useState } from "react";
import { saveDailyTargetStepAction } from "@/lib/actions/onboarding";
import { DAILY_TARGET_OPTIONS } from "@/lib/validation/onboarding";
import { RadioGroup } from "@/components/ui/radio-group";
import { RadioTile } from "@/components/onboarding/option-tile";
import { Button } from "@/components/ui/button";
import { InformationBanner } from "@/components/ui/banner";
import { SectionTitle } from "@/components/ui/typography";
import { HanMascot } from "@/components/ui/han-mascot";

export interface DailyTargetStepProps {
  initialValue: number | null;
  onNext: (value: number) => void;
  onBack: () => void;
}

export function DailyTargetStep({
  initialValue,
  onNext,
  onBack,
}: DailyTargetStepProps) {
  const [value, setValue] = useState<string | undefined>(
    initialValue ? String(initialValue) : undefined,
  );
  const [error, setError] = useState<string>();
  const [isPending, setIsPending] = useState(false);

  const handleContinue = async () => {
    if (!value) return;
    setIsPending(true);
    const formData = new FormData();
    formData.set("dailyStudyTargetMinutes", value);
    const result = await saveDailyTargetStepAction(
      { status: "idle" },
      formData,
    );
    setIsPending(false);
    if (result.status === "error") {
      setError(result.message);
      return;
    }
    onNext(Number(value));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <HanMascot pose="idle" size={110} />
        <SectionTitle>How much time can you study each day?</SectionTitle>
      </div>

      {error && <InformationBanner variant="error">{error}</InformationBanner>}

      <RadioGroup
        value={value}
        onValueChange={setValue}
        className="grid grid-cols-2 gap-3 sm:grid-cols-3"
      >
        {DAILY_TARGET_OPTIONS.map((minutes) => (
          <RadioTile
            key={minutes}
            value={String(minutes)}
            label={`${minutes} min`}
          />
        ))}
      </RadioGroup>

      <div className="flex justify-between gap-3">
        <Button variant="tertiary" onClick={onBack} type="button">
          Back
        </Button>
        <Button size="lg" onClick={handleContinue} loading={isPending} disabled={!value}>
          Continue
        </Button>
      </div>
    </div>
  );
}
