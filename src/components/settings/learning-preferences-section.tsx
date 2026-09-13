"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
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
import type { AppLocale } from "@/i18n/config";
import { localePath } from "@/i18n/config";
import type { SettingsMessages } from "@/i18n/messages/types";
import { setInterfaceLocaleAction } from "@/lib/actions/locale";
import { formatMessage } from "@/i18n/format";

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
  locale,
  messages,
}: {
  initialValues: LearningPreferencesValues;
  locale: AppLocale;
  messages: SettingsMessages["learning"];
}) {
  const pathname = usePathname();
  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const interfaceLanguageOptions = [
    { value: "EN", label: messages.languages.english },
    { value: "ES", label: messages.languages.spanish },
  ];
  const explanationLanguageOptions = [
    { value: "EN", label: messages.languages.english },
    { value: "ES", label: messages.languages.spanish },
    { value: "ZH", label: messages.languages.chinese },
  ];
  const goalOptions = [
    { value: "SPEAK_CONFIDENTLY", label: messages.goals.speakConfidently },
    { value: "HSK_PREPARATION", label: messages.goals.hskPreparation },
    { value: "TRAVEL", label: messages.goals.travel },
    { value: "WORK", label: messages.goals.work },
    { value: "STUDY", label: messages.goals.study },
    { value: "PERSONAL_INTEREST", label: messages.goals.personalInterest },
  ];
  const skillOptions = [
    { value: "LISTENING", label: messages.skills.listening },
    { value: "SPEAKING", label: messages.skills.speaking },
    { value: "READING", label: messages.skills.reading },
    { value: "WRITING", label: messages.skills.writing },
    { value: "GRAMMAR", label: messages.skills.grammar },
    { value: "VOCABULARY", label: messages.skills.vocabulary },
  ];
  const correctionStyleOptions = [
    { value: "IMMEDIATE", label: messages.corrections.immediate },
    {
      value: "AFTER_CONVERSATION",
      label: messages.corrections.afterConversation,
    },
    { value: "ONLY_IMPORTANT", label: messages.corrections.onlyImportant },
  ];

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
    formData.set("locale", locale);
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
    const nextLocale = values.interfaceLanguage === "EN" ? "en" : "es";
    if (nextLocale !== locale) {
      await setInterfaceLocaleAction(nextLocale);
      window.location.assign(localePath(nextLocale, pathname));
      return;
    }
    setSaved(true);
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <InformationBanner variant="error">{error}</InformationBanner>}
      {saved && (
        <InformationBanner variant="success">
          {messages.saved}
        </InformationBanner>
      )}

      <div className="flex flex-col gap-1.5">
        <Caption>{messages.interfaceLanguage}</Caption>
        <Select
          value={values.interfaceLanguage}
          onValueChange={(value) =>
            setValues((current) => ({ ...current, interfaceLanguage: value }))
          }
        >
          <SelectTrigger aria-label={messages.interfaceLanguage}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {interfaceLanguageOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Caption>{messages.explanationLanguage}</Caption>
        <Select
          value={values.explanationLanguage}
          onValueChange={(value) =>
            setValues((current) => ({ ...current, explanationLanguage: value }))
          }
        >
          <SelectTrigger aria-label={messages.explanationLanguage}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {explanationLanguageOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Caption>{messages.learningGoals}</Caption>
        <div className="flex flex-col gap-2">
          {goalOptions.map((option) => (
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
        <Caption>{messages.skillPriorities}</Caption>
        <div className="flex flex-col gap-2">
          {skillOptions.map((option) => (
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
        <Caption>{messages.dailyTarget}</Caption>
        <Select
          value={String(values.dailyStudyTargetMinutes)}
          onValueChange={(value) =>
            setValues((current) => ({
              ...current,
              dailyStudyTargetMinutes: Number(value),
            }))
          }
        >
          <SelectTrigger aria-label={messages.dailyTarget}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DAILY_TARGET_OPTIONS.map((minutes) => (
              <SelectItem key={minutes} value={String(minutes)}>
                {formatMessage(messages.minutes, { minutes })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Caption>{messages.correctionStyle}</Caption>
        <RadioGroup
          value={values.correctionStyle}
          onValueChange={(value) =>
            setValues((current) => ({ ...current, correctionStyle: value }))
          }
        >
          {correctionStyleOptions.map((option) => (
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
        {messages.save}
      </Button>
    </div>
  );
}
