"use client";

import { useState } from "react";
import { saveAvatarAnimalAction } from "@/lib/actions/avatar";
import { AnimalGrid } from "@/components/avatar/animal-grid";
import { Button } from "@/components/ui/button";
import { InformationBanner } from "@/components/ui/banner";
import { SectionTitle, Body } from "@/components/ui/typography";

export interface AvatarStepProps {
  initialAnimal: string | null;
  onNext: (animal: string) => void;
  onBack: () => void;
}

export function AvatarStep({ initialAnimal, onNext, onBack }: AvatarStepProps) {
  const [animal, setAnimal] = useState(initialAnimal ?? "");
  const [error, setError] = useState<string>();
  const [isPending, setIsPending] = useState(false);

  const handleContinue = async () => {
    setIsPending(true);
    setError(undefined);
    const result = await saveAvatarAnimalAction(animal);
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
        <SectionTitle>Choose your avatar</SectionTitle>
        <Body className="text-text-secondary">
          Pick a zodiac animal to represent you. It&apos;s just for fun — you
          can change it anytime, and it never affects your progress.
        </Body>
      </div>

      {error && <InformationBanner variant="error">{error}</InformationBanner>}

      <AnimalGrid selected={animal} onSelect={setAnimal} />

      <div className="flex justify-between gap-3">
        <Button variant="tertiary" onClick={onBack} type="button">
          Back
        </Button>
        <Button
          size="lg"
          onClick={handleContinue}
          loading={isPending}
          disabled={!animal}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
