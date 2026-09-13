"use client";

import { useMemo, useState } from "react";
import { Headphones } from "lucide-react";
import { SectionTitle, Body, Caption } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { HanAvatar } from "@/components/ui/han-mascot";
import { EmptyState } from "@/components/ui/states";
import { ExerciseItem } from "@/components/exercise/exercise-item";
import { StepContinueButton } from "@/components/lesson/step-continue-button";
import { ConversationPlayer } from "@/components/lesson/dialogue-lines";
import { submitExerciseAttemptsAction } from "@/lib/actions/exercise-progress";
import type {
  ExerciseAnswer,
  ExerciseSubmitResult,
} from "@/lib/exercise-progress";
import type { LessonWithContent } from "@/lib/content/lesson-data";
import { useLessonMessages } from "@/components/lesson/lesson-messages";

/** A stub ExerciseItem never actually calls in hideControls mode - its own Submit/Next buttons are hidden, so onSubmit/onNext are unreachable, but the props are still required. */
async function unusedSubmit(): Promise<ExerciseSubmitResult> {
  return { isCorrect: null, explanation: null, correctOptionId: null };
}
function unusedNext(): void {}

/**
 * Redesigned 2026-08-08 (user request): listening comes before reading.
 * Almost every competing app tests comprehension by showing the Chinese
 * text and asking about it - here the learner hears the real conversation
 * audio (Fase A) first, with the questions (and their Chinese text) held
 * back until they choose to move on, instead of being visible from the
 * start. Falls back to showing the exercises directly for the rare lesson
 * with no dialogue to listen to.
 *
 * Practice redesigned again 2026-08-20 (same shape as Grammar's 2026-08-19
 * batching - project/learning-journey-optimization.md): every question
 * shows at once instead of ExerciseSequence's one-at-a-time "Submit -> see
 * result -> Next question" - one "Check answers" grades the whole set in a
 * single batched call (`submitExerciseAttemptsAction`/`recordExerciseAttempts`,
 * already shared with Grammar - Exercise/ExerciseAttempt aren't
 * grammar-specific) instead of one round trip per exercise, then the same
 * spot becomes "Continue" once results are in. `feedbackMode="assessment"`
 * carries over unchanged (no reveal of the correct option on a miss, no
 * retry) - both already conditioned on `feedbackMode` inside ExerciseItem,
 * independent of the hideControls/batching change.
 */
export function ComprehensionStep({
  exercises,
  dialogues,
  onContinue,
}: {
  exercises: LessonWithContent["comprehensionExercises"];
  dialogues: LessonWithContent["dialogues"];
  onContinue: () => void;
}) {
  const messages = useLessonMessages();
  const dialogue = dialogues.length === 1 ? dialogues[0] : null;
  const canListenFirst = Boolean(dialogue && dialogue.lines.length > 0);
  const [questionsRevealed, setQuestionsRevealed] = useState(!canListenFirst);

  const [answers, setAnswers] = useState<Record<string, ExerciseAnswer | null>>(
    {},
  );
  const [results, setResults] = useState<Record<
    string,
    ExerciseSubmitResult
  > | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allExerciseIds = useMemo(
    () => exercises.map((exercise) => exercise.id),
    [exercises],
  );
  const allAnswered = allExerciseIds.every((id) => answers[id] != null);

  function handleAnswerChange(
    exerciseId: string,
    answer: ExerciseAnswer | null,
  ) {
    setAnswers((previous) => ({ ...previous, [exerciseId]: answer }));
  }

  async function handleCheckAnswers() {
    setChecking(true);
    setError(null);
    const payload = allExerciseIds
      .map((exerciseId) => ({ exerciseId, answer: answers[exerciseId] }))
      .filter(
        (entry): entry is { exerciseId: string; answer: ExerciseAnswer } =>
          entry.answer != null,
      );
    try {
      const graded = await submitExerciseAttemptsAction(payload);
      setResults(graded);
    } catch {
      setError(messages.comprehension.error);
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <HanAvatar pose="curious" size={32} />
        <SectionTitle>{messages.comprehension.title}</SectionTitle>
      </div>

      {canListenFirst && dialogue && !questionsRevealed && (
        <div className="flex flex-col gap-3 rounded-panel border border-accent-500 bg-surface p-4">
          <div className="flex items-center gap-2">
            <Headphones className="size-5 text-accent-300" aria-hidden="true" />
            <Body className="font-display text-[1.1rem]">
              {messages.comprehension.listenFirst}
            </Body>
          </div>
          <Caption>{messages.comprehension.listenDescription}</Caption>
          <ConversationPlayer
            dialogueId={dialogue.id}
            messages={messages.audio.conversation}
          />
          <Button
            type="button"
            variant="primary"
            className="self-start"
            onClick={() => setQuestionsRevealed(true)}
          >
            {messages.comprehension.ready}
          </Button>
        </div>
      )}

      {questionsRevealed &&
        (exercises.length > 0 ? (
          <>
            <div
              className="flex flex-col gap-3"
              style={{
                animation:
                  "card-slide-in var(--duration-slow) var(--ease-standard)",
              }}
            >
              {exercises.map((exercise) => (
                <ExerciseItem
                  key={exercise.id}
                  item={exercise}
                  feedbackMode="assessment"
                  hideControls
                  externalResult={results?.[exercise.id] ?? null}
                  onAnswerChange={(answer) =>
                    handleAnswerChange(exercise.id, answer)
                  }
                  onSubmit={unusedSubmit}
                  onNext={unusedNext}
                />
              ))}
            </div>

            {error && <Body className="text-error-500">{error}</Body>}

            {results ? (
              <StepContinueButton onClick={onContinue} />
            ) : (
              <Button
                type="button"
                onClick={() => void handleCheckAnswers()}
                disabled={!allAnswered || checking}
                loading={checking}
                className="self-start"
              >
                {messages.common.checkAnswers}
              </Button>
            )}
          </>
        ) : (
          <EmptyState
            title={messages.comprehension.emptyTitle}
            description={messages.comprehension.emptyDescription}
            action={{ label: messages.common.continue, onClick: onContinue }}
          />
        ))}
    </div>
  );
}
