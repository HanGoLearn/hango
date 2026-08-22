"use client";

import { useState } from "react";
import { saveDailyTargetStepAction } from "@/lib/actions/onboarding";
import { DAILY_TARGET_OPTIONS } from "@/lib/validation/onboarding";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { InformationBanner } from "@/components/ui/banner";
import { SectionTitle } from "@/components/ui/typography";

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
      <div className="text-center">
        <SectionTitle>How much time can you study each day?</SectionTitle>
      </div>

      {error && <InformationBanner variant="error">{error}</InformationBanner>}

      <RadioGroup value={value} onValueChange={setValue}>
        {DAILY_TARGET_OPTIONS.map((minutes) => (
          <RadioGroupItem
            key={minutes}
            value={String(minutes)}
            label={`${minutes} minutes`}
          />
        ))}
      </RadioGroup>

      <div className="flex justify-between gap-3">
        <Button variant="tertiary" onClick={onBack} type="button">
          Back
        </Button>
        <Button onClick={handleContinue} loading={isPending} disabled={!value}>
          Continue
        </Button>
      </div>
    </div>
  );
}
