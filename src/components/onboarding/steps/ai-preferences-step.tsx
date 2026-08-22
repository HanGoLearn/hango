"use client";

import { useState } from "react";
import { saveAiPreferencesStepAction } from "@/lib/actions/onboarding";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { InformationBanner } from "@/components/ui/banner";
import { SectionTitle, Body } from "@/components/ui/typography";

const OPTIONS: { value: string; label: string }[] = [
  { value: "IMMEDIATE", label: "Correct me immediately" },
  { value: "AFTER_CONVERSATION", label: "Correct me after we finish talking" },
  { value: "ONLY_IMPORTANT", label: "Only point out important mistakes" },
];

export interface AiPreferencesStepProps {
  initialValue: string | null;
  onNext: (value: string) => void;
  onBack: () => void;
}

export function AiPreferencesStep({
  initialValue,
  onNext,
  onBack,
}: AiPreferencesStepProps) {
  const [value, setValue] = useState<string | undefined>(
    initialValue ?? undefined,
  );
  const [error, setError] = useState<string>();
  const [isPending, setIsPending] = useState(false);

  const handleContinue = async () => {
    if (!value) return;
    setIsPending(true);
    const formData = new FormData();
    formData.set("correctionStyle", value);
    const result = await saveAiPreferencesStepAction(
      { status: "idle" },
      formData,
    );
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
        <SectionTitle>How should the AI Teacher correct you?</SectionTitle>
        <Body className="text-text-secondary">
          You can change this later in Settings.
        </Body>
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
