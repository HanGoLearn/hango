"use client";

import { useState } from "react";
import { saveLevelStepAction } from "@/lib/actions/onboarding";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { InformationBanner } from "@/components/ui/banner";
import { SectionTitle } from "@/components/ui/typography";

const OPTIONS: { value: string; label: string }[] = [
  { value: "HSK_1_2", label: "Just starting (HSK 1–2)" },
  { value: "HSK_3", label: "HSK 3" },
  { value: "HSK_4", label: "HSK 4" },
  { value: "HSK_5", label: "HSK 5" },
  { value: "HSK_6", label: "HSK 6" },
  { value: "HSK_7_9", label: "HSK 7–9" },
  { value: "UNSURE", label: "Unsure" },
];

export interface LevelStepProps {
  initialValue: string | null;
  onNext: (value: string) => void;
  onBack: () => void;
}

export function LevelStep({ initialValue, onNext, onBack }: LevelStepProps) {
  const [value, setValue] = useState<string | undefined>(
    initialValue ?? undefined,
  );
  const [error, setError] = useState<string>();
  const [isPending, setIsPending] = useState(false);

  const handleContinue = async () => {
    if (!value) return;
    setIsPending(true);
    const formData = new FormData();
    formData.set("currentLevel", value);
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
      <div className="text-center">
        <SectionTitle>What&apos;s your current Chinese level?</SectionTitle>
      </div>

      {error && <InformationBanner variant="error">{error}</InformationBanner>}

      <RadioGroup value={value} onValueChange={setValue}>
        {OPTIONS.map((option) => (
          <RadioGroupItem
            key={option.value}
            value={option.value}
            label={option.label}
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
