import { SectionTitle } from "@/components/ui/typography";
import { DialogueLines } from "@/components/lesson/dialogue-lines";
import { StepContinueButton } from "@/components/lesson/step-continue-button";
import type { LessonWithContent } from "@/lib/content/lesson-data";
import { useLessonMessages } from "@/components/lesson/lesson-messages";

/** Standalone Dialogue step - not used by Restaurant Lesson 1 (its dialogue lives inside SituationStep instead), kept for any future lesson that wants Dialogue as its own step. */
export function DialogueStep({
  dialogues,
  onContinue,
}: {
  dialogues: LessonWithContent["dialogues"];
  onContinue: () => void;
}) {
  const messages = useLessonMessages();
  return (
    <div className="flex flex-col gap-6">
      <SectionTitle>{messages.dialogue.title}</SectionTitle>
      <DialogueLines dialogues={dialogues} />
      <StepContinueButton onClick={onContinue} />
    </div>
  );
}
