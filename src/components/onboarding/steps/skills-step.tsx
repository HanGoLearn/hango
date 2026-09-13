"use client";

import { useState } from "react";
import { Headphones, Mic, BookOpen, PenLine, SpellCheck, Type } from "lucide-react";
import { saveSkillsStepAction } from "@/lib/actions/onboarding";
import { CheckboxTile } from "@/components/onboarding/option-tile";
import { Button } from "@/components/ui/button";
import { InformationBanner } from "@/components/ui/banner";
import { SectionTitle, Body } from "@/components/ui/typography";
import { HanMascot } from "@/components/ui/han-mascot";
import type { AppLocale } from "@/i18n/config";
import type { OnboardingMessages } from "@/i18n/messages/types";

const OPTIONS = [
  { value: "LISTENING", key: "listening", icon: Headphones },
  { value: "SPEAKING", key: "speaking", icon: Mic },
  { value: "READING", key: "reading", icon: BookOpen },
  { value: "WRITING", key: "writing", icon: PenLine },
  { value: "GRAMMAR", key: "grammar", icon: SpellCheck },
  { value: "VOCABULARY", key: "vocabulary", icon: Type },
] as const;

export interface SkillsStepProps {
  initialValue: string[];
  onNext: (value: string[]) => void;
  onBack: () => void;
  locale: AppLocale;
  messages: OnboardingMessages["skills"];
  commonMessages: OnboardingMessages["common"];
}

export function SkillsStep({
  initialValue,
  onNext,
  onBack,
  locale,
  messages,
  commonMessages,
}: SkillsStepProps) {
  const [selected, setSelected] = useState<string[]>(initialValue);
  const [error, setError] = useState<string>();
  const [isPending, setIsPending] = useState(false);

  const toggle = (value: string) => {
    setSelected((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value],
    );
  };

  const handleContinue = async () => {
    setIsPending(true);
    const formData = new FormData();
    for (const value of selected) formData.append("skillPriorities", value);
    formData.set("locale", locale);
    const result = await saveSkillsStepAction({ status: "idle" }, formData);
    setIsPending(false);
    if (result.status === "error") {
      setError(result.message);
      return;
    }
    onNext(selected);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <HanMascot pose="curious" size={110} />
        <SectionTitle>{messages.title}</SectionTitle>
        <Body className="text-text-secondary">{messages.selectAll}</Body>
      </div>

      {error && <InformationBanner variant="error">{error}</InformationBanner>}

      <div className="grid grid-cols-2 gap-3">
        {OPTIONS.map((option) => (
          <CheckboxTile
            key={option.value}
            value={option.value}
            label={messages.options[option.key]}
            icon={<option.icon className="size-5" aria-hidden="true" />}
            layout="row"
            checked={selected.includes(option.value)}
            onCheckedChange={() => toggle(option.value)}
          />
        ))}
      </div>

      <div className="flex justify-between gap-3">
        <Button variant="tertiary" onClick={onBack} type="button">
          {commonMessages.back}
        </Button>
        <Button
          size="lg"
          onClick={handleContinue}
          loading={isPending}
          disabled={selected.length === 0}
        >
          {commonMessages.continue}
        </Button>
      </div>
    </div>
  );
}
