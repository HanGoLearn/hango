"use client";

import { useState } from "react";
import {
  MessageCircle,
  GraduationCap,
  Plane,
  Briefcase,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { saveGoalStepAction } from "@/lib/actions/onboarding";
import { CheckboxTile } from "@/components/onboarding/option-tile";
import { Button } from "@/components/ui/button";
import { InformationBanner } from "@/components/ui/banner";
import { SectionTitle, Body, Caption } from "@/components/ui/typography";
import { HanAvatar, HanMascot } from "@/components/ui/han-mascot";
import type { AppLocale } from "@/i18n/config";
import type { OnboardingMessages } from "@/i18n/messages/types";

const OPTIONS = [
  { value: "SPEAK_CONFIDENTLY", key: "speakConfidently", icon: MessageCircle },
  { value: "HSK_PREPARATION", key: "hskPreparation", icon: GraduationCap },
  { value: "TRAVEL", key: "travel", icon: Plane },
  { value: "WORK", key: "work", icon: Briefcase },
  { value: "STUDY", key: "study", icon: BookOpen },
  { value: "PERSONAL_INTEREST", key: "personalInterest", icon: Sparkles },
] as const;

export interface GoalStepProps {
  initialValue: string[];
  onNext: (value: string[]) => void;
  onBack: () => void;
  locale: AppLocale;
  messages: OnboardingMessages["goal"];
  commonMessages: OnboardingMessages["common"];
}

export function GoalStep({
  initialValue,
  onNext,
  onBack,
  locale,
  messages,
  commonMessages,
}: GoalStepProps) {
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
    for (const value of selected) formData.append("learningGoals", value);
    formData.set("locale", locale);
    const result = await saveGoalStepAction({ status: "idle" }, formData);
    setIsPending(false);
    if (result.status === "error") {
      setError(result.message);
      return;
    }
    onNext(selected);
  };

  const lastOption = OPTIONS.find(
    (option) => option.value === selected[selected.length - 1],
  );
  const lastReaction = lastOption
    ? messages.reactions[lastOption.key]
    : undefined;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <HanMascot pose="wave" size={110} />
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

      {lastReaction && (
        <div className="flex items-center gap-2 rounded-panel bg-elevated p-3">
          <HanAvatar pose="heart" size={28} />
          <Caption className="text-text-secondary">{lastReaction}</Caption>
        </div>
      )}

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
