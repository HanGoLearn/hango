"use client";

import { useState } from "react";
import { saveExplanationLanguageStepAction } from "@/lib/actions/onboarding";
import { RadioGroup } from "@/components/ui/radio-group";
import { RadioTile } from "@/components/onboarding/option-tile";
import { Button } from "@/components/ui/button";
import { InformationBanner } from "@/components/ui/banner";
import { SectionTitle, Body } from "@/components/ui/typography";
import { HanMascot } from "@/components/ui/han-mascot";

const OPTIONS: { value: string; label: string }[] = [
  { value: "EN", label: "English" },
  { value: "ES", label: "Español" },
  { value: "ZH", label: "中文 (Chinese)" },
];

export interface ExplanationLanguageStepProps {
  initialValue: string | null;
  onNext: (value: string) => void;
  onBack: () => void;
}

export function ExplanationLanguageStep({
  initialValue,
  onNext,
  onBack,
}: ExplanationLanguageStepProps) {
  const [value, setValue] = useState<string | undefined>(
    initialValue ?? undefined,
  );
  const [error, setError] = useState<string>();
  const [isPending, setIsPending] = useState(false);

  const handleContinue = async () => {
    if (!value) return;
    setIsPending(true);
    const formData = new FormData();
    formData.set("explanationLanguage", value);
    const result = await saveExplanationLanguageStepAction(
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
      <div className="flex flex-col items-center gap-2 text-center">
        <HanMascot pose="wave" size={110} />
        <SectionTitle>Which language should your Teacher use?</SectionTitle>
        <Body className="text-text-secondary">
          For explanations — lessons stay in Chinese.
        </Body>
      </div>

      {error && <InformationBanner variant="error">{error}</InformationBanner>}

      <RadioGroup value={value} onValueChange={setValue} className="grid grid-cols-2 gap-3">
        {OPTIONS.map((option) => (
          <RadioTile key={option.value} value={option.value} label={option.label} />
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
