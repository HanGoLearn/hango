import { SectionTitle } from "@/components/ui/typography";
import { EmptyState } from "@/components/ui/states";
import { ExerciseSequence } from "@/components/exercise/exercise-sequence";
import type { LessonWithContent } from "@/lib/content/lesson-data";
import { useLessonMessages } from "@/components/lesson/lesson-messages";

export function GuidedPracticeStep({
  exercises,
  onContinue,
}: {
  exercises: LessonWithContent["guidedPracticeExercises"];
  onContinue: () => void;
}) {
  const messages = useLessonMessages();
  return (
    <div className="flex flex-col gap-4">
      <SectionTitle>{messages.guidedPractice.title}</SectionTitle>
      {exercises.length > 0 ? (
        <ExerciseSequence
          title={messages.guidedPractice.title}
          exercises={exercises}
          onComplete={onContinue}
        />
      ) : (
        <EmptyState
          title={messages.guidedPractice.emptyTitle}
          description={messages.guidedPractice.emptyDescription}
          action={{ label: messages.common.continue, onClick: onContinue }}
        />
      )}
    </div>
  );
}
