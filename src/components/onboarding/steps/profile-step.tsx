"use client";

import { useState } from "react";
import { saveProfileStepAction } from "@/lib/actions/onboarding";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { InformationBanner } from "@/components/ui/banner";
import { SectionTitle, Body } from "@/components/ui/typography";
import { HanMascot } from "@/components/ui/han-mascot";

export interface ProfileStepProps {
  initialDisplayName: string | null;
  initialNickname: string | null;
  onNext: (values: { displayName: string; nickname: string }) => void;
  onBack: () => void;
}

export function ProfileStep({
  initialDisplayName,
  initialNickname,
  onNext,
  onBack,
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
        <SectionTitle>What should Han call you?</SectionTitle>
        <Body className="text-text-secondary">
          Your name is what Han calls you — you can change it anytime. Your
          Account Name is what other learners see on the leaderboard, and
          it&apos;s permanent once you set it.
        </Body>
      </div>

      {error && <InformationBanner variant="error">{error}</InformationBanner>}

      <Input
        label="Your name"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        placeholder="What Han calls you"
        maxLength={60}
      />
      <Input
        label="Account Name"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        placeholder="For the leaderboard"
        hint="Letters, numbers, and underscores only. Permanent — choose carefully."
        maxLength={24}
      />

      <div className="flex justify-between gap-3">
        <Button variant="tertiary" onClick={onBack} type="button">
          Back
        </Button>
        <Button
          size="lg"
          onClick={handleContinue}
          loading={isPending}
          disabled={!displayName.trim() || !nickname.trim()}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
