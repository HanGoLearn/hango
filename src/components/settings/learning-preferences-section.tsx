"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { InformationBanner } from "@/components/ui/banner";
import { Caption } from "@/components/ui/typography";
import {
  updateLearningPreferencesAction,
  type SettingsActionState,
} from "@/lib/actions/settings";
import { DAILY_TARGET_OPTIONS } from "@/lib/validation/onboarding";

const INTERFACE_LANGUAGE_OPTIONS = [
  { value: "EN", label: "English" },
  { value: "ES", label: "Español" },
];

const EXPLANATION_LANGUAGE_OPTIONS = [
  { value: "EN", label: "English" },
  { value: "ES", label: "Español" },
  { value: "ZH", label: "中文 (Chinese)" },
];

const GOAL_OPTIONS = [
  { value: "SPEAK_CONFIDENTLY", label: "Speak confidently" },
  { value: "HSK_PREPARATION", label: "Prepare for HSK" },
  { value: "TRAVEL", label: "Travel" },
  { value: "WORK", label: "Work" },
  { value: "STUDY", label: "Study" },
  { value: "PERSONAL_INTEREST", label: "Personal interest" },
];

const SKILL_OPTIONS = [
  { value: "LISTENING", label: "Listening" },
  { value: "SPEAKING", label: "Speaking" },
  { value: "READING", label: "Reading" },
  { value: "WRITING", label: "Writing" },
  { value: "GRAMMAR", label: "Grammar" },
  { value: "VOCABULARY", label: "Vocabulary" },
];

const CORRECTION_STYLE_OPTIONS = [
  { value: "IMMEDIATE", label: "Correct me immediately" },
  { value: "AFTER_CONVERSATION", label: "Correct me after the conversation" },
  { value: "ONLY_IMPORTANT", label: "Only correct important mistakes" },
];

export interface LearningPreferencesValues {
  interfaceLanguage: string;
  explanationLanguage: string;
  learningGoals: string[];
  skillPriorities: string[];
  dailyStudyTargetMinutes: number;
  correctionStyle: string;
}

export function LearningPreferencesSection({
  initialValues,
}: {
  initialValues: LearningPreferencesValues;
}) {
  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggleGoal(value: string) {
    setValues((current) => ({
      ...current,
      learningGoals: current.learningGoals.includes(value)
        ? current.learningGoals.filter((v) => v !== value)
        : [...current.learningGoals, value],
    }));
  }

  function toggleSkill(value: string) {
    setValues((current) => ({
      ...current,
      skillPriorities: current.skillPriorities.includes(value)
        ? current.skillPriorities.filter((v) => v !== value)
        : [...current.skillPriorities, value],
    }));
  }

  async function handleSave() {
    setSaving(true);
    setError(undefined);
    setSaved(false);

    const formData = new FormData();
    formData.set("interfaceLanguage", values.interfaceLanguage);
    formData.set("explanationLanguage", values.explanationLanguage);
    for (const goal of values.learningGoals)
      formData.append("learningGoals", goal);
    for (const skill of values.skillPriorities) {
      formData.append("skillPriorities", skill);
    }
    formData.set(
      "dailyStudyTargetMinutes",
      String(values.dailyStudyTargetMinutes),
    );
    formData.set("correctionStyle", values.correctionStyle);

    const result = await updateLearningPreferencesAction(
      { status: "idle" },
      formData,
    );
    setSaving(false);
    if (result.status === "error") {
      setError(result.message);
      return;
    }
    setSaved(true);
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <InformationBanner variant="error">{error}</InformationBanner>}
      {saved && <InformationBanner variant="success">Saved.</InformationBanner>}

      <div className="flex flex-col gap-1.5">
        <Caption>Interface language</Caption>
        <Select
          value={values.interfaceLanguage}
          onValueChange={(value) =>
            setValues((current) => ({ ...current, interfaceLanguage: value }))
          }
        >
          <SelectTrigger aria-label="Interface language">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {INTERFACE_LANGUAGE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Caption>Han fallback explanation language</Caption>
        <Select
          value={values.explanationLanguage}
          onValueChange={(value) =>
            setValues((current) => ({ ...current, explanationLanguage: value }))
          }
        >
          <SelectTrigger aria-label="Explanation language">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EXPLANATION_LANGUAGE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Caption>Learning goals</Caption>
        <div className="flex flex-col gap-2">
          {GOAL_OPTIONS.map((option) => (
            <Checkbox
              key={option.value}
              label={option.label}
              checked={values.learningGoals.includes(option.value)}
              onCheckedChange={() => toggleGoal(option.value)}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Caption>Skill priorities</Caption>
        <div className="flex flex-col gap-2">
          {SKILL_OPTIONS.map((option) => (
            <Checkbox
              key={option.value}
              label={option.label}
              checked={values.skillPriorities.includes(option.value)}
              onCheckedChange={() => toggleSkill(option.value)}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Caption>Daily study target</Caption>
        <Select
          value={String(values.dailyStudyTargetMinutes)}
          onValueChange={(value) =>
            setValues((current) => ({
              ...current,
              dailyStudyTargetMinutes: Number(value),
            }))
          }
        >
          <SelectTrigger aria-label="Daily study target">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DAILY_TARGET_OPTIONS.map((minutes) => (
              <SelectItem key={minutes} value={String(minutes)}>
                {minutes} minutes
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Caption>Correction style</Caption>
        <RadioGroup
          value={values.correctionStyle}
          onValueChange={(value) =>
            setValues((current) => ({ ...current, correctionStyle: value }))
          }
        >
          {CORRECTION_STYLE_OPTIONS.map((option) => (
            <RadioGroupItem
              key={option.value}
              value={option.value}
              label={option.label}
            />
          ))}
        </RadioGroup>
      </div>

      <Button
        type="button"
        onClick={() => void handleSave()}
        loading={saving}
        className="w-fit"
      >
        Save
      </Button>
    </div>
  );
}
