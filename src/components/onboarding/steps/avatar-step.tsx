"use client";

import { useState } from "react";
import { saveAvatarAnimalAction } from "@/lib/actions/avatar";
import { AnimalGrid } from "@/components/avatar/animal-grid";
import { Button } from "@/components/ui/button";
import { InformationBanner } from "@/components/ui/banner";
import { SectionTitle, Body } from "@/components/ui/typography";
import type { AppLocale } from "@/i18n/config";
import type { OnboardingMessages } from "@/i18n/messages/types";

export interface AvatarStepProps {
  initialAnimal: string | null;
  onNext: (animal: string) => void;
  onBack: () => void;
  locale: AppLocale;
  messages: OnboardingMessages["avatar"];
  commonMessages: OnboardingMessages["common"];
}

export function AvatarStep({
  initialAnimal,
  onNext,
  onBack,
  locale,
  messages,
  commonMessages,
}: AvatarStepProps) {
  const [animal, setAnimal] = useState(initialAnimal ?? "");
  const [error, setError] = useState<string>();
  const [isPending, setIsPending] = useState(false);

  const handleContinue = async () => {
    setIsPending(true);
    setError(undefined);
    const result = await saveAvatarAnimalAction(animal, locale);
    setIsPending(false);
    if (result.status === "error") {
      setError(result.message);
      return;
    }
    onNext(animal);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <SectionTitle>{messages.title}</SectionTitle>
        <Body className="text-text-secondary">
          {messages.description}
        </Body>
      </div>

      {error && <InformationBanner variant="error">{error}</InformationBanner>}

      <AnimalGrid selected={animal} onSelect={setAnimal} messages={messages} />

      <div className="flex justify-between gap-3">
        <Button variant="tertiary" onClick={onBack} type="button">
          {commonMessages.back}
        </Button>
        <Button
          size="lg"
          onClick={handleContinue}
          loading={isPending}
          disabled={!animal}
        >
          {commonMessages.continue}
        </Button>
      </div>
    </div>
  );
}
