"use client";

import { useState } from "react";
import { Caption } from "@/components/ui/typography";
import { ExerciseItem } from "@/components/exercise/exercise-item";
import { useAiTeacher } from "@/components/ai-teacher/ai-teacher-provider";
import { submitExerciseAttemptAction } from "@/lib/actions/exercise-progress";
import type {
  ClientExercise,
  ExerciseAnswer,
  ExerciseSubmitResult,
} from "@/lib/exercise-progress";

/** Walks a list of exercises one at a time, used for the lesson's Comprehension/Guided Practice steps. */
export function ExerciseSequence({
  title,
  exercises,
  onComplete,
  feedbackMode = "learning",
}: {
  title: string;
  exercises: ClientExercise[];
  onComplete: () => void;
  feedbackMode?: "learning" | "assessment";
}) {
  const [index, setIndex] = useState(0);
  const { setContext } = useAiTeacher();

  if (exercises.length === 0) return null;

  const isLast = index === exercises.length - 1;
  const exercise = exercises[index]!;

  async function handleSubmit(
    answer: ExerciseAnswer,
  ): Promise<ExerciseSubmitResult> {
    const result = await submitExerciseAttemptAction(exercise.id, answer);
    if (result.isCorrect !== null) {
      setContext({
        recentLearnerAnswer: {
          prompt: exercise.prompt,
          wasCorrect: result.isCorrect,
        },
      });
    }
    return result;
  }

  function handleNext() {
    if (isLast) {
      onComplete();
      return;
    }
    setIndex(index + 1);
  }

  return (
    <div className="flex flex-col gap-3">
      <Caption>
        {title} · {index + 1} of {exercises.length}
      </Caption>
      <ExerciseItem
        key={exercise.id}
        item={exercise}
        onSubmit={handleSubmit}
        onNext={handleNext}
        nextLabel={isLast ? "Continue" : "Next question"}
        feedbackMode={feedbackMode}
      />
    </div>
  );
}
