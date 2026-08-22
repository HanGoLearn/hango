"use client";

import { useState } from "react";
import { saveSkillsStepAction } from "@/lib/actions/onboarding";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { InformationBanner } from "@/components/ui/banner";
import { SectionTitle, Body } from "@/components/ui/typography";

const OPTIONS: { value: string; label: string }[] = [
  { value: "LISTENING", label: "Listening" },
  { value: "SPEAKING", label: "Speaking" },
  { value: "READING", label: "Reading" },
  { value: "WRITING", label: "Writing" },
  { value: "GRAMMAR", label: "Grammar" },
  { value: "VOCABULARY", label: "Vocabulary" },
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
      <div className="text-center">
        <SectionTitle>What do you want to focus on?</SectionTitle>
        <Body className="text-text-secondary">Select all that apply.</Body>
      </div>

      {error && <InformationBanner variant="error">{error}</InformationBanner>}

      <div className="flex flex-col gap-2">
        {OPTIONS.map((option) => (
          <Checkbox
            key={option.value}
            label={option.label}
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
