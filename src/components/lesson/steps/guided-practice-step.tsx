import { SectionTitle } from "@/components/ui/typography";
import { EmptyState } from "@/components/ui/states";
import { ExerciseSequence } from "@/components/exercise/exercise-sequence";
import type { LessonWithContent } from "@/lib/content/lesson-data";

export function GuidedPracticeStep({
  exercises,
  onContinue,
}: {
  exercises: LessonWithContent["guidedPracticeExercises"];
  onContinue: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <SectionTitle>Guided Practice</SectionTitle>
      {exercises.length > 0 ? (
        <ExerciseSequence
          title="Guided Practice"
          exercises={exercises}
          onComplete={onContinue}
        />
      ) : (
        <EmptyState
          title="Nothing to practice yet"
          description="This lesson doesn't have guided practice exercises."
          action={{ label: "Continue", onClick: onContinue }}
        />
      )}
    </div>
  );
}
