"use client";

import { useState } from "react";
import { Headphones, Mic, BookOpen, PenLine, SpellCheck, Type } from "lucide-react";
import { saveSkillsStepAction } from "@/lib/actions/onboarding";
import { CheckboxTile } from "@/components/onboarding/option-tile";
import { Button } from "@/components/ui/button";
import { InformationBanner } from "@/components/ui/banner";
import { SectionTitle, Body } from "@/components/ui/typography";
import { HanMascot } from "@/components/ui/han-mascot";

const OPTIONS = [
  { value: "LISTENING", label: "Listening", icon: Headphones },
  { value: "SPEAKING", label: "Speaking", icon: Mic },
  { value: "READING", label: "Reading", icon: BookOpen },
  { value: "WRITING", label: "Writing", icon: PenLine },
  { value: "GRAMMAR", label: "Grammar", icon: SpellCheck },
  { value: "VOCABULARY", label: "Vocabulary", icon: Type },
];

export interface SkillsStepProps {
  initialValue: string[];
  onNext: (value: string[]) => void;
  onBack: () => void;
}

export function SkillsStep({ initialValue, onNext, onBack }: SkillsStepProps) {
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
        <SectionTitle>What do you want to focus on?</SectionTitle>
        <Body className="text-text-secondary">Select all that apply.</Body>
      </div>

      {error && <InformationBanner variant="error">{error}</InformationBanner>}

      <div className="grid grid-cols-2 gap-3">
        {OPTIONS.map((option) => (
          <CheckboxTile
            key={option.value}
            value={option.value}
            label={option.label}
            icon={<option.icon className="size-5" aria-hidden="true" />}
            layout="row"
            checked={selected.includes(option.value)}
            onCheckedChange={() => toggle(option.value)}
          />
        ))}
      </div>

      <div className="flex justify-between gap-3">
        <Button variant="tertiary" onClick={onBack} type="button">
          Back
        </Button>
        <Button
          size="lg"
          onClick={handleContinue}
          loading={isPending}
          disabled={selected.length === 0}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
