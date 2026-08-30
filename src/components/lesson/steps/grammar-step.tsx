"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  SectionTitle,
  CardTitle,
  Body,
  ChineseText,
  Pinyin,
  Translation,
  Caption,
} from "@/components/ui/typography";
import { HanAvatar } from "@/components/ui/han-mascot";
import { AskAiButton } from "@/components/lesson/ask-ai-button";
import { AudioPlayButton } from "@/components/lesson/audio-play-button";
import { ExerciseItem } from "@/components/exercise/exercise-item";
import { StepContinueButton } from "@/components/lesson/step-continue-button";
import { useLessonDisplayPrefs } from "@/components/lesson/lesson-display-prefs";
import { getGrammarExampleAudioAction } from "@/lib/actions/grammar-interactivity";
import { submitExerciseAttemptsAction } from "@/lib/actions/exercise-progress";
import type { ExerciseAnswer, ExerciseSubmitResult } from "@/lib/exercise-progress";
import type { LessonWithContent } from "@/lib/content/lesson-data";

/** A stub ExerciseItem never actually calls in hideControls mode - its own Submit/Next buttons are hidden, so onSubmit/onNext are unreachable, but the props are still required. */
async function unusedSubmit(): Promise<ExerciseSubmitResult> {
  return { isCorrect: null, explanation: null, correctOptionId: null };
}
function unusedNext(): void {}

/**
 * Redesigned 2026-08-08 (user request): real depth for intermediate/
 * advanced learners, not a 2-line summary - a richer AI-generated
 * explanation, more examples with audio, and real practice exercises
 * scoped to the specific point (reusing the Exercise/ExerciseSequence
 * infra Comprehension already uses, via `Exercise.grammarPointId`).
 * Everything is generated once and cached (Phase B's pattern), not
 * regenerated per learner - see src/lib/grammar-interactivity.ts.
 * Examples and practice exercises both arrive already loaded server-side
 * (content/grammar.ts's getGrammarForLesson) - no client fetch for either
 * (exercises dropped 2026-08-19, project/learning-journey-optimization.md
 * Facet B - examples were already dropped 2026-08-19 earlier the same day,
 * project/db-operations-optimization.md Tier 2).
 *
 * Practice redesigned again 2026-08-19 (same day, user request): every
 * exercise across every grammar point on this page shows at once (no more
 * "Submit -> see result -> Next question" repeated per exercise, which
 * felt tedious with several grammar points on one page). One "Check
 * answers" button at the bottom grades the whole page in a single batched
 * call (`submitExerciseAttemptsAction`/`recordExerciseAttempts`) instead
 * of one round trip per exercise, then the same spot becomes "Continue"
 * once results are in - matching the Vocabulary Step's "answer everything
 * for this word, one Continue" shape as closely as real server-side
 * grading (never trust a client-supplied correctness) allows.
 */
export function GrammarStep({
  grammar,
  onContinue,
}: {
  grammar: LessonWithContent["grammar"];
  onContinue: () => void;
}) {
  const [answers, setAnswers] = useState<Record<string, ExerciseAnswer | null>>({});
  const [results, setResults] = useState<Record<string, ExerciseSubmitResult> | null>(
    null,
  );
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allExerciseIds = useMemo(
    () => grammar.flatMap((g) => g.grammarPoint.exercises.map((exercise) => exercise.id)),
    [grammar],
  );
  const allAnswered = allExerciseIds.every((id) => answers[id] != null);

  function handleAnswerChange(exerciseId: string, answer: ExerciseAnswer | null) {
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
      setError("Couldn't check your answers right now. Please try again.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <HanAvatar pose="curious" size={32} />
        <SectionTitle>Grammar</SectionTitle>
      </div>

      {grammar.map(({ grammarPoint }) => (
        <GrammarPointCard
          key={grammarPoint.id}
          grammarPoint={grammarPoint}
          onAnswerChange={handleAnswerChange}
          results={results}
        />
      ))}

      {error && <Body className="text-error-500">{error}</Body>}

      {results || allExerciseIds.length === 0 ? (
        <StepContinueButton onClick={onContinue} />
      ) : (
        <Button
          type="button"
          onClick={() => void handleCheckAnswers()}
          disabled={!allAnswered || checking}
          loading={checking}
          className="self-start"
        >
          Check answers
        </Button>
      )}
    </div>
  );
}

function GrammarPointCard({
  grammarPoint,
  onAnswerChange,
  results,
}: {
  grammarPoint: LessonWithContent["grammar"][number]["grammarPoint"];
  onAnswerChange: (exerciseId: string, answer: ExerciseAnswer | null) => void;
  results: Record<string, ExerciseSubmitResult> | null;
}) {
  const { showPinyin, showTranslation } = useLessonDisplayPrefs();
  const explanation = grammarPoint.explanation;
  // Both already loaded server-side (content/grammar.ts's
  // getGrammarForLesson) - no client fetch needed for either.
  const examples = grammarPoint.examples;
  const exercises = grammarPoint.exercises;

  return (
    <Card
      className="flex flex-col gap-4"
      style={{ animation: "card-slide-in var(--duration-slow) var(--ease-standard)" }}
    >
      <div className="flex flex-col gap-1">
        <CardTitle>{grammarPoint.name}</CardTitle>
        <span className="w-fit rounded-control bg-elevated px-2.5 py-1 font-mono text-supporting text-accent-300">
          {grammarPoint.structure}
        </span>
        {grammarPoint.communicationPurpose && (
          <Caption>{grammarPoint.communicationPurpose}</Caption>
        )}
      </div>

      <div className="flex flex-col gap-2 whitespace-pre-line">
        <Caption className="font-semibold text-accent-300">Explanation</Caption>
        <Body className="text-text-secondary">{explanation}</Body>
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-3">
        <Caption className="font-semibold text-accent-300">Examples</Caption>
        {examples.map((example) => (
          <div
            key={example.id}
            className="flex gap-2 border-t border-border pt-2 first:border-t-0 first:pt-0"
          >
            <AudioPlayButton
              label={`example ${example.chineseText}`}
              fetchUrl={() => getGrammarExampleAudioAction(example.id)}
            />
            <div>
              <ChineseText>{example.chineseText}</ChineseText>
              {showPinyin && <Pinyin>{example.pinyin}</Pinyin>}
              {showTranslation && (
                <Translation>{example.translation}</Translation>
              )}
            </div>
          </div>
        ))}
      </div>

      {grammarPoint.commonMistake && (
        // Fixed during Phase 8 (consistency pass): warning token, not the
        // brand jade "success" color, since this is a caution.
        <Body className="rounded-control bg-warning-500/15 px-3 py-2 text-warning-500">
          Common mistake: {grammarPoint.commonMistake}
        </Body>
      )}

      <div className="flex flex-col gap-3 border-t border-accent-500 pt-3">
        <Caption className="font-semibold text-accent-300">Practice</Caption>
        {exercises.length > 0 ? (
          exercises.map((exercise) => (
            <ExerciseItem
              key={exercise.id}
              item={exercise}
              hideControls
              externalResult={results?.[exercise.id] ?? null}
              onAnswerChange={(answer) => onAnswerChange(exercise.id, answer)}
              onSubmit={unusedSubmit}
              onNext={unusedNext}
            />
          ))
        ) : (
          <Caption>No practice questions available right now.</Caption>
        )}
      </div>

      <AskAiButton
        label="Ask AI about this grammar point"
        contextPatch={{
          selectedGrammarPoint: {
            name: grammarPoint.name,
            structure: grammarPoint.structure,
          },
        }}
      />
    </Card>
  );
}
