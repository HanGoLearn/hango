import { PlaceholderStep } from "@/components/lesson/steps/placeholder-step";
import { useLessonMessages } from "@/components/lesson/lesson-messages";

export function WritingStep({ onContinue }: { onContinue: () => void }) {
  const messages = useLessonMessages();
  return (
    <PlaceholderStep
      title={messages.writing.title}
      description={messages.writing.description}
      comingIn={messages.writing.comingIn}
      onContinue={onContinue}
    />
  );
}
