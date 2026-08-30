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

const OPTIONS = [
  { value: "SPEAK_CONFIDENTLY", label: "Speak confidently", icon: MessageCircle },
  { value: "HSK_PREPARATION", label: "Prepare for HSK", icon: GraduationCap },
  { value: "TRAVEL", label: "Travel", icon: Plane },
  { value: "WORK", label: "Work", icon: Briefcase },
  { value: "STUDY", label: "Study", icon: BookOpen },
  { value: "PERSONAL_INTEREST", label: "Personal interest", icon: Sparkles },
];

/** Han's one-line reaction to the most recently selected goal - a small "the mascot notices what you picked" touch (2026-08-27), not just decoration between screens. */
const GOAL_REACTIONS: Record<string, string> = {
  SPEAK_CONFIDENTLY: "Nice — we'll get you talking early and often.",
  HSK_PREPARATION: "Got it — we'll keep your HSK level front and center.",
  TRAVEL: "Perfect for ordering food, asking directions, all of it.",
  WORK: "We'll focus on the Chinese you'll actually use at work.",
  STUDY: "We'll build a strong foundation for your studies.",
  PERSONAL_INTEREST: "Learning for the love of it — my favorite kind.",
};

export interface GoalStepProps {
  initialValue: string[];
  onNext: (value: string[]) => void;
  onBack: () => void;
}

export function GoalStep({ initialValue, onNext, onBack }: GoalStepProps) {
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
    const result = await saveGoalStepAction({ status: "idle" }, formData);
    setIsPending(false);
    if (result.status === "error") {
      setError(result.message);
      return;
    }
    onNext(selected);
  };

  const lastReaction = GOAL_REACTIONS[selected[selected.length - 1] ?? ""];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <HanMascot pose="wave" size={110} />
        <SectionTitle>What&apos;s your learning goal?</SectionTitle>
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

      {lastReaction && (
        <div className="flex items-center gap-2 rounded-panel bg-elevated p-3">
          <HanAvatar pose="heart" size={28} />
          <Caption className="text-text-secondary">{lastReaction}</Caption>
        </div>
      )}

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
