"use client";

import { useState } from "react";
import { saveProfileStepAction } from "@/lib/actions/onboarding";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { InformationBanner } from "@/components/ui/banner";
import { SectionTitle, Body } from "@/components/ui/typography";
import { HanMascot } from "@/components/ui/han-mascot";
import type { AppLocale } from "@/i18n/config";
import type { OnboardingMessages } from "@/i18n/messages/types";

export interface ProfileStepProps {
  initialDisplayName: string | null;
  initialNickname: string | null;
  onNext: (values: { displayName: string; nickname: string }) => void;
  onBack: () => void;
  locale: AppLocale;
  messages: OnboardingMessages["profile"];
  commonMessages: OnboardingMessages["common"];
}

export function ProfileStep({
  initialDisplayName,
  initialNickname,
  onNext,
  onBack,
  locale,
  messages,
  commonMessages,
}: ProfileStepProps) {
  const [displayName, setDisplayName] = useState(initialDisplayName ?? "");
  const [nickname, setNickname] = useState(initialNickname ?? "");
  const [error, setError] = useState<string>();
  const [isPending, setIsPending] = useState(false);

  const handleContinue = async () => {
    setIsPending(true);
    setError(undefined);
    const formData = new FormData();
    formData.set("displayName", displayName);
    formData.set("nickname", nickname);
    formData.set("locale", locale);
    const result = await saveProfileStepAction({ status: "idle" }, formData);
    setIsPending(false);
    if (result.status === "error") {
      setError(result.message);
      return;
    }
    onNext({ displayName, nickname });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <HanMascot pose="wave" size={110} />
        <SectionTitle>{messages.title}</SectionTitle>
        <Body className="text-text-secondary">
          {messages.description}
        </Body>
      </div>

      {error && <InformationBanner variant="error">{error}</InformationBanner>}

      <Input
        label={messages.displayName}
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        placeholder={messages.displayNamePlaceholder}
        maxLength={60}
      />
      <Input
        label={messages.accountName}
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        placeholder={messages.accountNamePlaceholder}
        hint={messages.accountNameHint}
        maxLength={24}
      />

      <div className="flex justify-between gap-3">
        <Button variant="tertiary" onClick={onBack} type="button">
          {commonMessages.back}
        </Button>
        <Button
          size="lg"
          onClick={handleContinue}
          loading={isPending}
          disabled={!displayName.trim() || !nickname.trim()}
        >
          {commonMessages.continue}
        </Button>
      </div>
    </div>
  );
}
