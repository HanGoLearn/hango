"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Body, Caption } from "@/components/ui/typography";
import { InformationBanner } from "@/components/ui/banner";
import { HanAvatar } from "@/components/ui/han-mascot";
import { cn } from "@/lib/cn";
import type {
  ClientExercise,
  ExerciseAnswer,
  ExerciseSubmitResult,
} from "@/lib/exercise-progress";
import { useLessonMessages } from "@/components/lesson/lesson-messages";

/**
 * The shared Exercise Container (7.1) - one interactive item, all 6
 * `ExerciseType`s (7.2). Grading always happens through `onSubmit` (a
 * server call), never locally: this component only ever renders the
 * already-sanitized `ClientExercise` shape, which carries no
 * correct-answer data to check against.
 *
 * Accessibility (7.3): every interaction is a native `<button>`/`<input>`
 * (keyboard + touch for free), ordering/matching are click-based instead
 * of drag-only, and correctness is always paired with an icon + text, not
 * color alone.
 *
 * `hideControls`/`externalResult`/`onAnswerChange` (2026-08-19, Grammar
 * batching - project/learning-journey-optimization.md): an opt-in
 * "controlled" mode for a parent that wants to collect several exercises'
 * answers and submit them together in one batched call, instead of this
 * component managing its own per-item submit/result. Every existing call
 * site (Comprehension, Guided Practice, Quiz) leaves these unset and is
 * completely unaffected - `result` still comes from this component's own
 * `onSubmit` call exactly as before.
 */
export function ExerciseItem({
  item,
  onSubmit,
  onNext,
  nextLabel,
  feedbackMode = "learning",
  hideControls = false,
  externalResult,
  onAnswerChange,
}: {
  item: ClientExercise;
  onSubmit: (answer: ExerciseAnswer) => Promise<ExerciseSubmitResult>;
  onNext: () => void;
  nextLabel?: string;
  feedbackMode?: "learning" | "assessment";
  /** When true: no internal Submit/Next/Retry buttons - a parent renders its own single batched control instead. */
  hideControls?: boolean;
  /** Only read when `hideControls` - the parent's batched grading result for this specific exercise, once available. */
  externalResult?: ExerciseSubmitResult | null;
  /** Only called when `hideControls` - fires whenever the locally-built answer changes, so the parent can collect it. */
  onAnswerChange?: (answer: ExerciseAnswer | null) => void;
}) {
  const messages = useLessonMessages();
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [pool, setPool] = useState<string[]>(item.tokens);
  const [built, setBuilt] = useState<string[]>([]);
  const [pairs, setPairs] = useState<[string, string][]>([]);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [internalResult, setInternalResult] =
    useState<ExerciseSubmitResult | null>(null);
  const [visibleHints, setVisibleHints] = useState(0);
  const reduceMotion = useReducedMotion();

  const result = hideControls ? (externalResult ?? null) : internalResult;
  const usedRights = new Set(pairs.map(([, right]) => right));
  const usedLefts = new Set(pairs.map(([left]) => left));

  function buildAnswer(): ExerciseAnswer | null {
    switch (item.type) {
      case "MULTIPLE_CHOICE":
      case "TRUE_FALSE":
        return selectedOptionId
          ? { type: item.type, optionId: selectedOptionId }
          : null;
      case "FILL_IN_BLANK":
        return textAnswer.trim()
          ? { type: "FILL_IN_BLANK", text: textAnswer }
          : null;
      case "SENTENCE_ORDERING":
        return built.length === item.tokens.length
          ? { type: "SENTENCE_ORDERING", order: built }
          : null;
      case "MATCHING":
        return pairs.length === item.leftTerms.length
          ? { type: "MATCHING", pairs }
          : null;
      case "SHORT_RESPONSE":
        return textAnswer.trim()
          ? { type: "SHORT_RESPONSE", text: textAnswer }
          : null;
    }
  }

  const currentAnswer = buildAnswer();

  useEffect(() => {
    if (!hideControls) return;
    onAnswerChange?.(currentAnswer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hideControls, selectedOptionId, textAnswer, built, pairs]);

  async function handleSubmit() {
    const answer = buildAnswer();
    if (!answer) return;
    setSubmitting(true);
    const submitResult = await onSubmit(answer);
    setSubmitting(false);
    setInternalResult(submitResult);
  }

  function handleRetry() {
    setInternalResult(null);
    setSelectedOptionId(null);
    setTextAnswer("");
    setPool(item.tokens);
    setBuilt([]);
    setPairs([]);
    setSelectedLeft(null);
  }

  const canSubmit = currentAnswer !== null;

  return (
    <Card className="flex flex-col gap-4">
      <Body className="font-medium">{item.prompt}</Body>

      {(item.type === "MULTIPLE_CHOICE" || item.type === "TRUE_FALSE") && (
        <div className="flex flex-col gap-2">
          {item.options.map((option) => {
            const isSelected = option.id === selectedOptionId;
            const isRevealedCorrect =
              !!result &&
              (feedbackMode === "learning"
                ? option.id === result.correctOptionId
                : result.isCorrect === true && isSelected);
            const isRevealedWrong =
              !!result && isSelected && result.isCorrect === false;
            return (
              <button
                key={option.id}
                type="button"
                disabled={!!result}
                onClick={() => setSelectedOptionId(option.id)}
                aria-pressed={isSelected}
                className={cn(
                  "flex items-center justify-between rounded-2xl border-2 border-border px-4 py-3 text-left font-interface text-body transition-colors duration-fast ease-standard",
                  isSelected &&
                    !result &&
                    "border-primary-500 bg-primary-500/15",
                  isRevealedCorrect && "border-success-500 bg-success-500/15",
                  isRevealedWrong && "border-error-500 bg-error-500/15",
                  "disabled:opacity-100",
                )}
              >
                {option.content}
                {isSelected && !result && (
                  <Check
                    className="size-4 text-primary-100"
                    aria-hidden="true"
                  />
                )}
                {isRevealedCorrect && (
                  <Check
                    className="size-4 text-success-50"
                    aria-hidden="true"
                  />
                )}
                {isRevealedWrong && (
                  <X className="size-4 text-error-50" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {item.type === "FILL_IN_BLANK" && (
        <Input
          value={textAnswer}
          onChange={(event) => setTextAnswer(event.target.value)}
          disabled={!!result}
          placeholder={messages.exercise.answerPlaceholder}
          aria-label={messages.exercise.answerLabel}
        />
      )}

      {item.type === "SHORT_RESPONSE" && (
        <Textarea
          value={textAnswer}
          onChange={(event) => setTextAnswer(event.target.value)}
          disabled={!!result}
          placeholder={messages.exercise.responsePlaceholder}
          aria-label={messages.exercise.responseLabel}
          showCharacterCount
          maxLength={500}
        />
      )}

      {item.type === "SENTENCE_ORDERING" && (
        <div className="flex flex-col gap-2">
          <div className="flex min-h-11 flex-wrap gap-2 rounded-2xl border-2 border-dashed border-border p-2">
            {built.length === 0 && (
              <Caption>{messages.exercise.tapInOrder}</Caption>
            )}
            {built.map((token, index) => (
              <button
                key={`${token}-${index}`}
                type="button"
                disabled={!!result}
                onClick={() => {
                  setBuilt(built.filter((_, i) => i !== index));
                  setPool([...pool, token]);
                }}
                className="rounded-full border-2 border-primary-500 bg-primary-500/15 px-3 py-1 font-chinese text-body"
              >
                {token}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {pool.map((token, index) => (
              <button
                key={`${token}-${index}`}
                type="button"
                disabled={!!result}
                onClick={() => {
                  setPool(pool.filter((_, i) => i !== index));
                  setBuilt([...built, token]);
                }}
                className="rounded-full border-2 border-border px-3 py-1 font-chinese text-body"
              >
                {token}
              </button>
            ))}
          </div>
        </div>
      )}

      {item.type === "MATCHING" && (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              {item.leftTerms.map((term) => (
                <button
                  key={term}
                  type="button"
                  disabled={!!result || usedLefts.has(term)}
                  aria-pressed={selectedLeft === term}
                  onClick={() => setSelectedLeft(term)}
                  className={cn(
                    "rounded-2xl border-2 border-border px-3 py-1.5 text-left font-interface text-body",
                    selectedLeft === term &&
                      "border-primary-500 bg-primary-500/15",
                    usedLefts.has(term) && "opacity-40",
                  )}
                >
                  {term}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-1.5">
              {item.rightTerms.map((term) => (
                <button
                  key={term}
                  type="button"
                  disabled={!!result || !selectedLeft || usedRights.has(term)}
                  onClick={() => {
                    if (!selectedLeft) return;
                    setPairs([...pairs, [selectedLeft, term]]);
                    setSelectedLeft(null);
                  }}
                  className={cn(
                    "rounded-2xl border-2 border-border px-3 py-1.5 text-left font-interface text-body",
                    usedRights.has(term) && "opacity-40",
                  )}
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
          {pairs.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {pairs.map(([left, right]) => (
                <button
                  key={`${left}-${right}`}
                  type="button"
                  disabled={!!result}
                  onClick={() =>
                    setPairs(
                      pairs.filter(([l, r]) => !(l === left && r === right)),
                    )
                  }
                  className="rounded-full border-2 border-success-500 bg-success-500/15 px-3 py-1 font-interface text-caption"
                >
                  {left} → {right}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {item.hints.length > 0 && !result && (
        <div className="flex flex-col gap-1">
          {item.hints.slice(0, visibleHints).map((hint) => (
            <Caption key={hint.level}>{hint.text}</Caption>
          ))}
          {visibleHints < item.hints.length && (
            <Button
              type="button"
              variant="tertiary"
              className="self-start px-0"
              onClick={() => setVisibleHints(visibleHints + 1)}
            >
              {messages.common.showHint}
            </Button>
          )}
        </div>
      )}

      {result && (
        <div className="flex items-start gap-3">
          {/* Han's reaction (2026-08-29, Milestone 5) - layered next to the
              existing color/icon/banner feedback, never replacing it (the
              banner alone still carries the full meaning for anyone who
              has motion/mascot reduced or just isn't looking at Han). No
              reaction for a null isCorrect (SHORT_RESPONSE's "Submitted."
              case) - there's no right/wrong for Han to react to yet. */}
          {result.isCorrect !== null && (
            <motion.div
              className="shrink-0"
              initial={reduceMotion ? undefined : { opacity: 0, scale: 0.6 }}
              animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <HanAvatar
                pose={result.isCorrect ? "celebrating" : "wrong"}
                size={40}
              />
            </motion.div>
          )}
          <InformationBanner
            className="flex-1"
            variant={
              result.isCorrect === true
                ? "success"
                : result.isCorrect === false
                  ? "error"
                  : "info"
            }
          >
            <span className="flex items-center gap-1.5 font-medium">
              {result.isCorrect === true && (
                <Check className="size-4" aria-hidden="true" />
              )}
              {result.isCorrect === false && (
                <X className="size-4" aria-hidden="true" />
              )}
              {result.isCorrect === true
                ? messages.common.correct
                : result.isCorrect === false
                  ? messages.common.notQuite
                  : messages.common.submitted}
            </span>
            {feedbackMode === "learning" &&
              result.explanation &&
              ` ${result.explanation}`}
          </InformationBanner>
        </div>
      )}

      {!hideControls && !result && (
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          loading={submitting}
          className="self-start"
        >
          {messages.common.submit}
        </Button>
      )}

      {!hideControls &&
        feedbackMode === "learning" &&
        result?.isCorrect === false && (
          <Button
            type="button"
            variant="secondary"
            onClick={handleRetry}
            className="self-start"
          >
            {messages.common.tryAgain}
          </Button>
        )}

      {!hideControls &&
        result &&
        (feedbackMode === "assessment" || result.isCorrect !== false) && (
          <Button type="button" onClick={onNext} className="self-start">
            {nextLabel ?? messages.common.continue}
          </Button>
        )}
    </Card>
  );
}
