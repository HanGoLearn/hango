import {
  SectionTitle,
  CardTitle,
  Display,
  Caption,
} from "@/components/ui/typography";
import { HanMascot } from "@/components/ui/han-mascot";
import { DialogueLines } from "@/components/lesson/dialogue-lines";
import { StepContinueButton } from "@/components/lesson/step-continue-button";
import type { LessonWithContent } from "@/lib/content/lesson-data";

/**
 * Situation and Dialogue merged into one screen (user request, 2026-08-06):
 * the learner reads the context, then the conversation right there, instead
 * of moving to a separate Dialogue step.
 *
 * Redesigned 2026-08-08 (user request): Han presents the scene in a
 * gradient hero panel (mockup Option "B"), the lesson's goals are numbered
 * panels (Option "C" — the numbering is real here, since they're an
 * ordered checklist the learner works through), and the conversation below
 * uses the chat-bubble/voice-note treatment (Option "A") — see
 * DialogueLines.
 *
 * The "practice first" AI role-play gate added 2026-08-08 (Phase C) was
 * removed 2026-08-10 (user request): the model dialogue now shows directly,
 * with no chat step in between.
 */
export function SituationStep({
  lesson,
  onContinue,
}: {
  lesson: LessonWithContent;
  onContinue: () => void;
}) {
  const objectives = lesson.learningObjectives;

  return (
    <div className="flex flex-col gap-4">
      <SectionTitle>Situation</SectionTitle>

      <div className="relative overflow-hidden rounded-panel bg-elevated px-5 py-5">
        <Display className="max-w-[80%] text-[1.375rem] italic">
          &ldquo;{lesson.communicationObjective}&rdquo;
        </Display>
        <HanMascot
          pose="wave"
          size={140}
          className="pointer-events-none absolute -right-3 -bottom-3 drop-shadow-[0_12px_18px_rgba(0,0,0,0.25)]"
        />
      </div>

      {objectives.length > 0 && (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {objectives.map((objective, index) => (
            <div
              key={objective.id}
              className="flex flex-col gap-1.5 rounded-card bg-elevated px-3 py-3"
            >
              <span className="font-display text-card-title text-accent-300">
                {String(index + 1).padStart(2, "0")}
              </span>
              <Caption>{objective.description}</Caption>
            </div>
          ))}
        </div>
      )}

      {lesson.dialogues.length > 0 && (
        <div className="flex flex-col gap-3 border-t border-border pt-4">
          <CardTitle>Conversation</CardTitle>
          <DialogueLines dialogues={lesson.dialogues} />
        </div>
      )}

      <StepContinueButton onClick={onContinue} />
    </div>
  );
}
