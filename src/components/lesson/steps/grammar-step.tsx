"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import type {
  ExerciseAnswer,
  ExerciseSubmitResult,
} from "@/lib/exercise-progress";
import type { LessonWithContent } from "@/lib/content/lesson-data";
import { useLessonMessages } from "@/components/lesson/lesson-messages";
import { formatMessage } from "@/i18n/format";

/** A stub ExerciseItem never actually calls in hideControls mode - its own Submit/Next buttons are hidden, so onSubmit/onNext are unreachable, but the props are still required. */
async function unusedSubmit(): Promise<ExerciseSubmitResult> {
  return { isCorrect: null, explanation: null, correctOptionId: null };
}
function unusedNext(): void {}

type GrammarPoint = LessonWithContent["grammar"][number]["grammarPoint"];
type GrammarExercise = GrammarPoint["exercises"][number];

/**
 * One screen = one grammar point's explanation (shown only on that point's
 * first exercise screen) plus at most one exercise - a point with zero
 * exercises still gets its own explanation-only screen so it isn't
 * silently dropped.
 */
interface GrammarScreen {
  grammarPoint: GrammarPoint;
  exercise: GrammarExercise | null;
  showExplanation: boolean;
}

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
 *
 * Restructured again 2026-09-26 (user request: "pasa el mismo problema en
 * gramatica" - the same too-much-scrolling problem Vocabulary had): every
 * point and exercise used to render stacked on one long page. Now it's
 * one screen at a time (Duolingo-style), navigated with Next/Back, mirroring
 * the Vocabulary Step's restructuring the same day. This is a presentation
 * layer only - `answers`, `allExerciseIds` and the single batched
 * `handleCheckAnswers` call below are untouched, so this adds zero Prisma
 * round trips (the user was explicit: "que no gaste necesariamente las
 * transacciones de prisma porque ya he tenido un problema con esto").
 *
 * Fixed the same day (user report, "reiterativa"): pagination reused one
 * `ExerciseItem` instance across screens without a `key`, so its internal
 * per-item state (selected option, built sentence, matched pairs) never
 * reset between different exercises - now fixed at the render call below
 * with `key={exercise.id}` + `initialAnswer` (exercise-item.tsx). Also
 * added: answering an exercise now locks it immediately and auto-advances
 * (user request, "lo mismo que vocabulario... ya no la puedes cambiar, y
 * sigues") - still without a per-exercise server call or exposing the
 * correct answer to the client (`ExerciseItem`'s existing anti-cheat
 * design), so the green/red reveal still only arrives once the same single
 * batched grade lands, which now fires automatically after the last
 * exercise instead of waiting for a manual tap. A re-entrancy guard on
 * `handleCheckAnswers` (missing before, on every code path that could call
 * it) stops a double-fire - manual + auto racing, or a fast double-tap -
 * from submitting the same batch twice.
 */
export function GrammarStep({
  grammar,
  onContinue,
}: {
  grammar: LessonWithContent["grammar"];
  onContinue: () => void;
}) {
  const messages = useLessonMessages();
  const [answers, setAnswers] = useState<Record<string, ExerciseAnswer | null>>(
    {},
  );
  const [results, setResults] = useState<Record<
    string,
    ExerciseSubmitResult
  > | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [screenIndex, setScreenIndex] = useState(0);

  const allExerciseIds = useMemo(
    () =>
      grammar.flatMap((g) =>
        g.grammarPoint.exercises.map((exercise) => exercise.id),
      ),
    [grammar],
  );
  const allAnswered = allExerciseIds.every((id) => answers[id] != null);

  const screens = useMemo<GrammarScreen[]>(
    () =>
      grammar.flatMap(({ grammarPoint }): GrammarScreen[] =>
        grammarPoint.exercises.length > 0
          ? grammarPoint.exercises.map((exercise, i) => ({
              grammarPoint,
              exercise,
              showExplanation: i === 0,
            }))
          : [{ grammarPoint, exercise: null, showExplanation: true }],
      ),
    [grammar],
  );
  const currentScreen = screens[Math.min(screenIndex, screens.length - 1)];
  const isLastScreen = screenIndex >= screens.length - 1;
  const canAdvance =
    !currentScreen?.exercise || answers[currentScreen.exercise.id] != null;

  function handleAnswerChange(
    exerciseId: string,
    answer: ExerciseAnswer | null,
  ) {
    setAnswers((previous) => ({ ...previous, [exerciseId]: answer }));
  }

  // Auto-advance once the CURRENT screen's exercise has just been answered
  // for the first time - `advancedExerciseIds` makes this fire exactly once
  // per exercise, so paging Back to review an already-answered screen never
  // re-triggers it. The delay just lets the "locked in" state (ExerciseItem's
  // `locked` prop) register visually before the screen changes underneath it.
  const advancedExerciseIds = useRef<Set<string>>(new Set());
  useEffect(() => {
    const exercise = currentScreen?.exercise;
    if (!exercise || answers[exercise.id] == null) return;
    if (advancedExerciseIds.current.has(exercise.id)) return;
    advancedExerciseIds.current.add(exercise.id);

    // The state updater passed to setScreenIndex must stay pure (React may
    // invoke it more than once) - handleCheckAnswers is a real side effect,
    // so it's called here, outside the updater, guarded by isLastScreen
    // captured from this same render.
    const timer = setTimeout(() => {
      if (isLastScreen) {
        void handleCheckAnswers();
      } else {
        setScreenIndex((i) => Math.min(screens.length - 1, i + 1));
      }
    }, 450);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, currentScreen, screens]);

  async function handleCheckAnswers() {
    if (checking || results) return;
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

  function handleBack() {
    setScreenIndex((i) => Math.max(0, i - 1));
  }
  function handleNext() {
    setScreenIndex((i) => Math.min(screens.length - 1, i + 1));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <HanAvatar pose="curious" size={32} />
        <SectionTitle>{messages.grammar.title}</SectionTitle>
      </div>

      {screens.length > 1 && (
        <Caption>
          {formatMessage(messages.grammar.screenProgress, {
            current: screenIndex + 1,
            total: screens.length,
          })}
        </Caption>
      )}

      {currentScreen && (
        <GrammarScreenCard
          screen={currentScreen}
          answers={answers}
          onAnswerChange={handleAnswerChange}
          results={results}
        />
      )}

      {error && <Body className="text-error-500">{error}</Body>}

      <div className="flex items-center justify-between gap-3">
        {screenIndex > 0 ? (
          <Button type="button" variant="secondary" onClick={handleBack}>
            {messages.common.back}
          </Button>
        ) : (
          <span />
        )}

        {screens.length === 0 ? (
          <StepContinueButton onClick={onContinue} />
        ) : results ? (
          // Once graded, every exercise already has an answer, so Back/Next
          // just page through the results for review - Continue is always
          // available too, from any screen, so reviewing is optional.
          <div className="flex items-center gap-3">
            {!isLastScreen && (
              <Button type="button" variant="secondary" onClick={handleNext}>
                {messages.common.next}
              </Button>
            )}
            <StepContinueButton onClick={onContinue} />
          </div>
        ) : isLastScreen ? (
          <Button
            type="button"
            onClick={() => void handleCheckAnswers()}
            disabled={!allAnswered || checking}
            loading={checking}
          >
            {messages.common.checkAnswers}
          </Button>
        ) : (
          <Button type="button" onClick={handleNext} disabled={!canAdvance}>
            {messages.common.next}
          </Button>
        )}
      </div>
    </div>
  );
}

function GrammarScreenCard({
  screen,
  answers,
  onAnswerChange,
  results,
}: {
  screen: GrammarScreen;
  answers: Record<string, ExerciseAnswer | null>;
  onAnswerChange: (exerciseId: string, answer: ExerciseAnswer | null) => void;
  results: Record<string, ExerciseSubmitResult> | null;
}) {
  const messages = useLessonMessages();
  const { showPinyin, showTranslation } = useLessonDisplayPrefs();
  const { grammarPoint, exercise, showExplanation } = screen;

  return (
    <Card
      className="flex flex-col gap-4"
      style={{
        animation: "card-slide-in var(--duration-slow) var(--ease-standard)",
      }}
    >
      <div className="flex flex-col gap-1">
        <CardTitle>{grammarPoint.name}</CardTitle>
        <span className="w-fit rounded-control bg-elevated px-2.5 py-1 font-mono text-supporting text-accent-300">
          {grammarPoint.structure}
        </span>
        {showExplanation && grammarPoint.communicationPurpose && (
          <Caption>{grammarPoint.communicationPurpose}</Caption>
        )}
      </div>

      {showExplanation && (
        <>
          <div className="flex flex-col gap-2 whitespace-pre-line">
            <Caption className="font-semibold text-accent-300">
              {messages.grammar.explanation}
            </Caption>
            <Body className="text-text-secondary">
              {grammarPoint.explanation}
            </Body>
          </div>

          <div className="flex flex-col gap-2 border-t border-border pt-3">
            <Caption className="font-semibold text-accent-300">
              {messages.grammar.examples}
            </Caption>
            {grammarPoint.examples.map((example) => (
              <div
                key={example.id}
                className="flex gap-2 border-t border-border pt-2 first:border-t-0 first:pt-0"
              >
                <AudioPlayButton
                  label={formatMessage(messages.audio.example, {
                    text: example.chineseText,
                  })}
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
              {formatMessage(messages.grammar.commonMistake, {
                mistake: grammarPoint.commonMistake,
              })}
            </Body>
          )}
        </>
      )}

      <div className="flex flex-col gap-3 border-t border-accent-500 pt-3">
        <Caption className="font-semibold text-accent-300">
          {messages.grammar.practice}
        </Caption>
        {exercise ? (
          <ExerciseItem
            key={exercise.id}
            item={exercise}
            hideControls
            externalResult={results?.[exercise.id] ?? null}
            initialAnswer={answers[exercise.id] ?? null}
            locked={answers[exercise.id] != null}
            onAnswerChange={(answer) => onAnswerChange(exercise.id, answer)}
            onSubmit={unusedSubmit}
            onNext={unusedNext}
          />
        ) : (
          <Caption>{messages.grammar.noPractice}</Caption>
        )}
      </div>

      {showExplanation && (
        <AskAiButton
          label={messages.ai.aboutGrammar}
          contextPatch={{
            selectedGrammarPoint: {
              name: grammarPoint.name,
              structure: grammarPoint.structure,
            },
          }}
        />
      )}
    </Card>
  );
}
