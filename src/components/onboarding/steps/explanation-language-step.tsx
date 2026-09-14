"use client";

import { useState } from "react";
import { saveExplanationLanguageStepAction } from "@/lib/actions/onboarding";
import { RadioGroup } from "@/components/ui/radio-group";
import { RadioTile } from "@/components/onboarding/option-tile";
import { Button } from "@/components/ui/button";
import { InformationBanner } from "@/components/ui/banner";
import { SectionTitle, Body } from "@/components/ui/typography";
import { HanMascot } from "@/components/ui/han-mascot";
import type { AppLocale } from "@/i18n/config";
import type { OnboardingMessages } from "@/i18n/messages/types";

const OPTIONS = [
  { value: "EN", key: "english" },
  { value: "ES", key: "spanish" },
  { value: "ZH", key: "chinese" },
] as const;

export interface ExplanationLanguageStepProps {
  initialValue: string | null;
  onNext: (value: string) => void;
  onBack: () => void;
  locale: AppLocale;
  messages: OnboardingMessages["explanationLanguage"];
  commonMessages: OnboardingMessages["common"];
}

export function ExplanationLanguageStep({
  initialValue,
  onNext,
  onBack,
  locale,
  messages,
  commonMessages,
}: ExplanationLanguageStepProps) {
  const [value, setValue] = useState(initialValue ?? "");
  const [error, setError] = useState<string>();
  const [isPending, setIsPending] = useState(false);

  const handleContinue = async () => {
    if (!value) return;
    setIsPending(true);
    const formData = new FormData();
    formData.set("explanationLanguage", value);
    formData.set("locale", locale);
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
        <SectionTitle>{messages.title}</SectionTitle>
        <Body className="text-text-secondary">{messages.description}</Body>
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
