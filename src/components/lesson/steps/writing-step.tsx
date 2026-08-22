import { PlaceholderStep } from "@/components/lesson/steps/placeholder-step";

export function WritingStep({ onContinue }: { onContinue: () => void }) {
  return (
    <PlaceholderStep
      title="Writing"
      description="You'll practice writing sentences from this lesson with AI feedback."
      comingIn="the Writing Lab (FASE 11)"
      onContinue={onContinue}
    />
  );
}
